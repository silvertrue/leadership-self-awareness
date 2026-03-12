import { DIMENSIONS, type PeerResponse, type ResponderSubmission } from '../types/survey';
import type { AssignmentRepository } from '../repositories/assignment-repository';
import type { PeerResponseRepository } from '../repositories/peer-response-repository';
import { validatePeerResponseInput } from '../lib/validation';
import { nowIso } from '../lib/time';

export class PeerResponseService {
  constructor(
    private readonly assignmentRepository: AssignmentRepository,
    private readonly peerResponseRepository: PeerResponseRepository
  ) {}

  async getPeerSurveyByToken(token: string) {
    const assignments = await this.assignmentRepository.findByPeerToken(token);
    if (assignments.length === 0) throw new Error('Assignments not found for peer token.');
    const responses = await this.peerResponseRepository.findByAssignmentIds(assignments.map((item) => item.assignmentId));
    const responseMap = new Map(responses.map((item) => [item.assignmentId, item]));
    const submission = await this.peerResponseRepository.findResponderSubmission(assignments[0].responderId);

    return {
      responder: {
        responderId: assignments[0].responderId,
        nameKo: assignments[0].responderName ?? '-',
        groupName: assignments[0].groupName,
        submitted: Boolean(submission)
      },
      dimensions: DIMENSIONS,
      assignments: assignments.map((item) => {
        const response = responseMap.get(item.assignmentId);
        const complete = response ? validatePeerResponseInput(response).length === 0 : false;
        const touched = response
          ? [response.strength1Comment, response.strength2Comment, response.growth1Comment, response.growth2Comment, response.freeMessage]
              .some((value) => String(value ?? '').trim().length > 0)
          : false;
        return {
          assignmentId: item.assignmentId,
          sequenceNo: item.sequenceNo,
          status: complete ? 'completed' : touched ? 'in_progress' : 'not_started',
          target: {
            participantId: item.targetId,
            nameKo: item.targetName ?? '-',
            teamName: item.targetTeam ?? '-'
          }
        };
      }),
      responsesByAssignment: Object.fromEntries(
        responses.map((response) => [
          response.assignmentId,
          {
            assignmentId: response.assignmentId,
            strength1: response.strength1,
            strength1Comment: response.strength1Comment,
            strength2: response.strength2,
            strength2Comment: response.strength2Comment,
            growth1: response.growth1,
            growth1Comment: response.growth1Comment,
            growth2: response.growth2,
            growth2Comment: response.growth2Comment,
            freeMessage: response.freeMessage ?? ''
          }
        ])
      ),
      currentResponse: {}
    };
  }

  async savePeerResponse(token: string, input: PeerResponse): Promise<void> {
    const assignments = await this.assignmentRepository.findByPeerToken(token);
    const assignment = assignments.find((item) => item.assignmentId === input.assignmentId);
    if (!assignment) throw new Error('Assignment does not belong to this responder token.');
    const errors = validatePeerResponseInput(input);
    if (errors.length > 0) throw new Error(errors.join(' '));
    await this.peerResponseRepository.upsert({ ...input, status: 'submitted' });
  }

  async submitResponder(token: string): Promise<ResponderSubmission> {
    const assignments = await this.assignmentRepository.findByPeerToken(token);
    if (assignments.length === 0) throw new Error('Assignments not found for peer token.');
    const responses = await this.peerResponseRepository.findByAssignmentIds(assignments.map((item) => item.assignmentId));
    const invalidAssignment = assignments.find((item) => {
      const response = responses.find((entry) => entry.assignmentId === item.assignmentId);
      return !response || validatePeerResponseInput(response).length > 0;
    });
    if (invalidAssignment) throw new Error('All assigned peer responses must be completed before final submission.');
    const payload: ResponderSubmission = {
      responderId: assignments[0].responderId,
      submittedAt: nowIso(),
      status: 'submitted'
    };
    await this.peerResponseRepository.markResponderSubmitted(payload);
    return payload;
  }
}