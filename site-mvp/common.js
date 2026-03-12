function byId(id) {
  return document.getElementById(id);
}

const APP_DIMENSIONS = ['전문성', '성공 경험', 'Design 역량', 'Learning Agility', 'Attitude', 'Leadership'];

const DIMENSION_SUMMARIES = [
  {
    category: '경험',
    name: '전문성',
    summary: '특정 사업, 시장, 기능에서 깊은 실무와 리딩 경험을 바탕으로 복잡한 과제를 스스로 설계하고 이끌어온 힘'
  },
  {
    category: '경험',
    name: '성공 경험',
    summary: '높은 불확실성과 책임이 있는 상황에서 성과를 만들고 위기를 넘어서며 임팩트를 증명한 경험'
  },
  {
    category: '역량',
    name: 'Design 역량',
    summary: '복잡한 문제를 재정의하고 통합적으로 사고해 최적의 해결 방향을 도출하고 실행까지 설계하는 능력'
  },
  {
    category: '역량',
    name: 'Learning Agility',
    summary: '기존 성공 공식을 빠르게 내려놓고 Globality와 AI 관점을 포함한 새로운 판단 기준으로 스스로를 업그레이드하는 능력'
  },
  {
    category: '자질',
    name: 'Attitude',
    summary: '개인의 인성, 됨됨이, Integrity, 회복탄력성처럼 리더가 갖춰야 할 기본적인 신뢰의 바탕'
  },
  {
    category: '자질',
    name: 'Leadership',
    summary: '조직과 구성원이 따르고 싶어 하는 영향력과 방향 제시, 사람 성장, 리더십 스타일 전반을 포함한 힘'
  }
];

const DIMENSION_CUES = {
  '전문성': {
    strength: '복잡한 사업 이슈를 깊이 이해하고 실행 판단으로 연결하는 모습',
    growth: '전문성을 더 넓은 과제와 새로운 영역으로 확장하는 시도'
  },
  '성공 경험': {
    strength: '어려운 상황에서도 끝까지 성과를 만들어낸 경험 자산',
    growth: '더 큰 범위의 과제에서 성과 경험을 축적하며 영향력을 넓히는 방향'
  },
  'Design 역량': {
    strength: '핵심 문제를 구조화하고 모두가 같은 그림을 보게 만드는 능력',
    growth: '이슈를 더 선명하게 구조화해 의사결정 속도를 높이는 방향'
  },
  'Learning Agility': {
    strength: '새로운 환경과 도구를 빠르게 받아들이며 학습을 행동으로 전환하는 태도',
    growth: 'AI와 새로운 사업 맥락을 더 적극적으로 흡수해 판단 폭을 넓히는 방향'
  },
  'Attitude': {
    strength: '협업 과정에서 신뢰와 안정감을 주는 태도와 기본기',
    growth: '강한 태도 자산을 더 자주 드러내 주변과 연결하는 방향'
  },
  'Leadership': {
    strength: '사람과 과제의 방향을 정리하고 팀을 흔들림 없이 이끄는 영향력',
    growth: '리더십 스타일을 더 넓은 관계와 큰 과제에 확장하는 방향'
  }
};

function renderTopNav(activeKey) {
  const items = [
    { key: 'home', href: './index.html', label: '홈' },
    { key: 'admin', href: './admin-dashboard.html', label: '운영 대시보드' },
    { key: 'self', href: './self-survey.html', label: '자가진단' },
    { key: 'peer', href: './peer-survey.html', label: 'Peer 피드백' },
    { key: 'report', href: './report-viewer.html', label: '개인 리포트' }
  ];
  return `
    <div class="chip-row">
      ${items.map(item => `<a class="tag" style="${item.key === activeKey ? 'background:#14243f;color:#fff;' : ''}" href="${item.href}">${item.label}</a>`).join('')}
    </div>
  `;
}

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

function getParticipants() {
  return window.APP_DATA?.participants || [];
}

function getAssignments() {
  return window.APP_DATA?.peerAssignments || [];
}

function uniqueBy(items, key) {
  return [...new Map(items.map(item => [item[key], item])).values()];
}

function findParticipant(id) {
  return getParticipants().find(item => item.participant_id === id);
}

function findAssignment(assignmentId) {
  return getAssignments().find(item => item.assignment_id === assignmentId);
}

function findAssignmentsByResponder(responderId) {
  return getAssignments().filter(item => item.responder_id === responderId);
}

function findAssignmentsByTarget(targetId) {
  return getAssignments().filter(item => item.target_id === targetId);
}

function formatCountByGroup() {
  return (window.APP_DATA?.groupSummary || []).map(item => ({
    group: item.group_name,
    members: Number(item.member_count),
    targets: Number(item.targets_per_person)
  }));
}

function renderDimensionSummary(title = '6개 Dimension 요약') {
  return `
    <div class="dimension-card">
      <div class="dimension-head">
        <div>
          <div class="eyebrow" style="color:#ff6b35;">Dimension Guide</div>
          <h2>${title}</h2>
        </div>
        <div class="notice">경험 · 역량 · 자질</div>
      </div>
      <div class="dimension-grid-ui">
        ${DIMENSION_SUMMARIES.map(item => `
          <div class="dimension-item">
            <div class="dimension-meta">${item.category}</div>
            <div class="dimension-name-ui">${item.name}</div>
            <p>${item.summary}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderLlmSummaryNote() {
  return `
    <div class="callout llm-note">
      <h3>요약 생성 방식</h3>
      <p>현재 웹앱은 브라우저 안에서 안전한 요약 규칙으로 리포트를 생성합니다. 실제 운영 단계에서는 이 지점에 GPT 요약 API를 연결해 더 자연스럽고 섬세한 문장으로 확장할 수 있습니다.</p>
    </div>
  `;
}

function renderEmptyState(title, body) {
  return `
    <div class="empty-state">
      <h3>${title}</h3>
      <p>${body}</p>
    </div>
  `;
}

function selfStorageKey(participantId) {
  return `self-survey:${participantId}`;
}

function peerStorageKey(assignmentId) {
  return `peer-survey:${assignmentId}`;
}

function peerSubmitStorageKey(responderId) {
  return `peer-survey:submitted:${responderId}`;
}

function createDefaultSelfResponse(participantId) {
  return {
    participant_id: participantId,
    strength1: APP_DIMENSIONS[0],
    strength1Comment: '',
    strength2: APP_DIMENSIONS[1],
    strength2Comment: '',
    growth1: APP_DIMENSIONS[2],
    growth1Comment: '',
    growth2: APP_DIMENSIONS[3],
    growth2Comment: ''
  };
}

function createDefaultPeerResponse(assignmentId) {
  return {
    assignment_id: assignmentId,
    strength1: APP_DIMENSIONS[0],
    strength1Comment: '',
    strength2: APP_DIMENSIONS[1],
    strength2Comment: '',
    growth1: APP_DIMENSIONS[2],
    growth1Comment: '',
    growth2: APP_DIMENSIONS[3],
    growth2Comment: '',
    freeMessage: ''
  };
}

function getSelfResponse(participantId) {
  return safeParse(localStorage.getItem(selfStorageKey(participantId)), createDefaultSelfResponse(participantId));
}

function saveSelfResponse(payload) {
  localStorage.setItem(selfStorageKey(payload.participant_id), JSON.stringify(payload));
}

function getPeerResponse(assignmentId) {
  return safeParse(localStorage.getItem(peerStorageKey(assignmentId)), createDefaultPeerResponse(assignmentId));
}

function savePeerResponse(payload) {
  localStorage.setItem(peerStorageKey(payload.assignment_id), JSON.stringify(payload));
}

function isPeerSubmitted(responderId) {
  return Boolean(localStorage.getItem(peerSubmitStorageKey(responderId)));
}

function setPeerSubmitted(responderId) {
  localStorage.setItem(peerSubmitStorageKey(responderId), JSON.stringify({ submitted_at: new Date().toISOString() }));
}

function validateSelfPayload(payload) {
  if (!payload) return '응답이 없습니다.';
  const requiredValues = [
    payload.strength1,
    payload.strength1Comment,
    payload.strength2,
    payload.strength2Comment,
    payload.growth1,
    payload.growth1Comment,
    payload.growth2,
    payload.growth2Comment
  ];
  if (!requiredValues.every(value => String(value || '').trim().length > 0)) {
    return '모든 항목을 입력해야 합니다.';
  }
  if (payload.strength1 === payload.strength2) {
    return '강점 1과 강점 2는 서로 다른 항목이어야 합니다.';
  }
  if (payload.growth1 === payload.growth2) {
    return '성장 필요 1과 성장 필요 2는 서로 다른 항목이어야 합니다.';
  }
  return '';
}

function validatePeerPayload(payload) {
  if (!payload) return '응답이 없습니다.';
  const requiredValues = [
    payload.strength1,
    payload.strength1Comment,
    payload.strength2,
    payload.strength2Comment,
    payload.growth1,
    payload.growth1Comment,
    payload.growth2,
    payload.growth2Comment
  ];
  if (!requiredValues.every(value => String(value || '').trim().length > 0)) {
    return '응원 메시지를 제외한 모든 항목은 필수입니다.';
  }
  if (payload.strength1 === payload.strength2) {
    return '강점 1과 강점 2는 서로 다른 항목이어야 합니다.';
  }
  if (payload.growth1 === payload.growth2) {
    return '성장가능성 1과 성장가능성 2는 서로 다른 항목이어야 합니다.';
  }
  return '';
}

function countOccurrences(values) {
  const map = new Map();
  values.filter(Boolean).forEach(value => {
    map.set(value, (map.get(value) || 0) + 1);
  });
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
}

function topNames(counts, limit = 2) {
  return counts.slice(0, limit).map(item => item.name);
}

function getResponderProgress(responderId) {
  const assignments = findAssignmentsByResponder(responderId);
  const completed = assignments.filter(item => !validatePeerPayload(getPeerResponse(item.assignment_id))).length;
  return {
    responder_id: responderId,
    responder_name: assignments[0]?.responder_name || findParticipant(responderId)?.name_ko || responderId,
    group_name: assignments[0]?.group_name || findParticipant(responderId)?.group_name || '-',
    total: assignments.length,
    completed,
    submitted: isPeerSubmitted(responderId)
  };
}

function getInboundPeerProgress(participantId) {
  const assignments = findAssignmentsByTarget(participantId);
  const completed = assignments.filter(item => !validatePeerPayload(getPeerResponse(item.assignment_id))).length;
  return {
    total: assignments.length,
    completed
  };
}

function buildSummaryParagraphs(type, topDimensions, responseCount) {
  if (!responseCount || topDimensions.length === 0) {
    return [
      type === 'strength'
        ? '아직 충분한 Peer 응답이 쌓이지 않아 강점 요약을 생성하지 못했습니다.'
        : '아직 충분한 Peer 응답이 쌓이지 않아 성장가능성 요약을 생성하지 못했습니다.'
    ];
  }

  const head = topDimensions.length === 1
    ? `${topDimensions[0]}이 가장 선명하게 언급되었습니다.`
    : `${topDimensions[0]}과 ${topDimensions[1]}이 반복적으로 언급되었습니다.`;

  const cueText = topDimensions
    .map(name => DIMENSION_CUES[name]?.[type === 'strength' ? 'strength' : 'growth'])
    .filter(Boolean)
    .join(' / ');

  if (type === 'strength') {
    return [
      `총 ${responseCount}명의 동료 응답을 종합하면 ${head}`,
      `특히 ${cueText} 측면이 긍정적으로 인식되고 있습니다.`
    ];
  }

  return [
    `총 ${responseCount}명의 동료 응답을 종합하면 ${head}`,
    `특히 ${cueText} 방향으로 더 확장되면 영향력이 커질 것으로 기대됩니다.`
  ];
}

function buildInsight(selfResponse, peerStrengths, peerGrowths) {
  if (!selfResponse || validateSelfPayload(selfResponse)) {
    return {
      title: '자가진단이 아직 완료되지 않았습니다.',
      body: '자가진단이 저장되면 본인 인식과 Peer 인식을 비교해 핵심 인사이트를 자동으로 제시합니다.'
    };
  }

  const selfStrengths = [selfResponse.strength1, selfResponse.strength2];
  const selfGrowths = [selfResponse.growth1, selfResponse.growth2];
  const strengthOverlap = selfStrengths.filter(item => peerStrengths.includes(item));
  const growthOverlap = selfGrowths.filter(item => peerGrowths.includes(item));
  const hiddenStrength = peerStrengths.find(item => !selfStrengths.includes(item));

  if (growthOverlap.length > 0) {
    return {
      title: `성장 우선순위가 ${growthOverlap[0]}에서 맞닿아 있습니다.`,
      body: `본인과 동료가 같은 성장 포인트를 보고 있다는 뜻입니다. 이번 워크샵에서는 ${growthOverlap[0]}을 바로 행동으로 옮길 첫 실험을 만드는 것이 가장 효과적입니다.`
    };
  }

  if (strengthOverlap.length > 0) {
    return {
      title: `${strengthOverlap[0]}은 자가 인식과 Peer 인식이 일치하는 강점입니다.`,
      body: `스스로도 알고 있고, 주변도 동일하게 느끼는 강점은 계속 강화할 가치가 큽니다. 이 강점을 더 자주 드러내는 장면을 설계해보세요.`
    };
  }

  if (hiddenStrength) {
    return {
      title: `${hiddenStrength}은 동료가 먼저 발견한 숨은 강점입니다.`,
      body: `본인은 당연하게 여겼지만 주변은 분명한 강점으로 보고 있을 수 있습니다. 이 자산을 더 의식적으로 활용하면 리더십의 폭이 넓어질 수 있습니다.`
    };
  }

  return {
    title: '자가 인식과 Peer 인식을 함께 읽어볼 시점입니다.',
    body: '본인이 중요하게 보는 포인트와 동료가 기대하는 포인트 사이의 차이를 비교하며, 오늘 실험할 행동 1개를 정해보세요.'
  };
}

function buildActionPlan(selfResponse, peerStrengths, peerGrowths) {
  const keepStrength = peerStrengths[0] || selfResponse?.strength1 || '강점';
  const growthFocus = peerGrowths[0] || selfResponse?.growth1 || '성장 과제';
  return [
    {
      title: '계속 강화할 강점',
      body: `${keepStrength}이 실제 장면에서 더 선명하게 보이도록 회의, 1on1, 의사결정 순간에 의식적으로 사용해보세요.`
    },
    {
      title: '이번 달 실험 행동',
      body: `${growthFocus}과 연결된 작은 행동 하나를 정해 2주 안에 실행해보세요. 작아도 반복 가능한 행동이면 충분합니다.`
    },
    {
      title: '동료와 나눌 질문',
      body: `내가 ${keepStrength}을 잘 쓰는 순간과 ${growthFocus}이 더 필요해 보이는 순간을 주변은 어떻게 보고 있는지 직접 물어보세요.`
    }
  ];
}

function buildDynamicReport(participantId) {
  const participant = findParticipant(participantId);
  if (!participant) return null;

  const selfResponse = getSelfResponse(participantId);
  const selfValid = !validateSelfPayload(selfResponse);
  const inboundAssignments = findAssignmentsByTarget(participantId);
  const inboundResponses = inboundAssignments
    .map(item => ({ assignment: item, response: getPeerResponse(item.assignment_id) }))
    .filter(item => !validatePeerPayload(item.response));

  const strengthCounts = countOccurrences(inboundResponses.flatMap(item => [item.response.strength1, item.response.strength2]));
  const growthCounts = countOccurrences(inboundResponses.flatMap(item => [item.response.growth1, item.response.growth2]));
  const topStrengths = topNames(strengthCounts, 2);
  const topGrowths = topNames(growthCounts, 2);
  const insight = buildInsight(selfValid ? selfResponse : null, topStrengths, topGrowths);

  return {
    participant_id: participant.participant_id,
    participant_name: participant.name_ko,
    team_name: participant.team_name,
    group_name: participant.group_name,
    peer_response_count: inboundResponses.length,
    expected_peer_count: inboundAssignments.length,
    self_completed: selfValid,
    report_ready: selfValid && inboundAssignments.length > 0 && inboundResponses.length === inboundAssignments.length,
    self_strengths: selfValid ? [
      { dimension: selfResponse.strength1, comment: selfResponse.strength1Comment },
      { dimension: selfResponse.strength2, comment: selfResponse.strength2Comment }
    ] : [],
    self_growths: selfValid ? [
      { dimension: selfResponse.growth1, comment: selfResponse.growth1Comment },
      { dimension: selfResponse.growth2, comment: selfResponse.growth2Comment }
    ] : [],
    peer_strengths: topStrengths,
    peer_growths: topGrowths,
    peer_strength_comments: buildSummaryParagraphs('strength', topStrengths, inboundResponses.length),
    peer_growth_comments: buildSummaryParagraphs('growth', topGrowths, inboundResponses.length),
    insight_title: insight.title,
    insight_body: insight.body,
    action_plan: buildActionPlan(selfValid ? selfResponse : null, topStrengths, topGrowths)
  };
}

function buildAllReports() {
  return getParticipants().map(item => buildDynamicReport(item.participant_id)).filter(Boolean);
}

function getDashboardStats() {
  const participants = getParticipants();
  const responders = uniqueBy(getAssignments(), 'responder_id').map(item => getResponderProgress(item.responder_id));
  const selfCompleted = participants.filter(item => !validateSelfPayload(getSelfResponse(item.participant_id))).length;
  const reportReady = participants.filter(item => buildDynamicReport(item.participant_id)?.report_ready).length;
  const peerSubmitted = responders.filter(item => item.submitted).length;
  const peerAssignments = getAssignments().length;
  const peerCompleted = getAssignments().filter(item => !validatePeerPayload(getPeerResponse(item.assignment_id))).length;
  return {
    participantCount: participants.length,
    selfCompleted,
    peerSubmitted,
    reportReady,
    peerAssignments,
    peerCompleted
  };
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

window.AppStore = {
  dimensions: APP_DIMENSIONS,
  getQueryParam,
  getParticipants,
  getAssignments,
  findParticipant,
  findAssignment,
  findAssignmentsByResponder,
  findAssignmentsByTarget,
  getSelfResponse,
  saveSelfResponse,
  getPeerResponse,
  savePeerResponse,
  isPeerSubmitted,
  setPeerSubmitted,
  validateSelfPayload,
  validatePeerPayload,
  getResponderProgress,
  getInboundPeerProgress,
  buildDynamicReport,
  buildAllReports,
  getDashboardStats,
  downloadJson,
  uniqueBy
};
