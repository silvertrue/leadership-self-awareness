import type { ParticipantRepository } from '../../repositories/participant-repository';
import type { ReportService } from '../../services/report-service';

export class PublicReportRoute {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly reportService: ReportService
  ) {}

  async get(token: string) {
    const participant = await this.participantRepository.findByReportToken(token);
    if (!participant) throw new Error('Participant not found for report token.');
    const report = await this.reportService.buildParticipantReport(participant.participantId);
    return {
      participant,
      reportStatus: report.reportReady ? 'ready' : 'waiting_peer',
      peerResponseCount: report.peerResponseCount,
      expectedPeerCount: report.expectedPeerCount,
      selfCompleted: report.selfCompleted,
      report
    };
  }
}
