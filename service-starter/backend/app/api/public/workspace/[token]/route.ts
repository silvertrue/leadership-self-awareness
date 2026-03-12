import { createContainer } from '@/src/lib/container';
import { fail, ok } from '@/src/lib/http';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const container = createContainer();
    const selfData = await container.services.selfResponseService.getSelfSurveyByToken(token);
    const assignments = await container.repositories.assignmentRepository.findByResponderId(selfData.participant.participantId);

    const peerToken = assignments[0]?.peerToken ?? null;
    let peerCompleted = 0;
    let peerAssignments = assignments.length;
    let peerSubmitted = false;

    if (peerToken) {
      const peerData = await container.services.peerResponseService.getPeerSurveyByToken(peerToken);
      peerCompleted = peerData.assignments.filter((assignment) => assignment.status === 'completed').length;
      peerAssignments = peerData.assignments.length;
      peerSubmitted = peerData.responder.submitted;
    }

    return ok({
      ...selfData,
      linked: {
        peerToken,
        reportToken: selfData.participant.reportToken ?? null,
        peerAssignments,
        peerCompleted,
        peerSubmitted
      }
    });
  } catch (error) {
    return fail(error, 404);
  }
}