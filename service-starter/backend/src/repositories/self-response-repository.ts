import type { DbClient } from '../lib/db';
import type { SelfResponse } from '../types/survey';

function mapSelf(row: {
  participantId: string;
  strength1: string;
  strength1Comment: string;
  strength2: string;
  strength2Comment: string;
  growth1: string;
  growth1Comment: string;
  growth2: string;
  growth2Comment: string;
  status: 'not_started' | 'draft' | 'submitted';
  submittedAt: Date | null;
  updatedAt: Date;
}): SelfResponse {
  return {
    participantId: row.participantId,
    strength1: row.strength1 as SelfResponse['strength1'],
    strength1Comment: row.strength1Comment,
    strength2: row.strength2 as SelfResponse['strength2'],
    strength2Comment: row.strength2Comment,
    growth1: row.growth1 as SelfResponse['growth1'],
    growth1Comment: row.growth1Comment,
    growth2: row.growth2 as SelfResponse['growth2'],
    growth2Comment: row.growth2Comment,
    status: row.status,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString()
  };
}

export class SelfResponseRepository {
  constructor(private readonly db: DbClient) {}

  async findByParticipantId(participantId: string): Promise<SelfResponse | null> {
    const row = await this.db.selfResponse.findUnique({ where: { participantId } });
    return row ? mapSelf(row) : null;
  }

  async listAll(): Promise<SelfResponse[]> {
    const rows = await this.db.selfResponse.findMany();
    return rows.map(mapSelf);
  }

  async upsert(response: SelfResponse): Promise<void> {
    await this.db.selfResponse.upsert({
      where: { participantId: response.participantId },
      update: {
        strength1: response.strength1,
        strength1Comment: response.strength1Comment,
        strength2: response.strength2,
        strength2Comment: response.strength2Comment,
        growth1: response.growth1,
        growth1Comment: response.growth1Comment,
        growth2: response.growth2,
        growth2Comment: response.growth2Comment,
        status: response.status,
        submittedAt: response.submittedAt ? new Date(response.submittedAt) : new Date()
      },
      create: {
        participantId: response.participantId,
        strength1: response.strength1,
        strength1Comment: response.strength1Comment,
        strength2: response.strength2,
        strength2Comment: response.strength2Comment,
        growth1: response.growth1,
        growth1Comment: response.growth1Comment,
        growth2: response.growth2,
        growth2Comment: response.growth2Comment,
        status: response.status,
        submittedAt: response.submittedAt ? new Date(response.submittedAt) : new Date()
      }
    });
  }
}
