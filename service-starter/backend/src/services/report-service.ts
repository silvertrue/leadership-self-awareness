import type { AssignmentRepository } from '../repositories/assignment-repository';
import type { ParticipantRepository } from '../repositories/participant-repository';
import type { PeerResponseRepository } from '../repositories/peer-response-repository';
import type { ReportRunRepository } from '../repositories/report-run-repository';
import type { SelfResponseRepository } from '../repositories/self-response-repository';
import type { GeneratedReport } from '../types/report';
import type { Dimension, PeerResponse, SelfResponse } from '../types/survey';
import type { LlmClient } from './llm-summary-service';
import { PROMPT_VERSION } from './llm-summary-service';

function countTop(values: string[], limit: number): Dimension[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0], 'ko-KR'))
    .slice(0, limit)
    .map(([name]) => name as Dimension);
}

function overlap(source: string[], target: string[]): string[] {
  return source.filter((item) => target.includes(item));
}

function buildInsight(selfResponse: SelfResponse | null, peerStrengths: Dimension[], peerGrowths: Dimension[]) {
  if (!selfResponse) {
    return {
      title: '자가진단이 아직 완료되지 않았습니다.',
      body: '자가진단이 먼저 제출되면 본인의 인식과 동료 인식을 더 선명하게 비교한 리포트를 만들 수 있습니다.'
    };
  }

  const selfStrengths = [selfResponse.strength1, selfResponse.strength2];
  const selfGrowths = [selfResponse.growth1, selfResponse.growth2];
  const strengthOverlap = overlap(selfStrengths, peerStrengths);
  const growthOverlap = overlap(selfGrowths, peerGrowths);
  const hiddenStrength = peerStrengths.find((item) => !selfStrengths.includes(item));

  if (growthOverlap.length > 0) {
    return {
      title: `${growthOverlap[0]}은 본인과 동료가 함께 본 성장 우선순위입니다.`,
      body: '자가진단과 Peer 피드백이 같은 방향을 가리키고 있어, 이번 워크샵에서 바로 행동 계획으로 연결하기 좋은 주제입니다.'
    };
  }

  if (strengthOverlap.length > 0) {
    return {
      title: `${strengthOverlap[0]}은 내가 보는 나와 동료가 보는 나가 만나는 공통 강점입니다.`,
      body: '본인도 중요하게 여기고 있고 주변도 같은 강점으로 인식하고 있으므로, 이 자질을 더 의식적으로 활용해보면 좋습니다.'
    };
  }

  if (hiddenStrength) {
    return {
      title: `${hiddenStrength}은 동료가 먼저 발견한 숨은 강점입니다.`,
      body: '본인에게는 익숙해서 당연하게 느껴질 수 있지만, 주변에서는 분명한 강점으로 보고 있습니다. 앞으로 더 자주 드러내 보세요.'
    };
  }

  return {
    title: '내 인식과 동료 인식을 함께 살펴볼 시점입니다.',
    body: '본인이 중요하게 보는 부분과 동료들이 기대하는 부분 사이의 차이를 비교하면서, 바로 시도할 행동 한 가지를 정해보세요.'
  };
}

function buildActionPlan(selfResponse: SelfResponse | null, peerStrengths: Dimension[], peerGrowths: Dimension[]) {
  const keepStrength = peerStrengths[0] || selfResponse?.strength1 || '강점';
  const nextGrowth = peerGrowths[0] || selfResponse?.growth1 || '성장 과제';
  const secondGrowth = peerGrowths[1] || selfResponse?.growth2 || nextGrowth;

  return [
    {
      title: '계속 강화할 강점',
      body: `${keepStrength}이 실제 회의, 1on1, 의사결정 장면에서 더 분명히 드러나도록 반복할 행동 하나를 정해보세요.`
    },
    {
      title: '이번 달 실천할 행동',
      body: `${nextGrowth}과 연결된 작은 행동 하나를 정해 2주 동안 반복해보세요. 작지만 꾸준히 실천 가능한 행동이면 충분합니다.`
    },
    {
      title: '동료에게 물어볼 질문',
      body: `${keepStrength}이 잘 드러났던 순간과 ${secondGrowth}이 더 필요해 보였던 순간을 동료에게 직접 물어보며 인식을 넓혀보세요.`
    }
  ];
}

export class ReportService {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly assignmentRepository: AssignmentRepository,
    private readonly selfResponseRepository: SelfResponseRepository,
    private readonly peerResponseRepository: PeerResponseRepository,
    private readonly reportRunRepository: ReportRunRepository,
    private readonly llmClient: LlmClient
  ) {}

  async buildParticipantReport(participantId: string): Promise<GeneratedReport> {
    const participant = await this.participantRepository.listAll().then((items) => items.find((item) => item.participantId === participantId));
    if (!participant) throw new Error('Participant not found.');

    const selfResponse = await this.selfResponseRepository.findByParticipantId(participantId);
    const assignments = await this.assignmentRepository.findByTargetId(participantId);
    const peerResponses = await this.peerResponseRepository.findByAssignmentIds(assignments.map((item) => item.assignmentId));

    const peerStrengths = countTop(peerResponses.flatMap((item) => [item.strength1, item.strength2]), 2);
    const peerGrowths = countTop(peerResponses.flatMap((item) => [item.growth1, item.growth2]), 2);

    const llm = await this.llmClient.summarize({
      participantName: participant.nameKo,
      selfStrengths: selfResponse ? [selfResponse.strength1, selfResponse.strength2] : [],
      selfGrowths: selfResponse ? [selfResponse.growth1, selfResponse.growth2] : [],
      strengthComments: peerResponses.flatMap((item: PeerResponse) => [item.strength1Comment, item.strength2Comment]),
      growthComments: peerResponses.flatMap((item: PeerResponse) => [item.growth1Comment, item.growth2Comment]),
      freeMessages: peerResponses.map((item) => item.freeMessage ?? '').filter(Boolean)
    });

    const insight = buildInsight(selfResponse, peerStrengths, peerGrowths);
    const actionPlan = buildActionPlan(selfResponse, peerStrengths, peerGrowths);
    const llmMeta = this.llmClient.getMetadata();

    const report: GeneratedReport = {
      participantId,
      participantName: participant.nameKo,
      teamName: participant.teamName,
      groupName: participant.groupName,
      selfCompleted: Boolean(selfResponse),
      peerResponseCount: peerResponses.length,
      expectedPeerCount: assignments.length,
      reportReady: Boolean(selfResponse) && peerResponses.length === assignments.length,
      selfStrengths: selfResponse ? [{ dimension: selfResponse.strength1, comment: selfResponse.strength1Comment }, { dimension: selfResponse.strength2, comment: selfResponse.strength2Comment }] : [],
      selfGrowths: selfResponse ? [{ dimension: selfResponse.growth1, comment: selfResponse.growth1Comment }, { dimension: selfResponse.growth2, comment: selfResponse.growth2Comment }] : [],
      peerStrengths,
      peerGrowths,
      peerStrengthComments: llm.strengthSummaryParagraphs,
      peerGrowthComments: llm.growthSummaryParagraphs,
      insightTitle: insight.title,
      insightBody: insight.body,
      actionPlan
    };

    await this.reportRunRepository.save({
      participantId,
      reportStatus: report.reportReady ? 'ready' : selfResponse ? 'waiting_peer' : 'waiting_self',
      peerResponseCount: peerResponses.length,
      reportJson: report,
      llmModel: llmMeta.model,
      llmPromptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString()
    });

    return report;
  }
}