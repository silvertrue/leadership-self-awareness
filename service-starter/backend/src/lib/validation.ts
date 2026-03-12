import { DIMENSIONS, type PeerResponse, type SelfResponse } from '../types/survey';

function isBlank(value: string | null | undefined): boolean {
  return String(value ?? '').trim().length === 0;
}

function isDimension(value: string): boolean {
  return DIMENSIONS.includes(value as (typeof DIMENSIONS)[number]);
}

export function validateSelfResponseInput(input: SelfResponse): string[] {
  const errors: string[] = [];
  if (!isDimension(input.strength1) || !isDimension(input.strength2)) errors.push('강점 항목 선택이 올바르지 않습니다.');
  if (!isDimension(input.growth1) || !isDimension(input.growth2)) errors.push('성장 항목 선택이 올바르지 않습니다.');
  if (input.strength1 === input.strength2) errors.push('강점 1과 강점 2는 서로 달라야 합니다.');
  if (input.growth1 === input.growth2) errors.push('성장 필요 1과 성장 필요 2는 서로 달라야 합니다.');
  if ([input.strength1Comment, input.strength2Comment, input.growth1Comment, input.growth2Comment].some(isBlank)) {
    errors.push('자가진단의 모든 판단 근거는 필수입니다.');
  }
  return errors;
}

export function validatePeerResponseInput(input: PeerResponse): string[] {
  const errors: string[] = [];
  if (!isDimension(input.strength1) || !isDimension(input.strength2)) errors.push('강점 항목 선택이 올바르지 않습니다.');
  if (!isDimension(input.growth1) || !isDimension(input.growth2)) errors.push('성장가능성 항목 선택이 올바르지 않습니다.');
  if (input.strength1 === input.strength2) errors.push('강점 1과 강점 2는 서로 달라야 합니다.');
  if (input.growth1 === input.growth2) errors.push('성장가능성 1과 성장가능성 2는 서로 달라야 합니다.');
  if ([input.strength1Comment, input.strength2Comment, input.growth1Comment, input.growth2Comment].some(isBlank)) {
    errors.push('응원 메시지를 제외한 Peer 피드백의 모든 판단 근거는 필수입니다.');
  }
  return errors;
}