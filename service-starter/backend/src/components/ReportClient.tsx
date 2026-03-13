"use client";

import { useEffect, useState } from "react";
import type { PublicReportGetResponse } from "../types/api";
import DimensionGuide from "./DimensionGuide";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatBoldText(text: string) {
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export default function ReportClient({ token }: { token: string }) {
  const [data, setData] = useState<PublicReportGetResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/public/report/${token}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "리포트를 불러오지 못했습니다.");
        return;
      }
      setData(payload);
    }

    load();
  }, [token]);

  useEffect(() => {
    if (!data) return;
    const search = new URLSearchParams(window.location.search);
    if (search.get("print") === "1") {
      const timer = window.setTimeout(() => window.print(), 500);
      return () => window.clearTimeout(timer);
    }
  }, [data]);

  if (error && !data) {
    return (
      <main className="page-shell">
        <div className="error-box">{error}</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page-shell">
        <div className="panel">리포트를 불러오는 중입니다...</div>
      </main>
    );
  }

  const report = data.report;

  return (
    <main className="page-shell">
      <section className="page-hero report-print-header">
        <div>
          <div className="eyebrow">개인 리포트</div>
          <h1>{data.participant.nameKo} 팀장 자기인식 리포트</h1>
          <p>자가진단과 Peer 피드백을 비교해 강점, 성장가능성, 그리고 다음 행동 제안을 정리한 결과입니다.</p>
        </div>
        <div className="button-row no-print" style={{ marginTop: 0 }}>
          <button className="btn" type="button" onClick={() => window.print()}>
            리포트 다운로드
          </button>
        </div>
      </section>

      <div className="meta-card">
        <div>
          <div className="meta-label">조직</div>
          <div className="meta-value">{data.participant.teamName}</div>
        </div>
        <div>
          <div className="meta-label">그룹</div>
          <div className="meta-value">{data.participant.groupName}</div>
        </div>
        <div>
          <div className="meta-label">Peer 응답 수</div>
          <div className="meta-value">
            {data.peerResponseCount} / {data.expectedPeerCount}
          </div>
        </div>
      </div>

      {!report ? (
        <div className="panel" style={{ marginTop: 22 }}>
          <div className="empty-state">
            아직 리포트가 생성되지 않았습니다. 자가진단과 Peer 응답이 충분히 모이면 다시 확인해 주세요.
          </div>
        </div>
      ) : (
        <>
          <div className="callout" style={{ marginTop: 22 }}>
            <h2>{report.insightTitle}</h2>
            <p className="muted">{report.insightBody}</p>
          </div>

          <div className="report-grid">
            <div className="panel">
              <h2>내가 본 나</h2>
              <div className="chip-row" style={{ marginTop: 12 }}>
                {report.selfStrengths.map((item) => (
                  <span key={`ss-${item.dimension}`} className="chip blue">
                    {item.dimension}
                  </span>
                ))}
              </div>
              {report.selfStrengths.map((item) => (
                <div key={`ssc-${item.dimension}`} className="quote">
                  <strong>{item.dimension} 판단 근거</strong>
                  <br />
                  {item.comment}
                </div>
              ))}

              <div className="chip-row" style={{ marginTop: 16 }}>
                {report.selfGrowths.map((item) => (
                  <span key={`sg-${item.dimension}`} className="chip orange">
                    {item.dimension}
                  </span>
                ))}
              </div>
              {report.selfGrowths.map((item) => (
                <div key={`sgc-${item.dimension}`} className="quote">
                  <strong>{item.dimension} 판단 근거</strong>
                  <br />
                  {item.comment}
                </div>
              ))}
            </div>

            <div className="panel">
              <h2>동료가 본 나</h2>
              <div className="quote">
                <strong>강점 전체 요약</strong>
                <br />
                {report.peerStrengthComments.map((item, index) => (
                  <p
                    key={`psc-${index}`}
                    style={{ margin: "8px 0 0" }}
                    dangerouslySetInnerHTML={{ __html: formatBoldText(item) }}
                  />
                ))}
              </div>

              <div className="quote" style={{ marginTop: 16 }}>
                <strong>성장가능성 전체 요약</strong>
                <br />
                {report.peerGrowthComments.map((item, index) => (
                  <p
                    key={`pgc-${index}`}
                    style={{ margin: "8px 0 0" }}
                    dangerouslySetInnerHTML={{ __html: formatBoldText(item) }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 22 }}>
            <h2>많이 언급된 강점과 근거</h2>
            <div className="action-grid" style={{ marginTop: 16 }}>
              {report.peerStrengthDetails.map((item) => (
                <div key={`psd-${item.dimension}`} className="panel">
                  <div className="chip-row">
                    <span className="chip green">{item.dimension}</span>
                    <span className="chip blue">선택 {item.count}회</span>
                  </div>
                  <p className="muted" style={{ marginTop: 12 }}>
                    {item.summary}
                  </p>
                  {item.representativeComments.map((comment, index) => (
                    <div key={`psdc-${item.dimension}-${index}`} className="quote">
                      <strong>대표 코멘트 {index + 1}</strong>
                      <br />
                      {comment}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ marginTop: 22 }}>
            <h2>많이 언급된 성장가능성과 근거</h2>
            <div className="action-grid" style={{ marginTop: 16 }}>
              {report.peerGrowthDetails.map((item) => (
                <div key={`pgd-${item.dimension}`} className="panel">
                  <div className="chip-row">
                    <span className="chip orange">{item.dimension}</span>
                    <span className="chip blue">선택 {item.count}회</span>
                  </div>
                  <p className="muted" style={{ marginTop: 12 }}>
                    {item.summary}
                  </p>
                  {item.representativeComments.map((comment, index) => (
                    <div key={`pgdc-${item.dimension}-${index}`} className="quote">
                      <strong>대표 코멘트 {index + 1}</strong>
                      <br />
                      {comment}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {report.peerFreeMessages.length > 0 ? (
            <div className="panel" style={{ marginTop: 22 }}>
              <h2>동료가 남긴 한마디</h2>
              <p className="muted">이 메시지는 동료가 남긴 워딩을 원문 그대로 보여줍니다.</p>
              <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                {report.peerFreeMessages.map((message, index) => (
                  <div key={`pfm-${index}`} className="quote">
                    <strong>한마디 {index + 1}</strong>
                    <br />
                    {message}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 22 }}>
            <DimensionGuide title="리더십 3영역 - 6개 Dimension 설명" />
          </div>

          <div className="action-grid">
            {report.actionPlan.map((item) => (
              <div key={item.title} className="panel">
                <h3>{item.title}</h3>
                <p className="muted">{item.body}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
