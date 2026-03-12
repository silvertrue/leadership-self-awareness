import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { GeneratedReport } from '../types/report';
import { renderReportHtml } from '../templates/report-html';
import type { ReportService } from '../services/report-service';
import type { ReportRunRepository } from '../repositories/report-run-repository';

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-');
}

async function renderPdf(htmlPath: string, pdfPath: string): Promise<boolean> {
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '14mm', bottom: '16mm', left: '14mm' }
    });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

export class ReportGenerationWorker {
  constructor(
    private readonly reportService: ReportService,
    private readonly reportRunRepository: ReportRunRepository
  ) {}

  private outputDir(): string {
    return process.env.REPORT_OUTPUT_DIR || path.join(process.cwd(), 'generated-reports');
  }

  async generateOne(participantId: string): Promise<{ report: GeneratedReport; htmlPath: string; pdfPath: string | null }> {
    const report = await this.reportService.buildParticipantReport(participantId);
    const latestRun = await this.reportRunRepository.findLatestByParticipantId(participantId);
    if (!latestRun?.reportRunId) {
      throw new Error('Report run was not saved before artifact generation.');
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = path.join(this.outputDir(), safeSegment(participantId));
    await mkdir(baseDir, { recursive: true });

    const htmlPath = path.join(baseDir, `${safeSegment(participantId)}-${stamp}.html`);
    const pdfPath = path.join(baseDir, `${safeSegment(participantId)}-${stamp}.pdf`);
    const html = renderReportHtml(report);
    await writeFile(htmlPath, html, 'utf8');

    const pdfCreated = await renderPdf(htmlPath, pdfPath);
    await this.reportRunRepository.attachArtifacts(latestRun.reportRunId, htmlPath, pdfCreated ? pdfPath : null);

    return {
      report,
      htmlPath,
      pdfPath: pdfCreated ? pdfPath : null
    };
  }

  async generateAll(participantIds: string[]): Promise<Array<{ participantId: string; htmlPath: string; pdfPath: string | null }>> {
    const results: Array<{ participantId: string; htmlPath: string; pdfPath: string | null }> = [];
    for (const participantId of participantIds) {
      const generated = await this.generateOne(participantId);
      results.push({ participantId, htmlPath: generated.htmlPath, pdfPath: generated.pdfPath });
    }
    return results;
  }
}
