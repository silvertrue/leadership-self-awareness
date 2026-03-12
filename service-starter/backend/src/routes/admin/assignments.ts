import type { ImportPeerAssignmentsRequest } from '../../types/api';
import type { AssignmentRepository } from '../../repositories/assignment-repository';

export class AdminAssignmentsRoute {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async import(body: ImportPeerAssignmentsRequest) {
    await this.assignmentRepository.importMany(body.peerAssignments);
    return { ok: true, imported: body.peerAssignments.length };
  }
}
