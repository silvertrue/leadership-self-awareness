import type { Dimension, PeerResponse, SelfResponse } from './survey';

export type ReportStatus = 'waiting_self' | 'waiting_peer' | 'ready' | 'exported';

export interface ReportSummaryBlock {
  dimension: Dimension;
  comment: string;
}

export interface GeneratedReport {
  participantId: string;
  participantName: string;
  teamName: string;
  groupName: string;
  selfCompleted: boolean;
  peerResponseCount: number;
  expectedPeerCount: number;
  reportReady: boolean;
  selfStrengths: ReportSummaryBlock[];
  selfGrowths: ReportSummaryBlock[];
  peerStrengths: Dimension[];
  peerGrowths: Dimension[];
  peerStrengthComments: string[];
  peerGrowthComments: string[];
  insightTitle: string;
  insightBody: string;
  actionPlan: Array<{ title: string; body: string }>;
}

export interface ReportRun {
  reportRunId?: string | number;
  participantId: string;
  reportStatus: ReportStatus;
  peerResponseCount: number;
  reportJson: GeneratedReport;
  htmlPath?: string | null;
  pdfPath?: string | null;
  llmModel?: string | null;
  llmPromptVersion?: string | null;
  generatedAt: string;
}

export interface LlmSummaryInput {
  participantName: string;
  selfStrengths: Dimension[];
  selfGrowths: Dimension[];
  strengthComments: string[];
  growthComments: string[];
  freeMessages: string[];
}

export interface LlmSummaryOutput {
  strengthSummaryParagraphs: string[];
  growthSummaryParagraphs: string[];
  toneCheck: string;
  optionalKeywords: string[];
}
