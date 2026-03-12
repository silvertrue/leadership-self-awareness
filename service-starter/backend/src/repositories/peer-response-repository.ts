import type { DbClient } from '../lib/db';
import type { PeerResponse, ResponderSubmission } from '../types/survey';

function mapPeer(row: {
  assignmentId: string;
  strength1: string;
  strength1Comment: string;
  strength2: string;
  strength2Comment: string;
  growth1: string;
  growth1Comment: string;
  growth2: string;
  growth2Comment: string;
  freeMessage: string | null;
  status: 'not_started' | 'draft' | 'submitted';
  submittedAt: Date | null;
  updatedAt: Date;
}): PeerResponse {
  return {
    assignmentId: row.assignmentId,
    strength1: row.strength1 as PeerResponse['strength1'],
    strength1Comment: row.strength1Comment,
    strength2: row.strength2 as PeerResponse['strength2'],
    strength2Comment: row.strength2Comment,
    growth1: row.growth1 as PeerResponse['growth1'],
    growth1Comment: row.growth1Comment,
    growth2: row.growth2 as PeerResponse['growth2'],
    growth2Comment: row.growth2Comment,
    freeMessage: row.freeMessage,
    status: row.status,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString()
  };
}

export class PeerResponseRepository {
  constructor(private readonly db: DbClient) {}

  async findByAssignmentId(assignmentId: string): Promise<PeerResponse | null> {
    const row = await this.db.peerResponse.findUnique({ where: { assignmentId } });
    return row ? mapPeer(row) : null;
  }

  async findByAssignmentIds(assignmentIds: string[]): Promise<PeerResponse[]> {
    const rows = await this.db.peerResponse.findMany({ where: { assignmentId: { in: assignmentIds } } });
    return rows.map(mapPeer);
  }

  async listAll(): Promise<PeerResponse[]> {
    const rows = await this.db.peerResponse.findMany();
    return rows.map(mapPeer);
  }

  async upsert(response: PeerResponse): Promise<void> {
    await this.db.peerResponse.upsert({
      where: { assignmentId: response.assignmentId },
      update: {
        strength1: response.strength1,
        strength1Comment: response.strength1Comment,
        strength2: response.strength2,
        strength2Comment: response.strength2Comment,
        growth1: response.growth1,
        growth1Comment: response.growth1Comment,
        growth2: response.growth2,
        growth2Comment: response.growth2Comment,
        freeMessage: response.freeMessage ?? null,
        status: response.status,
        submittedAt: response.submittedAt ? new Date(response.submittedAt) : new Date()
      },
      create: {
        assignmentId: response.assignmentId,
        strength1: response.strength1,
        strength1Comment: response.strength1Comment,
        strength2: response.strength2,
        strength2Comment: response.strength2Comment,
        growth1: response.growth1,
        growth1Comment: response.growth1Comment,
        growth2: response.growth2,
        growth2Comment: response.growth2Comment,
        freeMessage: response.freeMessage ?? null,
        status: response.status,
        submittedAt: response.submittedAt ? new Date(response.submittedAt) : new Date()
      }
    });
  }

  async markResponderSubmitted(payload: ResponderSubmission): Promise<void> {
    await this.db.peerSubmissionBatch.upsert({
      where: { responderId: payload.responderId },
      update: {
        submittedAt: new Date(payload.submittedAt),
        status: payload.status
      },
      create: {
        responderId: payload.responderId,
        submittedAt: new Date(payload.submittedAt),
        status: payload.status
      }
    });
  }

  async findResponderSubmission(responderId: string): Promise<ResponderSubmission | null> {
    const row = await this.db.peerSubmissionBatch.findUnique({ where: { responderId } });
    if (!row) return null;
    return {
      responderId: row.responderId,
      submittedAt: row.submittedAt.toISOString(),
      status: 'submitted'
    };
  }

  async listResponderSubmissions(): Promise<ResponderSubmission[]> {
    const rows = await this.db.peerSubmissionBatch.findMany();
    return rows.map((row) => ({
      responderId: row.responderId,
      submittedAt: row.submittedAt.toISOString(),
      status: 'submitted'
    }));
  }
}
