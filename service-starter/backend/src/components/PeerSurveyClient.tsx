"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicPeerGetResponse } from "../types/api";
import type { PeerResponse } from "../types/survey";
import DimensionGuide from "./DimensionGuide";

type SelectValue = string | "";

type PeerForm = {
  assignmentId: string;
  strength1: SelectValue;
  strength1Comment: string;
  strength2: SelectValue;
  strength2Comment: string;
  growth1: SelectValue;
  growth1Comment: string;
  growth2: SelectValue;
  growth2Comment: string;
  freeMessage: string;
};

function validate(form: PeerForm) {
  if (!form.strength1 || !form.strength2) return "강점 1과 강점 2를 모두 선택해 주세요.";
  if (!form.growth1 || !form.growth2) return "성장가능성 1과 성장가능성 2를 모두 선택해 주세요.";
  if (form.strength1 === form.strength2) return "강점 1과 강점 2는 서로 다른 항목이어야 합니다.";
  if (form.growth1 === form.growth2) return "성장가능성 1과 성장가능성 2는 서로 다른 항목이어야 합니다.";
  if (![form.strength1Comment, form.strength2Comment, form.growth1Comment, form.growth2Comment].every((item) => item.trim())) {
    return "강점과 성장가능성에 대한 판단 근거를 모두 작성해 주세요.";
  }
  return "";
}

export default function PeerSurveyClient({ token }: { token: string }) {
  const [data, setData] = useState<PublicPeerGetResponse | null>(null);
  const [forms, setForms] = useState<Record<string, PeerForm>>({});
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/public/peer/${token}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Peer 피드백 정보를 불러오지 못했습니다.");
        return;
      }

      setData(payload);

      const next: Record<string, PeerForm> = {};
      for (const assignment of payload.assignments) {
        const saved = payload.responsesByAssignment?.[assignment.assignmentId] || {};
        next[assignment.assignmentId] = {
          assignmentId: assignment.assignmentId,
          strength1: String(saved.strength1 || ""),
          strength1Comment: String(saved.strength1Comment || ""),
          strength2: String(saved.strength2 || ""),
          strength2Comment: String(saved.strength2Comment || ""),
          growth1: String(saved.growth1 || ""),
          growth1Comment: String(saved.growth1Comment || ""),
          growth2: String(saved.growth2 || ""),
          growth2Comment: String(saved.growth2Comment || ""),
          freeMessage: String(saved.freeMessage || ""),
        };
      }
      setForms(next);
    }

    load();
  }, [token]);

  const currentAssignment = data?.assignments[index];
  const currentForm = currentAssignment ? forms[currentAssignment.assignmentId] : null;
  const currentInvalid = currentForm ? validate(currentForm) : "";

  const completedCount = useMemo(() => {
    if (!data) return 0;
    return data.assignments.filter((item) => forms[item.assignmentId] && !validate(forms[item.assignmentId])).length;
  }, [data, forms]);

  function update(key: keyof PeerForm, value: string) {
    if (!currentAssignment || !currentForm) return;
    setForms({
      ...forms,
      [currentAssignment.assignmentId]: {
        ...currentForm,
        [key]: value,
      },
    });
    setError("");
    setMessage("");
  }

  async function saveOne(assignmentId: string) {
    const form = forms[assignmentId];
    const invalid = validate(form);
    if (invalid) throw new Error(invalid);

    const response = await fetch(`/api/public/peer/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "submitted" } as PeerResponse),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "저장에 실패했습니다.");
    }
  }

  async function saveCurrent(nextStep: number) {
    if (!currentAssignment || !data) return;

    try {
      setBusy(true);
      await saveOne(currentAssignment.assignmentId);
      setMessage("현재 대상의 응답이 저장되었습니다.");
      setIndex((prev) => Math.max(0, Math.min(data.assignments.length - 1, prev + nextStep)));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAll() {
    if (!data) return;

    try {
      setBusy(true);
      for (const item of data.assignments) {
        await saveOne(item.assignmentId);
      }

      const response = await fetch(`/api/public/peer/${token}/submit`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "최종 제출에 실패했습니다.");
      }

      setMessage("배정된 모든 대상에 대한 응답을 최종 제출했습니다.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "최종 제출에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <main className="page-shell">
        <div className="error-box">{error}</div>
      </main>
    );
  }

  if (!data || !currentAssignment || !currentForm) {
    return (
      <main className="page-shell">
        <div className="panel">불러오는 중입니다...</div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-hero">
        <div>
          <div className="eyebrow">Peer 피드백</div>
          <h1>강점과 성장가능성을 구분해 선택하고, 그 근거를 작성해 주세요.</h1>
          <p>각 대상마다 강점 2개와 성장가능성 2개를 각각 선택한 뒤, 판단 근거를 구체적으로 남겨 주세요.</p>
        </div>
        <div className="hero-badge">평가자용</div>
      </section>

      <div className="meta-card">
        <div>
          <div className="meta-label">응답자</div>
          <div className="meta-value">{data.responder.nameKo}</div>
        </div>
        <div>
          <div className="meta-label">그룹</div>
          <div className="meta-value">{data.responder.groupName}</div>
        </div>
        <div>
          <div className="meta-label">완료 현황</div>
          <div className="meta-value">
            {completedCount} / {data.assignments.length}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 22 }}>
        <h2>평가 대상</h2>
        <div className="progress-grid">
          {data.assignments.map((item, idx) => {
            const done = forms[item.assignmentId] && !validate(forms[item.assignmentId]);
            return (
              <button
                key={item.assignmentId}
                type="button"
                className={`assignment-card${idx === index ? " active" : ""}${done ? " completed" : ""}`}
                onClick={() => setIndex(idx)}
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <div className={`status-pill ${done ? "done" : idx === index ? "progress" : "pending"}`}>
                  {done ? "완료" : idx === index ? "작성 중" : "대기"}
                </div>
                <h3 style={{ marginTop: 12 }}>{item.target.nameKo}</h3>
                <div className="muted">{item.target.teamName}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>현재 평가 대상: {currentAssignment.target.nameKo}</h2>
          <p className="muted">강점과 성장가능성을 나누어 생각하면 응답이 훨씬 명확해집니다. 아래 두 섹션을 순서대로 작성해 주세요.</p>

          {error ? <div className="error-box" style={{ marginTop: 16 }}>{error}</div> : null}
          {message ? <div className="message">{message}</div> : null}
          {currentInvalid ? <div className="notice">저장 조건: {currentInvalid}</div> : null}

          <section className="survey-section strength-section">
            <div className="survey-section-head">
              <div className="survey-section-badge strength">강점</div>
              <h3>이 팀장의 강점 2가지</h3>
            </div>
            <p className="muted">이 팀장의 강점이라고 생각하는 영역 2개를 고르고, 그렇게 판단한 근거를 적어 주세요.</p>
            <div className="form-grid">
              <div className="field">
                <label>강점 1</label>
                <select className="select" value={currentForm.strength1} onChange={(e) => update("strength1", e.target.value)}>
                  <option value="">---선택하세요---</option>
                  {data.dimensions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>강점 1 판단 근거</label>
                <textarea className="textarea" value={currentForm.strength1Comment} onChange={(e) => update("strength1Comment", e.target.value)} />
              </div>
              <div className="field">
                <label>강점 2</label>
                <select className="select" value={currentForm.strength2} onChange={(e) => update("strength2", e.target.value)}>
                  <option value="">---선택하세요---</option>
                  {data.dimensions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>강점 2 판단 근거</label>
                <textarea className="textarea" value={currentForm.strength2Comment} onChange={(e) => update("strength2Comment", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="survey-section growth-section">
            <div className="survey-section-head">
              <div className="survey-section-badge growth">성장가능성</div>
              <h3>이 팀장의 성장가능성 2가지</h3>
            </div>
            <p className="muted">앞으로 더 발휘될 수 있다고 생각하는 영역 2개를 고르고, 그렇게 판단한 근거를 적어 주세요.</p>
            <div className="form-grid">
              <div className="field">
                <label>성장가능성 1</label>
                <select className="select" value={currentForm.growth1} onChange={(e) => update("growth1", e.target.value)}>
                  <option value="">---선택하세요---</option>
                  {data.dimensions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>성장가능성 1 판단 근거</label>
                <textarea className="textarea" value={currentForm.growth1Comment} onChange={(e) => update("growth1Comment", e.target.value)} />
              </div>
              <div className="field">
                <label>성장가능성 2</label>
                <select className="select" value={currentForm.growth2} onChange={(e) => update("growth2", e.target.value)}>
                  <option value="">---선택하세요---</option>
                  {data.dimensions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>성장가능성 2 판단 근거</label>
                <textarea className="textarea" value={currentForm.growth2Comment} onChange={(e) => update("growth2Comment", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="survey-section message-section">
            <div className="survey-section-head">
              <div className="survey-section-badge message">응원 메시지</div>
              <h3>동료에게 전하고 싶은 한마디</h3>
            </div>
            <div className="field">
              <label>응원 메시지 (선택)</label>
              <textarea className="textarea" value={currentForm.freeMessage} onChange={(e) => update("freeMessage", e.target.value)} />
              <div className="notice" style={{ marginTop: 0 }}>동료에게 평소 해 주고 싶었던 메시지를 작성해 주세요!</div>
            </div>
          </section>

          <div className="button-row">
            <button className="btn secondary" disabled={busy || index === 0} onClick={() => setIndex((prev) => Math.max(0, prev - 1))}>
              이전
            </button>
            <button className="btn secondary" disabled={busy || Boolean(currentInvalid)} onClick={() => saveCurrent(0)}>
              현재 대상 저장
            </button>
            <button className="btn" disabled={busy || Boolean(currentInvalid)} onClick={() => saveCurrent(1)}>
              저장 후 다음
            </button>
          </div>
        </div>

        <div>
          <DimensionGuide title="리더십 3영역 - 6개 Dimension 설명" />
          <div className="panel" style={{ marginTop: 20 }}>
            <h2>최종 제출</h2>
            <p className="muted">배정된 모든 대상이 완료 상태가 되어야 최종 제출할 수 있습니다.</p>
            <div className="button-row">
              <button className="btn" disabled={busy || completedCount !== data.assignments.length} onClick={submitAll}>
                최종 제출
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
