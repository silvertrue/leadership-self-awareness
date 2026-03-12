import type { GeneratedReport } from '../types/report';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function chips(items: string[], background: string): string {
  return items.map((item) => `<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${background};font-size:12px;font-weight:700;margin:0 8px 8px 0;">${escapeHtml(item)}</span>`).join('');
}

function quotes(items: string[], title: string): string {
  return items.map((item) => `
    <div style="border:1px dashed #cfd8e3;border-radius:16px;padding:14px 16px;margin-top:12px;background:#fff;">
      <div style="font-size:12px;font-weight:800;color:#5d6f86;margin-bottom:6px;">${escapeHtml(title)}</div>
      <div style="font-size:15px;line-height:1.7;color:#243447;">${escapeHtml(item)}</div>
    </div>
  `).join('');
}

export function renderReportHtml(report: GeneratedReport): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.participantName)} 팀장 자기인식 리포트</title>
  <style>
    body { margin: 0; background: #eef4fa; font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; color: #1f2d3d; }
    .page { max-width: 1040px; margin: 0 auto; padding: 36px 24px 60px; }
    .hero { background: linear-gradient(135deg, #14243f 0%, #28446e 100%); color: #fff; border-radius: 28px; padding: 32px 36px; }
    .eyebrow { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #ffd7c7; font-weight: 800; }
    h1 { margin: 10px 0 12px; font-size: 40px; line-height: 1.1; }
    p { margin: 0; }
    .meta { margin-top: 10px; color: rgba(255,255,255,0.85); font-size: 14px; display: flex; gap: 12px; flex-wrap: wrap; }
    .section { margin-top: 18px; background: rgba(255,255,255,0.96); border: 1px solid #dbe5ef; border-radius: 24px; padding: 22px; }
    .section-title { margin: 0 0 12px; font-size: 24px; color: #14243f; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .callout { background: linear-gradient(135deg, #fff8f3 0%, #fff 100%); border: 1px solid #ffd7c8; border-radius: 22px; padding: 18px 20px; margin-top: 18px; }
    .callout h2 { margin: 0 0 8px; font-size: 26px; color: #14243f; }
    .subhead { font-size: 14px; font-weight: 800; color: #5a6d84; margin-bottom: 10px; }
    .actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 18px; }
    .action { background: #fff; border: 1px solid #dbe5ef; border-radius: 20px; padding: 18px; }
    .action h3 { margin: 0 0 8px; font-size: 20px; color: #14243f; }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <div class="eyebrow">Personal Report</div>
      <h1>${escapeHtml(report.participantName)} 팀장 자기인식 리포트</h1>
      <div class="meta">
        <span>${escapeHtml(report.teamName)}</span>
        <span>${escapeHtml(report.groupName)}</span>
        <span>Peer 응답 ${report.peerResponseCount} / ${report.expectedPeerCount}</span>
      </div>
    </div>

    <div class="callout">
      <h2>${escapeHtml(report.insightTitle)}</h2>
      <p style="font-size:16px;line-height:1.8;color:#33465a;">${escapeHtml(report.insightBody)}</p>
    </div>

    <div class="grid" style="margin-top:18px;">
      <div class="section">
        <h2 class="section-title">내가 본 나</h2>
        <div class="subhead">자가진단 강점</div>
        <div>${chips(report.selfStrengths.map((item) => item.dimension), '#edf4ff')}</div>
        ${quotes(report.selfStrengths.map((item) => item.comment), '강점 판단 근거')}
        <div class="subhead" style="margin-top:18px;">자가진단 성장과제</div>
        <div>${chips(report.selfGrowths.map((item) => item.dimension), '#fff1ea')}</div>
        ${quotes(report.selfGrowths.map((item) => item.comment), '성장 판단 근거')}
      </div>

      <div class="section">
        <h2 class="section-title">동료가 본 나</h2>
        <div class="subhead">동료가 본 강점</div>
        <div>${chips(report.peerStrengths, '#edf8f3')}</div>
        ${quotes(report.peerStrengthComments, '요약 강점 코멘트')}
        <div class="subhead" style="margin-top:18px;">동료가 본 성장가능성</div>
        <div>${chips(report.peerGrowths, '#fff1ea')}</div>
        ${quotes(report.peerGrowthComments, '요약 성장가능성 코멘트')}
      </div>
    </div>

    <div class="actions">
      ${report.actionPlan.map((item) => `
        <div class="action">
          <h3>${escapeHtml(item.title)}</h3>
          <p style="font-size:15px;line-height:1.7;color:#35475a;">${escapeHtml(item.body)}</p>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
}
