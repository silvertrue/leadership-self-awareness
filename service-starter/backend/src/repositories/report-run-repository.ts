import { Prisma } from '@prisma/client';
import type { DbClient } from '../lib/db';
import type { ReportRun } from '../types/report';

export class ReportRunRepository {
  constructor(private readonly db: DbClient) {}

  async save(run: ReportRun): Promise<void> {
    await this.db.reportRun.create({
      data: {
        participantId: run.participantId,
        reportStatus: run.reportStatus,
        peerResponseCount: run.peerResponseCount,
        reportJson: run.reportJson as unknown as Prisma.InputJsonValue,
        htmlPath: run.htmlPath ?? null,
        pdfPath: run.pdfPath ?? null,
        llmModel: run.llmModel ?? null,
        llmPromptVersion: run.llmPromptVersion ?? null,
        generatedAt: new Date(run.generatedAt)
      }
    });
  }

  async findLatestByParticipantId(participantId: string): Promise<ReportRun | null> {
    const row = await this.db.reportRun.findFirst({
      where: { participantId },
      orderBy: { generatedAt: 'desc' }
    });

    if (!row) return null;

    return {
      reportRunId: row.reportRunId.toString(),
      participantId: row.participantId,
      reportStatus: row.reportStatus,
      peerResponseCount: row.peerResponseCount,
      reportJson: row.reportJson as unknown as ReportRun['reportJson'],
      htmlPath: row.htmlPath,
      pdfPath: row.pdfPath,
      llmModel: row.llmModel,
      llmPromptVersion: row.llmPromptVersion,
      generatedAt: row.generatedAt.toISOString()
    };
  }

  async attachArtifacts(reportRunId: string | number, htmlPath: string | null, pdfPath: string | null): Promise<void> {
    await this.db.reportRun.update({
      where: { reportRunId: BigInt(reportRunId) },
      data: {
        htmlPath,
        pdfPath
      }
    });
  }
}