import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LlmSummaryInput, LlmSummaryOutput } from "../types/report";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
export const PROMPT_VERSION = "peer-summary-v2";

export interface LlmClient {
  summarize(input: LlmSummaryInput): Promise<LlmSummaryOutput>;
  getMetadata(): { mode: "openai" | "fallback"; model: string | null; promptVersion: string };
}

function compactLines(values: string[]): string[] {
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function topKeywordsFromComments(comments: string[]): string[] {
  const stopwords = new Set([
    "그리고",
    "하지만",
    "정말",
    "매우",
    "조금",
    "부분",
    "모습",
    "업무",
    "상황",
    "조직",
    "리더",
    "리더십",
    "팀장님",
    "같습니다",
    "있습니다",
  ]);
  const counts = new Map<string, number>();

  compactLines(comments)
    .flatMap((line) => line.split(/[^\p{L}\p{N}]+/u))
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopwords.has(token))
    .forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0], "ko-KR"))
    .slice(0, 5)
    .map(([token]) => token);
}

async function loadPromptFile(filename: string, fallback: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "src", "prompts", filename);
    return await readFile(filePath, "utf8");
  } catch {
    return fallback;
  }
}

function summarizeRepresentativeScenes(comments: string[]): string[] {
  return compactLines(comments)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line, index, array) => array.indexOf(line) === index)
    .slice(0, 2);
}

function buildFallbackParagraphs(kind: "strength" | "growth", comments: string[]): string[] {
  const lines = compactLines(comments);
  const scenes = summarizeRepresentativeScenes(comments);

  if (lines.length === 0) {
    return [
      kind === "strength"
        ? "아직 충분한 강점 코멘트가 모이지 않아 동료 의견을 요약하지 못했습니다."
        : "아직 충분한 성장가능성 코멘트가 모이지 않아 동료 의견을 요약하지 못했습니다.",
    ];
  }

  if (kind === "strength") {
    return [
      `총 ${lines.length}개의 강점 코멘트를 종합해 보면, 동료들은 이 리더가 실제 업무 장면에서 보여준 안정감과 영향력을 반복적으로 언급하고 있습니다. 특히 ${scenes[0] ?? "구체적인 실행 장면"}과 관련된 표현이 자주 등장해, 강점이 추상적인 인상이 아니라 관찰된 행동으로 인식되고 있음을 보여줍니다.`,
      `${scenes[1] ? `또한 ${scenes[1]}와 관련된 언급도 함께 나타나` : "동시에 여러 코멘트가 비슷한 결을 가리키고 있어"} 이 강점이 단발적 성과가 아니라 주변에 신뢰를 주는 일관된 스타일로 읽힙니다. 동료들이 느끼는 긍정적 인상을 유지하면서도, 어떤 행동이 특히 신뢰를 주는지 스스로 더 선명하게 인식해보면 좋겠습니다.`,
    ];
  }

  return [
    `총 ${lines.length}개의 성장가능성 코멘트를 종합하면, 동료들은 보완이 필요하다는 지적보다는 앞으로 더 확장되면 좋을 방향을 이야기하고 있습니다. 특히 ${scenes[0] ?? "구체적인 협업·실행 장면"}과 관련된 의견이 반복되어, 기대 수준이 어디에 놓여 있는지 비교적 분명하게 드러납니다.`,
    `${scenes[1] ? `또한 ${scenes[1]}에 대한 언급도 있어` : "여러 코멘트가 같은 방향을 가리키고 있어"} 작은 행동 변화만으로도 체감되는 개선이 가능해 보입니다. 리포트에서는 이를 부담으로 받아들이기보다, 이미 가진 강점을 유지한 채 한 단계 확장할 수 있는 기회로 해석하는 것이 좋습니다.`,
  ];
}

function normalizeParagraphs(paragraphs: unknown, fallback: string[]): string[] {
  if (!Array.isArray(paragraphs)) {
    return fallback;
  }

  const normalized = paragraphs
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 2);

  return normalized.length > 0 ? normalized : fallback;
}

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  return (data?.output || [])
    .flatMap((item: any) => item?.content || [])
    .filter((content: any) => content?.type === "output_text")
    .map((content: any) => content?.text || "")
    .join("")
    .trim();
}

export class RulesBasedLlmClient implements LlmClient {
  async summarize(input: LlmSummaryInput): Promise<LlmSummaryOutput> {
    return {
      strengthSummaryParagraphs: buildFallbackParagraphs("strength", input.strengthComments),
      growthSummaryParagraphs: buildFallbackParagraphs("growth", input.growthComments),
      toneCheck: "fallback",
      optionalKeywords: topKeywordsFromComments([...input.strengthComments, ...input.growthComments]),
    };
  }

  getMetadata() {
    return { mode: "fallback" as const, model: null, promptVersion: PROMPT_VERSION };
  }
}

export class OpenAiResponsesLlmClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async summarize(input: LlmSummaryInput): Promise<LlmSummaryOutput> {
    const strengthPrompt = await loadPromptFile(
      "strength-summary.prompt.md",
      "강점 코멘트는 반복적으로 등장한 행동, 주변에 준 영향, 대표 장면을 살려 2문단으로 요약하세요.",
    );
    const growthPrompt = await loadPromptFile(
      "growth-summary.prompt.md",
      "성장가능성 코멘트는 동료의 기대와 확장 방향을 중심으로 2문단으로 요약하세요.",
    );

    const instructions = [
      "You are a careful leadership feedback coach writing a Korean report for one manager.",
      "Your job is to preserve the texture of raw peer feedback while organizing it into warm, readable Korean paragraphs.",
      "Return valid JSON only.",
      "Do not invent scenes, examples, or judgments that are not supported by the raw comments.",
      "Reflect repeated words, observed situations, and practical impact from the raw comments so the summary feels grounded in real peer responses.",
      "Do not flatten the summary into generic competency descriptions.",
      "When several comments repeat a similar idea, merge them and state that this was repeatedly observed.",
      "If there are meaningful differences in emphasis across comments, mention that nuance naturally.",
      "Use supportive and respectful wording. For growth themes, soften the tone without diluting the core message.",
      "Avoid harsh labels, diagnosis-style wording, or anything that could feel shaming.",
      "Do not quote full comments verbatim. Short key phrases of one to three words may be echoed only when they are clearly repeated.",
      "Each paragraph should be 2 to 4 sentences and should feel specific, concrete, and evidence-based.",
      "In the overall strength and growth summaries, wrap one or two truly core phrases in markdown bold (**like this**) so they stand out for the reader.",
      strengthPrompt,
      growthPrompt,
    ].join("\n\n");

    const userText = [
      `참가자 이름: ${input.participantName}`,
      `자가진단 강점: ${input.selfStrengths.join(", ") || "없음"}`,
      `자가진단 성장과제: ${input.selfGrowths.join(", ") || "없음"}`,
      "",
      "[강점 관련 Peer raw comments]",
      ...compactLines(input.strengthComments).map((line) => `- ${line}`),
      "",
      "[성장가능성 관련 Peer raw comments]",
      ...compactLines(input.growthComments).map((line) => `- ${line}`),
      "",
      "[응원 메시지 / 자유 코멘트]",
      ...compactLines(input.freeMessages).map((line) => `- ${line}`),
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        instructions,
        input: userText,
        text: {
          format: {
            type: "json_schema",
            name: "peer_feedback_summary",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                strengthSummaryParagraphs: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 1,
                  maxItems: 2,
                },
                growthSummaryParagraphs: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 1,
                  maxItems: 2,
                },
                toneCheck: { type: "string" },
                optionalKeywords: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 0,
                  maxItems: 5,
                },
              },
              required: [
                "strengthSummaryParagraphs",
                "growthSummaryParagraphs",
                "toneCheck",
                "optionalKeywords",
              ],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI summary request failed: ${response.status}`);
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    if (!outputText) {
      throw new Error("OpenAI summary response did not include output text.");
    }

    const parsed = JSON.parse(outputText);
    return {
      strengthSummaryParagraphs: normalizeParagraphs(
        parsed.strengthSummaryParagraphs,
        buildFallbackParagraphs("strength", input.strengthComments),
      ),
      growthSummaryParagraphs: normalizeParagraphs(
        parsed.growthSummaryParagraphs,
        buildFallbackParagraphs("growth", input.growthComments),
      ),
      toneCheck: String(parsed.toneCheck || "openai"),
      optionalKeywords: Array.isArray(parsed.optionalKeywords)
        ? parsed.optionalKeywords.map((item: unknown) => String(item || "").trim()).filter(Boolean).slice(0, 5)
        : [],
    };
  }

  getMetadata() {
    return { mode: "openai" as const, model: this.model, promptVersion: PROMPT_VERSION };
  }
}

export function createLlmClient(): LlmClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new RulesBasedLlmClient();
  }
  return new OpenAiResponsesLlmClient(apiKey, DEFAULT_MODEL);
}
