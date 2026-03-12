import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { LlmSummaryInput, LlmSummaryOutput } from '../types/report';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
export const PROMPT_VERSION = 'peer-summary-v1';

export interface LlmClient {
  summarize(input: LlmSummaryInput): Promise<LlmSummaryOutput>;
  getMetadata(): { mode: 'openai' | 'fallback'; model: string | null; promptVersion: string };
}

function compactLines(values: string[]): string[] {
  return values
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function topKeywordsFromComments(comments: string[]): string[] {
  const stopwords = new Set(['그리고', '하지만', '정말', '매우', '조금', '더', '잘', '같습니다', '느낌', '부분', '모습', '업무', '상황', '장면']);
  const counts = new Map<string, number>();

  compactLines(comments)
    .flatMap((line) => line.split(/[^\p{L}\p{N}]+/u))
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopwords.has(token))
    .forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([token]) => token);
}

async function loadPromptFile(filename: string, fallback: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'prompts', filename);
    return await readFile(filePath, 'utf8');
  } catch {
    return fallback;
  }
}

function buildFallbackParagraphs(kind: 'strength' | 'growth', comments: string[]): string[] {
  const lines = compactLines(comments);
  if (lines.length === 0) {
    return [
      kind === 'strength'
        ? '아직 충분한 강점 코멘트가 쌓이지 않아 요약을 생성하지 못했습니다.'
        : '아직 충분한 성장가능성 코멘트가 쌓이지 않아 요약을 생성하지 못했습니다.'
    ];
  }

  const head = kind === 'strength'
    ? `총 ${lines.length}개의 강점 코멘트를 묶어 보면, 반복적으로 언급된 긍정적 장면이 분명합니다.`
    : `총 ${lines.length}개의 성장가능성 코멘트를 묶어 보면, 더 확장되면 좋을 방향이 비교적 선명하게 보입니다.`;

  const tail = kind === 'strength'
    ? '표현은 부드럽게 다듬되, 실제로 주변에 안정감과 신뢰를 주는 행동이 무엇인지 중심으로 정리하는 것이 좋습니다.'
    : '표현은 순화하되, 당장 시도해볼 수 있는 행동과 확장 가능성이 드러나도록 정리하는 것이 좋습니다.';

  return [head, tail];
}

function normalizeParagraphs(paragraphs: unknown, fallback: string[]): string[] {
  if (!Array.isArray(paragraphs)) return fallback;
  const normalized = paragraphs.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 2);
  return normalized.length > 0 ? normalized : fallback;
}

function extractOutputText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }

  const messageTexts = (data?.output || [])
    .flatMap((item: any) => item?.content || [])
    .filter((content: any) => content?.type === 'output_text')
    .map((content: any) => content?.text || '')
    .join('')
    .trim();

  return messageTexts;
}

export class RulesBasedLlmClient implements LlmClient {
  async summarize(input: LlmSummaryInput): Promise<LlmSummaryOutput> {
    return {
      strengthSummaryParagraphs: buildFallbackParagraphs('strength', input.strengthComments),
      growthSummaryParagraphs: buildFallbackParagraphs('growth', input.growthComments),
      toneCheck: 'fallback',
      optionalKeywords: topKeywordsFromComments([...input.strengthComments, ...input.growthComments])
    };
  }

  getMetadata() {
    return { mode: 'fallback' as const, model: null, promptVersion: PROMPT_VERSION };
  }
}

export class OpenAiResponsesLlmClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL
  ) {}

  async summarize(input: LlmSummaryInput): Promise<LlmSummaryOutput> {
    const strengthPrompt = await loadPromptFile(
      'strength-summary.prompt.md',
      '강점 관련 코멘트를 2개 문단으로 요약하고, 부드럽고 신뢰감 있는 톤으로 정리하세요.'
    );
    const growthPrompt = await loadPromptFile(
      'growth-summary.prompt.md',
      '성장가능성 관련 코멘트를 2개 문단으로 요약하고, 행동 제안 중심으로 정리하세요.'
    );

    const instructions = [
      'You are a leadership feedback coach who summarizes peer feedback in Korean.',
      'Return valid JSON only.',
      'Do not quote comments verbatim unless absolutely necessary.',
      'Use supportive language and soften any potentially hurtful phrasing.',
      'Keep the meaning, merge repeated ideas, and avoid naming specific responders.',
      strengthPrompt,
      growthPrompt
    ].join('\n\n');

    const userText = [
      `참가자 이름: ${input.participantName}`,
      `자가진단 강점: ${input.selfStrengths.join(', ') || '없음'}`,
      `자가진단 성장과제: ${input.selfGrowths.join(', ') || '없음'}`,
      '',
      '[강점 관련 원문 목록]',
      ...compactLines(input.strengthComments).map((line) => `- ${line}`),
      '',
      '[성장가능성 관련 원문 목록]',
      ...compactLines(input.growthComments).map((line) => `- ${line}`),
      '',
      '[응원 메시지]',
      ...compactLines(input.freeMessages).map((line) => `- ${line}`)
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        instructions,
        input: userText,
        text: {
          format: {
            type: 'json_schema',
            name: 'peer_feedback_summary',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                strengthSummaryParagraphs: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  maxItems: 2
                },
                growthSummaryParagraphs: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  maxItems: 2
                },
                toneCheck: { type: 'string' },
                optionalKeywords: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 0,
                  maxItems: 5
                }
              },
              required: ['strengthSummaryParagraphs', 'growthSummaryParagraphs', 'toneCheck', 'optionalKeywords']
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI summary request failed: ${response.status}`);
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    if (!outputText) {
      throw new Error('OpenAI summary response did not include output text.');
    }

    const parsed = JSON.parse(outputText);
    return {
      strengthSummaryParagraphs: normalizeParagraphs(parsed.strengthSummaryParagraphs, buildFallbackParagraphs('strength', input.strengthComments)),
      growthSummaryParagraphs: normalizeParagraphs(parsed.growthSummaryParagraphs, buildFallbackParagraphs('growth', input.growthComments)),
      toneCheck: String(parsed.toneCheck || 'openai'),
      optionalKeywords: Array.isArray(parsed.optionalKeywords)
        ? parsed.optionalKeywords.map((item: unknown) => String(item || '').trim()).filter(Boolean).slice(0, 5)
        : []
    };
  }

  getMetadata() {
    return { mode: 'openai' as const, model: this.model, promptVersion: PROMPT_VERSION };
  }
}

export function createLlmClient(): LlmClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new RulesBasedLlmClient();
  }
  return new OpenAiResponsesLlmClient(apiKey, DEFAULT_MODEL);
}
