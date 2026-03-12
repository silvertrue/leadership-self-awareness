import { createDbClient } from './db';
import { ParticipantRepository } from '../repositories/participant-repository';
import { AssignmentRepository } from '../repositories/assignment-repository';
import { SelfResponseRepository } from '../repositories/self-response-repository';
import { PeerResponseRepository } from '../repositories/peer-response-repository';
import { ReportRunRepository } from '../repositories/report-run-repository';
import { SelfResponseService } from '../services/self-response-service';
import { PeerResponseService } from '../services/peer-response-service';
import { DashboardService } from '../services/dashboard-service';
import { ReportService } from '../services/report-service';
import { ReportGenerationWorker } from '../workers/report-generation-worker';
import { createLlmClient } from '../services/llm-summary-service';

export function createContainer() {
  const db = createDbClient();

  const participantRepository = new ParticipantRepository(db);
  const assignmentRepository = new AssignmentRepository(db);
  const selfResponseRepository = new SelfResponseRepository(db);
  const peerResponseRepository = new PeerResponseRepository(db);
  const reportRunRepository = new ReportRunRepository(db);

  const llmClient = createLlmClient();

  const selfResponseService = new SelfResponseService(participantRepository, selfResponseRepository);
  const peerResponseService = new PeerResponseService(assignmentRepository, peerResponseRepository);
  const reportService = new ReportService(
    participantRepository,
    assignmentRepository,
    selfResponseRepository,
    peerResponseRepository,
    reportRunRepository,
    llmClient
  );
  const dashboardService = new DashboardService(
    participantRepository,
    assignmentRepository,
    selfResponseRepository,
    peerResponseRepository,
    reportRunRepository
  );
  const reportWorker = new ReportGenerationWorker(reportService, reportRunRepository);

  return {
    repositories: {
      participantRepository,
      assignmentRepository,
      selfResponseRepository,
      peerResponseRepository,
      reportRunRepository
    },
    services: {
      selfResponseService,
      peerResponseService,
      reportService,
      dashboardService,
      reportWorker
    }
  };
}
