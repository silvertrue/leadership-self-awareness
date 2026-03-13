import { DIMENSIONS, type PeerResponse, type SelfResponse } from "../types/survey";

function isBlank(value: string | null | undefined): boolean {
  return String(value ?? "").trim().length === 0;
}

function isDimension(value: string): boolean {
  return DIMENSIONS.includes(value as (typeof DIMENSIONS)[number]);
}

export function validateSelfResponseInput(input: SelfResponse): string[] {
  const errors: string[] = [];

  if (!isDimension(input.strength1) || !isDimension(input.strength2)) {
    errors.push("강점 1과 강점 2에서 모두 유효한 항목을 선택해 주세요.");
  }

  if (!isDimension(input.growth1) || !isDimension(input.growth2)) {
    errors.push("성장가능성 1과 성장가능성 2에서 모두 유효한 항목을 선택해 주세요.");
  }

  if (input.strength1 === input.strength2) {
    errors.push("강점 1과 강점 2는 서로 다른 항목이어야 합니다.");
  }

  if (input.growth1 === input.growth2) {
    errors.push("성장가능성 1과 성장가능성 2는 서로 다른 항목이어야 합니다.");
  }

  if ([input.strength1Comment, input.strength2Comment, input.growth1Comment, input.growth2Comment].some(isBlank)) {
    errors.push("자가진단의 모든 판단 근거는 필수입니다.");
  }

  return errors;
}

export function validatePeerResponseInput(input: PeerResponse): string[] {
  const errors: string[] = [];

  if (!isDimension(input.strength1) || !isDimension(input.strength2)) {
    errors.push("강점 1과 강점 2에서 모두 유효한 항목을 선택해 주세요.");
  }

  if (!isDimension(input.growth1) || !isDimension(input.growth2)) {
    errors.push("성장가능성 1과 성장가능성 2에서 모두 유효한 항목을 선택해 주세요.");
  }

  if (input.strength1 === input.strength2) {
    errors.push("강점 1과 강점 2는 서로 다른 항목이어야 합니다.");
  }

  if (input.growth1 === input.growth2) {
    errors.push("성장가능성 1과 성장가능성 2는 서로 다른 항목이어야 합니다.");
  }

  if ([input.strength1Comment, input.strength2Comment, input.growth1Comment, input.growth2Comment].some(isBlank)) {
    errors.push("응원 메시지를 제외한 모든 판단 근거는 필수입니다.");
  }

  return errors;
}
