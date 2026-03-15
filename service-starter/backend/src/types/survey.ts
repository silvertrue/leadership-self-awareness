export const DIMENSIONS = [
  "전문성",
  "성공 경험",
  "Design 역량",
  "Learning Agility",
  "Attitude",
  "Leadership",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];
export type SubmissionStatus = "not_started" | "draft" | "submitted";
export type TransportMode = "chartered_bus" | "self_drive";
export type LaptopBringOption = "bring" | "cannot_bring";
export type LaptopOs = "windows" | "mac";

export interface Participant {
  participantId: string;
  nameKo: string;
  teamName: string;
  groupName: string;
  email?: string | null;
  selfToken?: string | null;
  reportToken?: string | null;
  isActive?: boolean;
}

export interface PeerAssignment {
  assignmentId: string;
  responderId: string;
  responderName?: string;
  targetId: string;
  targetName?: string;
  targetTeam?: string;
  groupName: string;
  sequenceNo: number;
  peerToken: string;
  isActive?: boolean;
}

export interface SelfResponse {
  participantId: string;
  transportMode?: TransportMode | null;
  laptopBringOption?: LaptopBringOption | null;
  laptopOs?: LaptopOs | null;
  strength1: Dimension;
  strength1Comment: string;
  strength2: Dimension;
  strength2Comment: string;
  growth1: Dimension;
  growth1Comment: string;
  growth2: Dimension;
  growth2Comment: string;
  status: SubmissionStatus;
  submittedAt?: string | null;
  updatedAt?: string | null;
}

export interface PeerResponse {
  assignmentId: string;
  strength1: Dimension;
  strength1Comment: string;
  strength2: Dimension;
  strength2Comment: string;
  growth1: Dimension;
  growth1Comment: string;
  growth2: Dimension;
  growth2Comment: string;
  freeMessage?: string | null;
  status: SubmissionStatus;
  submittedAt?: string | null;
  updatedAt?: string | null;
}

export interface ResponderSubmission {
  responderId: string;
  submittedAt: string;
  status: "submitted";
}
