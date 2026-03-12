import type { DbClient } from '../lib/db';
import type { Participant } from '../types/survey';

function mapParticipant(row: {
  participantId: string;
  nameKo: string;
  teamName: string;
  groupName: string;
  email: string | null;
  selfToken: string | null;
  reportToken: string | null;
  isActive: boolean;
}): Participant {
  return {
    participantId: row.participantId,
    nameKo: row.nameKo,
    teamName: row.teamName,
    groupName: row.groupName,
    email: row.email,
    selfToken: row.selfToken,
    reportToken: row.reportToken,
    isActive: row.isActive
  };
}

export class ParticipantRepository {
  constructor(private readonly db: DbClient) {}

  async findBySelfToken(token: string): Promise<Participant | null> {
    const row = await this.db.participant.findFirst({ where: { selfToken: token, isActive: true } });
    return row ? mapParticipant(row) : null;
  }

  async findByReportToken(token: string): Promise<Participant | null> {
    const row = await this.db.participant.findFirst({ where: { reportToken: token, isActive: true } });
    return row ? mapParticipant(row) : null;
  }

  async listAll(): Promise<Participant[]> {
    const rows = await this.db.participant.findMany({ where: { isActive: true }, orderBy: { participantId: 'asc' } });
    return rows.map(mapParticipant);
  }

  async importMany(participants: Participant[]): Promise<void> {
    for (const participant of participants) {
      await this.db.participant.upsert({
        where: { participantId: participant.participantId },
        update: {
          nameKo: participant.nameKo,
          teamName: participant.teamName,
          groupName: participant.groupName,
          email: participant.email ?? null,
          selfToken: participant.selfToken ?? null,
          reportToken: participant.reportToken ?? null,
          isActive: participant.isActive ?? true
        },
        create: {
          participantId: participant.participantId,
          nameKo: participant.nameKo,
          teamName: participant.teamName,
          groupName: participant.groupName,
          email: participant.email ?? null,
          selfToken: participant.selfToken ?? null,
          reportToken: participant.reportToken ?? null,
          isActive: participant.isActive ?? true
        }
      });
    }
  }
}
