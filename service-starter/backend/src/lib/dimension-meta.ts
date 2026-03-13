import { DIMENSIONS, type Dimension } from "../types/survey";

export type DimensionGroupKey = "experience" | "capability" | "trait";

export const DIMENSION_META: Array<{
  name: Dimension;
  group: string;
  groupKey: DimensionGroupKey;
  hashtags: string;
  summary: string;
}> = [
  {
    name: DIMENSIONS[0],
    group: "경험",
    groupKey: "experience",
    hashtags: "#Biz. 전문성 #Function 전문성",
    summary:
      "자신이 담당한 사업, 기술, 시장 영역에서 축적된 깊이 있는 전문지식과 실행 경험입니다. 복잡도 높은 과제를 스스로 설계하고 리딩한 경험, 사업 구조와 핵심 변수를 이해하고 현장의 문제를 전문적 관점에서 해결할 수 있는 역량을 의미합니다.",
  },
  {
    name: DIMENSIONS[1],
    group: "경험",
    groupKey: "experience",
    hashtags: "#전략적 의사결정 #혁신 주도 #실행",
    summary:
      "높은 목표를 설정하고 실제 성과(재무적/비재무적)를 만들어낸 경험입니다. 혁신적인 접근, 위기 극복, 사업 성과 창출처럼 비즈니스에 직접적인 영향을 준 경험이 핵심입니다.",
  },
  {
    name: DIMENSIONS[2],
    group: "역량",
    groupKey: "capability",
    hashtags: "#구조화 #솔루션도출",
    summary:
      "복잡한 문제를 구조적으로 분석하고 다양한 이해관계를 고려해 최적의 해결 방향을 설계하는 능력입니다. 문제의 본질을 정의하고 근본적인 변화를 추진하는 역량입니다.",
  },
  {
    name: DIMENSIONS[3],
    group: "역량",
    groupKey: "capability",
    hashtags: "#Globality #AX변화관리",
    summary:
      "빠르게 변화하는 환경 속에서 새로운 지식과 기술을 배우고 기존 경험을 새로운 상황에 적용하는 능력입니다. 특히 Globality나 AX 변화 트렌드에 맞추어 사고와 업무 방식을 계속 업그레이드 하는 역량을 의미합니다.",
  },
  {
    name: DIMENSIONS[4],
    group: "자질",
    groupKey: "trait",
    hashtags: "#신뢰 #Integrity #회복탄력성",
    summary:
      "조직과 구성원에게 신뢰를 주는 기본적인 가치관과 업무 태도입니다. Integrity, 책임감, 협업 의지, 회복탄력성처럼 리더의 기본적인 인성 요소와 일관된 기준을 포함합니다.",
  },
  {
    name: DIMENSIONS[5],
    group: "자질",
    groupKey: "trait",
    hashtags: "#통찰력 #패기",
    summary:
      "구성원과 조직이 같은 방향으로 움직이도록 이끄는 영향력입니다. 목표를 분명히 제시하고 구성원의 역량을 끌어내며, 성과와 성장, 몰입을 함께 이끄는 리더십을 의미합니다.",
  },
];

export function getDefaultDimensions() {
  return [...DIMENSIONS];
}
