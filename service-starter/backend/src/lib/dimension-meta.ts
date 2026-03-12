import { DIMENSIONS, type Dimension } from '../types/survey';

export const DIMENSION_META: Array<{ name: Dimension; group: string; summary: string }> = [
  { name: DIMENSIONS[0], group: '경험', summary: '특정 사업, 기능, 시장 영역에서 깊이 있는 실무와 리딩 경험을 바탕으로 난도 높은 과제를 설계하고 추진하는 힘입니다.' },
  { name: DIMENSIONS[1], group: '경험', summary: '높은 불확실성이나 큰 책임이 따르는 상황에서도 성과를 만들고 위기를 넘어선 경험에서 나오는 실행 신뢰도입니다.' },
  { name: DIMENSIONS[2], group: '역량', summary: '복잡한 문제를 재정의하고 구조화해 최적의 해결 방향을 찾고, 변화를 실제 실행으로 연결하는 사고력입니다.' },
  { name: DIMENSIONS[3], group: '역량', summary: '기존 성공 공식을 내려놓고 새로운 기술과 맥락을 빠르게 학습해 판단을 업데이트하는 능력입니다.' },
  { name: DIMENSIONS[4], group: '자질', summary: '인성, 팀워크, 성실함, integrity 같은 기본 자질을 포함하며 함께 일할 때 신뢰를 주는 태도입니다.' },
  { name: DIMENSIONS[5], group: '자질', summary: '구성원이 따르고 싶어 하는 리더십 수준과 리더로서의 영향력, 스타일, 성장 가능성을 의미합니다.' }
];

export function getDefaultDimensions() {
  return [...DIMENSIONS];
}