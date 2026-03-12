import type { Dimension, Participant, PeerAssignment, PeerResponse, SelfResponse } from './survey';
import type { GeneratedReport } from './report';

export interface PublicSelfGetResponse {
  participant: Participant;
  surveyMeta: {
    dimensions: readonly Dimension[];
    status: 'not_started' | 'draft' | 'submitted';
    submittedAt?: string | null;
  };
  response: Partial<SelfResponse>;
}

export interface PublicPeerGetResponse {
  responder: {
    responderId: string;
    nameKo: string;
    groupName: string;
    submitted: boolean;
  };
  dimensions: readonly Dimension[];
  assignments: Array<{
    assignmentId: string;
    sequenceNo: number;
    status: 'not_started' | 'in_progress' | 'completed';
    target: {
      participantId: string;
      nameKo: string;
      teamName: string;
    };
  }>;
  responsesByAssignment: Record<string, Partial<PeerResponse>>;
  currentResponse: Partial<PeerResponse>;
}

export interface PublicReportGetResponse {
  participant: Participant;
  reportStatus: 'waiting_self' | 'waiting_peer' | 'ready' | 'exported';
  peerResponseCount: number;
  expectedPeerCount: number;
  selfCompleted: boolean;
  report: GeneratedReport | null;
}

export interface AdminDashboardSummary {
  participantCount: number;
  selfCompleted: number;
  peerAssignments: number;
  peerCompleted: number;
  peerSubmitted: number;
  reportReady: number;
}

export interface AdminDashboardGroup {
  groupName: string;
  members: number;
  selfCompleted: number;
  reportReady: number;
  targetsPerPerson: number;
}

export interface AdminDashboardResponder {
  responderId: string;
  nameKo: string;
  groupName: string;
  completed: number;
  total: number;
  submitted: boolean;
}

export interface AdminDashboardParticipant {
  participantId: string;
  nameKo: string;
  teamName: string;
  groupName: string;
  selfCompleted: boolean;
  peerResponseCount: number;
  expectedPeerCount: number;
  reportReady: boolean;
  reportToken?: string | null;
}

export interface AdminDashboardResponse {
  summary: AdminDashboardSummary;
  groups: AdminDashboardGroup[];
  responders: AdminDashboardResponder[];
  participants: AdminDashboardParticipant[];
}

export interface ImportParticipantsRequest {
  participants: Participant[];
}

export interface ImportPeerAssignmentsRequest {
  peerAssignments: PeerAssignment[];
}