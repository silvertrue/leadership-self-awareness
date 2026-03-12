import type { DbClient } from '../lib/db';
import type { PeerAssignment } from '../types/survey';

function mapAssignment(row: {
  assignmentId: string;
  responderId: string;
  targetId: string;
  peerToken: string;
  sequenceNo: number;
  groupName: string;
  isActive: boolean;
  responder?: { nameKo: string } | null;
  target?: { nameKo: string; teamName: string } | null;
}): PeerAssignment {
  return {
    assignmentId: row.assignmentId,
    responderId: row.responderId,
    responderName: row.responder?.nameKo,
    targetId: row.targetId,
    targetName: row.target?.nameKo,
    targetTeam: row.target?.teamName,
    groupName: row.groupName,
    sequenceNo: row.sequenceNo,
    peerToken: row.peerToken,
    isActive: row.isActive
  };
}

export class AssignmentRepository {
  constructor(private readonly db: DbClient) {}

  async findByPeerToken(token: string): Promise<PeerAssignment[]> {
    const rows = await this.db.peerAssignment.findMany({
      where: { peerToken: token, isActive: true },
      include: { responder: true, target: true },
      orderBy: { sequenceNo: 'asc' }
    });
    return rows.map(mapAssignment);
  }

  async findByResponderId(responderId: string): Promise<PeerAssignment[]> {
    const rows = await this.db.peerAssignment.findMany({
      where: { responderId, isActive: true },
      include: { responder: true, target: true },
      orderBy: { sequenceNo: 'asc' }
    });
    return rows.map(mapAssignment);
  }
  async findByTargetId(targetId: string): Promise<PeerAssignment[]> {
    const rows = await this.db.peerAssignment.findMany({
      where: { targetId, isActive: true },
      include: { responder: true, target: true },
      orderBy: { sequenceNo: 'asc' }
    });
    return rows.map(mapAssignment);
  }

  async listAll(): Promise<PeerAssignment[]> {
    const rows = await this.db.peerAssignment.findMany({
      where: { isActive: true },
      include: { responder: true, target: true },
      orderBy: [{ groupName: 'asc' }, { responderId: 'asc' }, { sequenceNo: 'asc' }]
    });
    return rows.map(mapAssignment);
  }

  async importMany(assignments: PeerAssignment[]): Promise<void> {
    for (const assignment of assignments) {
      await this.db.peerAssignment.upsert({
        where: { assignmentId: assignment.assignmentId },
        update: {
          responderId: assignment.responderId,
          targetId: assignment.targetId,
          peerToken: assignment.peerToken,
          sequenceNo: assignment.sequenceNo,
          groupName: assignment.groupName,
          isActive: assignment.isActive ?? true
        },
        create: {
          assignmentId: assignment.assignmentId,
          responderId: assignment.responderId,
          targetId: assignment.targetId,
          peerToken: assignment.peerToken,
          sequenceNo: assignment.sequenceNo,
          groupName: assignment.groupName,
          isActive: assignment.isActive ?? true
        }
      });
    }
  }
}
