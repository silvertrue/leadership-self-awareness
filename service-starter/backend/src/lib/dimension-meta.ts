import { DIMENSIONS, type Dimension } from '../types/survey';

export const DIMENSION_META: Array<{ name: Dimension; group: string; summary: string }> = [
  {
    name: DIMENSIONS[0],
    group: '경험',
    summary:
      '자신이 담당한 사업, 기술, 시장 영역에서 축적된 깊이 있는 전문지식과 실행 경험입니다. 사업 구조와 핵심 변수를 이해하고 현장의 문제를 전문적 관점에서 해결하며, 조직 내 의사결정을 지원하고 방향성을 제시할 수 있는 수준을 의미합니다.'
  },
  {
    name: DIMENSIONS[1],
    group: '경험',
    summary:
      '높은 목표를 설정하고 실제 성과를 만들어낸 경험입니다. 혁신적인 접근, 위기 극복, 사업 성과 창출처럼 비즈니스에 직접적인 영향을 준 경험이 핵심입니다.'
  },
  {
    name: DIMENSIONS[2],
    group: '역량',
    summary:
      '복잡한 문제를 구조적으로 분석하고 다양한 이해관계를 고려해 최적의 해결 방향을 설계하는 능력입니다. 문제의 본질을 정의하고 실행 가능한 전략과 계획으로 연결하는 사고력이 중요합니다.'
  },
  {
    name: DIMENSIONS[3],
    group: '역량',
    summary:
      '빠르게 변화하는 환경 속에서 새로운 지식과 기술을 배우고 기존 경험을 새로운 상황에 적용하는 능력입니다. 특히 글로벌 환경과 디지털, AI 변화에 맞춰 사고와 업무 방식을 계속 업데이트하는 힘을 의미합니다.'
  },
  {
    name: DIMENSIONS[4],
    group: '자질',
    summary:
      '조직과 구성원에게 신뢰를 주는 기본적인 가치관과 업무 태도입니다. 정직성, 책임감, 협업 의지, 회복탄력성처럼 리더의 기본적인 인성 요소와 일관된 기준을 포함합니다.'
  },
  {
    name: DIMENSIONS[5],
    group: '자질',
    summary:
      '구성원과 조직이 같은 방향으로 움직이도록 이끄는 영향력입니다. 목표를 분명히 제시하고 구성원의 역량을 끌어내며, 성과와 성장, 몰입을 함께 이끄는 리더십을 의미합니다.'
  }
];

export function getDefaultDimensions() {
  return [...DIMENSIONS];
}