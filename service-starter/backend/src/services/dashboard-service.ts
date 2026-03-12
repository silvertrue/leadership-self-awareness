import type { AdminDashboardResponse } from '../types/api';
import type { ParticipantRepository } from '../repositories/participant-repository';
import type { AssignmentRepository } from '../repositories/assignment-repository';
import type { SelfResponseRepository } from '../repositories/self-response-repository';
import type { PeerResponseRepository } from '../repositories/peer-response-repository';
import type { ReportRunRepository } from '../repositories/report-run-repository';

export class DashboardService {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly assignmentRepository: AssignmentRepository,
    private readonly selfResponseRepository: SelfResponseRepository,
    private readonly peerResponseRepository: PeerResponseRepository,
    private readonly reportRunRepository: ReportRunRepository
  ) {}

  async getDashboardSummary(): Promise<AdminDashboardResponse> {
    const [participants, assignments, selfResponses, peerResponses, responderSubmissions] = await Promise.all([
      this.participantRepository.listAll(),
      this.assignmentRepository.listAll(),
      this.selfResponseRepository.listAll(),
      this.peerResponseRepository.listAll(),
      this.peerResponseRepository.listResponderSubmissions()
    ]);

    const latestReportRuns = await Promise.all(
      participants.map(async (participant) => ({
        participantId: participant.participantId,
        run: await this.reportRunRepository.findLatestByParticipantId(participant.participantId)
      }))
    );

    const selfCompletedSet = new Set(
      selfResponses.filter((response) => response.status === 'submitted').map((response) => response.participantId)
    );
    const peerCompletedAssignmentSet = new Set(
      peerResponses.filter((response) => response.status === 'submitted').map((response) => response.assignmentId)
    );
    const responderSubmittedSet = new Set(
      responderSubmissions.filter((submission) => submission.status === 'submitted').map((submission) => submission.responderId)
    );
    const reportRunMap = new Map(latestReportRuns.map(({ participantId, run }) => [participantId, run]));

    const inboundAssignmentCountByParticipant = new Map<string, number>();
    const inboundSubmittedCountByParticipant = new Map<string, number>();
    const outboundAssignmentCountByResponder = new Map<string, number>();
    const outboundSubmittedCountByResponder = new Map<string, number>();
    const targetCountByResponder = new Map<string, number>();

    for (const assignment of assignments) {
      inboundAssignmentCountByParticipant.set(
        assignment.targetId,
        (inboundAssignmentCountByParticipant.get(assignment.targetId) ?? 0) + 1
      );
      outboundAssignmentCountByResponder.set(
        assignment.responderId,
        (outboundAssignmentCountByResponder.get(assignment.responderId) ?? 0) + 1
      );
      targetCountByResponder.set(
        assignment.responderId,
        (targetCountByResponder.get(assignment.responderId) ?? 0) + 1
      );

      if (peerCompletedAssignmentSet.has(assignment.assignmentId)) {
        inboundSubmittedCountByParticipant.set(
          assignment.targetId,
          (inboundSubmittedCountByParticipant.get(assignment.targetId) ?? 0) + 1
        );
        outboundSubmittedCountByResponder.set(
          assignment.responderId,
          (outboundSubmittedCountByResponder.get(assignment.responderId) ?? 0) + 1
        );
      }
    }

    const participantRows = participants.map((participant) => {
      const expectedPeerCount = inboundAssignmentCountByParticipant.get(participant.participantId) ?? 0;
      const peerResponseCount = inboundSubmittedCountByParticipant.get(participant.participantId) ?? 0;
      const selfCompleted = selfCompletedSet.has(participant.participantId);
      const generatedReport = reportRunMap.get(participant.participantId);
      const derivedReady = selfCompleted && expectedPeerCount > 0 && peerResponseCount >= expectedPeerCount;
      const reportReady = generatedReport?.reportStatus === 'ready' || generatedReport?.reportStatus === 'exported' || derivedReady;

      return {
        participantId: participant.participantId,
        nameKo: participant.nameKo,
        teamName: participant.teamName,
        groupName: participant.groupName,
        selfCompleted,
        peerResponseCount,
        expectedPeerCount,
        reportReady,
        reportToken: participant.reportToken ?? null
      };
    });

    const participantRowMap = new Map(participantRows.map((participant) => [participant.participantId, participant]));

    const responderRows = participants.map((participant) => {
      const total = outboundAssignmentCountByResponder.get(participant.participantId) ?? 0;
      const completed = outboundSubmittedCountByResponder.get(participant.participantId) ?? 0;

      return {
        responderId: participant.participantId,
        nameKo: participant.nameKo,
        groupName: participant.groupName,
        completed,
        total,
        submitted: responderSubmittedSet.has(participant.participantId)
      };
    });

    const groups = Array.from(
      participants.reduce((acc, participant) => {
        const current = acc.get(participant.groupName) ?? {
          groupName: participant.groupName,
          members: 0,
          selfCompleted: 0,
          reportReady: 0,
          targetsPerPersonValues: [] as number[]
        };

        const participantRow = participantRowMap.get(participant.participantId);
        current.members += 1;
        current.selfCompleted += participantRow?.selfCompleted ? 1 : 0;
        current.reportReady += participantRow?.reportReady ? 1 : 0;
        current.targetsPerPersonValues.push(targetCountByResponder.get(participant.participantId) ?? 0);

        acc.set(participant.groupName, current);
        return acc;
      }, new Map<string, { groupName: string; members: number; selfCompleted: number; reportReady: number; targetsPerPersonValues: number[] }>())
    )
      .map(([, group]) => ({
        groupName: group.groupName,
        members: group.members,
        selfCompleted: group.selfCompleted,
        reportReady: group.reportReady,
        targetsPerPerson: group.targetsPerPersonValues.length ? Math.max(...group.targetsPerPersonValues) : 0
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName, 'ko-KR'));

    return {
      summary: {
        participantCount: participants.length,
        selfCompleted: participantRows.filter((participant) => participant.selfCompleted).length,
        peerAssignments: assignments.length,
        peerCompleted: peerCompletedAssignmentSet.size,
        peerSubmitted: responderSubmittedSet.size,
        reportReady: participantRows.filter((participant) => participant.reportReady).length
      },
      groups,
      responders: responderRows,
      participants: participantRows
    };
  }
}