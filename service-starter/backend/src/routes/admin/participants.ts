import type { ImportParticipantsRequest } from '../../types/api';
import type { ParticipantRepository } from '../../repositories/participant-repository';

export class AdminParticipantsRoute {
  constructor(private readonly participantRepository: ParticipantRepository) {}

  async import(body: ImportParticipantsRequest) {
    await this.participantRepository.importMany(body.participants);
    return { ok: true, imported: body.participants.length };
  }
}
