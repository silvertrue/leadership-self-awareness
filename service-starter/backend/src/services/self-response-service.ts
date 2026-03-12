import { DIMENSIONS, type SelfResponse } from '../types/survey';
import type { ParticipantRepository } from '../repositories/participant-repository';
import type { SelfResponseRepository } from '../repositories/self-response-repository';
import { validateSelfResponseInput } from '../lib/validation';

export class SelfResponseService {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly selfResponseRepository: SelfResponseRepository
  ) {}

  async getSelfSurveyByToken(token: string) {
    const participant = await this.participantRepository.findBySelfToken(token);
    if (!participant) throw new Error('Participant not found for self token.');
    const response = await this.selfResponseRepository.findByParticipantId(participant.participantId);
    return {
      participant,
      surveyMeta: {
        dimensions: DIMENSIONS,
        status: response?.status ?? 'not_started',
        submittedAt: response?.submittedAt ?? null
      },
      response: response ?? {}
    };
  }

  async saveSelfSurvey(token: string, input: SelfResponse): Promise<void> {
    const participant = await this.participantRepository.findBySelfToken(token);
    if (!participant) throw new Error('Participant not found for self token.');
    if (participant.participantId !== input.participantId) throw new Error('Participant mismatch.');
    const errors = validateSelfResponseInput(input);
    if (errors.length > 0) throw new Error(errors.join(' '));
    await this.selfResponseRepository.upsert({ ...input, status: 'submitted' });
  }
}
