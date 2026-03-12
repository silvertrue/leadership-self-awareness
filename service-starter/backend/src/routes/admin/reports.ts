import type { ParticipantRepository } from '../../repositories/participant-repository';
import type { ReportService } from '../../services/report-service';
import type { ReportGenerationWorker } from '../../workers/report-generation-worker';

export class AdminReportsRoute {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly reportService: ReportService,
    private readonly reportWorker: ReportGenerationWorker
  ) {}

  async generateOne(participantId: string) {
    void this.reportService;
    const generated = await this.reportWorker.generateOne(participantId);
    return { ok: true, ...generated };
  }

  async generateAll() {
    void this.reportService;
    const participants = await this.participantRepository.listAll();
    const generated = await this.reportWorker.generateAll(participants.map(item => item.participantId));
    return { ok: true, generatedCount: generated.length, artifacts: generated };
  }
}
