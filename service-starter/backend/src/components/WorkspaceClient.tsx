"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicPeerGetResponse, PublicSelfGetResponse } from "../types/api";
import type { Dimension } from "../types/survey";
import DimensionGuide from "./DimensionGuide";

type TabKey = "self" | "peer";
type SelectValue = Dimension | "";

type WorkspaceResponse = PublicSelfGetResponse & {
  linked: {
    peerToken: string | null;
    reportToken: string | null;
    peerAssignments: number;
    peerCompleted: number;
    peerSubmitted: boolean;
  };
};

type SelfFormState = {
  participantId: string;
  strength1: SelectValue;
  strength1Comment: string;
  strength2: SelectValue;
  strength2Comment: string;
  growth1: SelectValue;
  growth1Comment: string;
  growth2: SelectValue;
  growth2Comment: string;
};

type PeerFormState = {
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

function validateSelf(form: SelfFormState) {
  if (!form.strength1 || !form.strength2) return "강점 1과 강점 2를 모두 선택해 주세요.";
  if (!form.growth1 || !form.growth2) return "성장가능성 1과 성장가능성 2를 모두 선택해 주세요.";
  if (form.strength1 === form.strength2) return "강점 1과 강점 2는 서로 다른 항목이어야 합니다.";
  if (form.growth1 === form.growth2) return "성장가능성 1과 성장가능성 2는 서로 다른 항목이어야 합니다.";
  if (![form.strength1Comment, form.strength2Comment, form.growth1Comment, form.growth2Comment].every((item) => item.trim())) {
    return "강점과 성장가능성에 대한 판단 근거를 모두 작성해 주세요.";
  }
  return "";
}

function validatePeer(form: PeerFormState) {
  if (!form.strength1 || !form.strength2) return "강점 1과 강점 2를 모두 선택해 주세요.";
  if (!form.growth1 || !form.growth2) return "성장가능성 1과 성장가능성 2를 모두 선택해 주세요.";
  if (form.strength1 === form.strength2) return "강점 1과 강점 2는 서로 다른 항목이어야 합니다.";
  if (form.growth1 === form.growth2) return "성장가능성 1과 성장가능성 2는 서로 다른 항목이어야 합니다.";
  if (![form.strength1Comment, form.strength2Comment, form.growth1Comment, form.growth2Comment].every((item) => item.trim())) {
    return "강점과 성장가능성에 대한 판단 근거를 모두 작성해 주세요.";
  }
  return "";
}

export default function WorkspaceClient({ token }: { token: string }) {
  const [tab, setTab] = useState<TabKey>("self");
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [peerData, setPeerData] = useState<PublicPeerGetResponse | null>(null);
  const [selfForm, setSelfForm] = useState<SelfFormState | null>(null);
  const [peerForms, setPeerForms] = useState<Record<string, PeerFormState>>({});
  const [activeAssignmentId, setActiveAssignmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selfMessage, setSelfMessage] = useState("");
  const [peerMessage, setPeerMessage] = useState("");
  const [savingSelf, setSavingSelf] = useState(false);
  const [savingPeer, setSavingPeer] = useState(false);
  const [submittingPeer, setSubmittingPeer] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError("");

    const workspaceResponse = await fetch(`/api/public/workspace/${token}`, { cache: "no-store" });
    const workspacePayload = await workspaceResponse.json().catch(() => ({}));

    if (!workspaceResponse.ok) {
      setError(workspacePayload.error || "참여 페이지를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    const nextWorkspace = workspacePayload as WorkspaceResponse;
    setWorkspace(nextWorkspace);
    setSelfForm({
      participantId: nextWorkspace.participant.participantId,
      strength1: (nextWorkspace.response.strength1 as SelectValue) || "",
      strength1Comment: nextWorkspace.response.strength1Comment || "",
      strength2: (nextWorkspace.response.strength2 as SelectValue) || "",
      strength2Comment: nextWorkspace.response.strength2Comment || "",
      growth1: (nextWorkspace.response.growth1 as SelectValue) || "",
      growth1Comment: nextWorkspace.response.growth1Comment || "",
      growth2: (nextWorkspace.response.growth2 as SelectValue) || "",
      growth2Comment: nextWorkspace.response.growth2Comment || "",
    });

    if (nextWorkspace.linked.peerToken) {
      const peerResponse = await fetch(`/api/public/peer/${nextWorkspace.linked.peerToken}`, { cache: "no-store" });
      const peerPayload = await peerResponse.json().catch(() => ({}));

      if (peerResponse.ok) {
        const nextPeerData = peerPayload as PublicPeerGetResponse;
        setPeerData(nextPeerData);

        const nextForms = Object.fromEntries(
          nextPeerData.assignments.map((assignment) => {
            const current = nextPeerData.responsesByAssignment[assignment.assignmentId] || {};
            return [
              assignment.assignmentId,
              {
                assignmentId: assignment.assignmentId,
                strength1: (current.strength1 as SelectValue) || "",
                strength1Comment: current.strength1Comment || "",
                strength2: (current.strength2 as SelectValue) || "",
                strength2Comment: current.strength2Comment || "",
                growth1: (current.growth1 as SelectValue) || "",
                growth1Comment: current.growth1Comment || "",
                growth2: (current.growth2 as SelectValue) || "",
                growth2Comment: current.growth2Comment || "",
                freeMessage: current.freeMessage || "",
              } satisfies PeerFormState,
            ];
          }),
        ) as Record<string, PeerFormState>;

        setPeerForms(nextForms);
        const firstPending = nextPeerData.assignments.find((assignment) => assignment.status !== "completed");
        setActiveAssignmentId(firstPending?.assignmentId || nextPeerData.assignments[0]?.assignmentId || "");
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [token]);

  const selfValidation = useMemo(() => (selfForm ? validateSelf(selfForm) : ""), [selfForm]);
  const activePeerForm = activeAssignmentId ? peerForms[activeAssignmentId] : null;
  const activePeerValidation = useMemo(() => (activePeerForm ? validatePeer(activePeerForm) : ""), [activePeerForm]);
  const allPeerComplete = useMemo(() => {
    if (!peerData) return false;
    return peerData.assignments.every((assignment) => {
      const form = peerForms[assignment.assignmentId];
      return form && !validatePeer(form);
    });
  }, [peerData, peerForms]);

  function updateSelf(key: keyof SelfFormState, value: string) {
    if (!selfForm) return;
    setSelfForm({ ...selfForm, [key]: value } as SelfFormState);
    setError("");
    setSelfMessage("");
  }

  function updatePeer(assignmentId: string, key: keyof PeerFormState, value: string) {
    setPeerForms((prev) => ({
      ...prev,
      [assignmentId]: { ...prev[assignmentId], [key]: value } as PeerFormState,
    }));
    setError("");
    setPeerMessage("");
  }

  async function saveSelf() {
    if (!selfForm || selfValidation) {
      setError(selfValidation || "자가진단 필수 문항을 모두 작성해 주세요.");
      setTab("self");
      return;
    }

    setSavingSelf(true);
    const response = await fetch(`/api/public/self/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selfForm),
    });
    const payload = await response.json().catch(() => ({}));
    setSavingSelf(false);

    if (!response.ok) {
      setError(payload.error || "자가진단 저장에 실패했습니다.");
      return;
    }

    setSelfMessage("자가진단이 저장되었습니다.");
    await loadAll();
  }

  async function savePeer(moveNext = false) {
    if (!workspace?.linked.peerToken || !activePeerForm) return;
    if (activePeerValidation) {
      setError(activePeerValidation);
      setTab("peer");
      return;
    }

    setSavingPeer(true);
    const response = await fetch(`/api/public/peer/${workspace.linked.peerToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activePeerForm),
    });
    const payload = await response.json().catch(() => ({}));
    setSavingPeer(false);

    if (!response.ok) {
      setError(payload.error || "Peer 피드백 저장에 실패했습니다.");
      return;
    }

    setPeerMessage("현재 대상에 대한 Peer 피드백이 저장되었습니다.");

    if (moveNext && peerData) {
      const currentIndex = peerData.assignments.findIndex((item) => item.assignmentId === activeAssignmentId);
      const nextAssignment =
        peerData.assignments
          .slice(currentIndex + 1)
          .find((item) => {
            const form = peerForms[item.assignmentId];
            return !form || !!validatePeer(form);
          }) || peerData.assignments[currentIndex + 1];

      if (nextAssignment) {
        setActiveAssignmentId(nextAssignment.assignmentId);
      }
    }

    await loadAll();
    setTab("peer");
  }

  async function submitPeer() {
    if (!workspace?.linked.peerToken) return;
    if (!allPeerComplete) {
      setError("배정된 모든 Peer 피드백을 완료해야 최종 제출할 수 있습니다.");
      setTab("peer");
      return;
    }

    setSubmittingPeer(true);
    const response = await fetch(`/api/public/peer/${workspace.linked.peerToken}/submit`, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    setSubmittingPeer(false);

    if (!response.ok) {
      setError(payload.error || "Peer 최종 제출에 실패했습니다.");
      return;
    }

    setPeerMessage("Peer 피드백 최종 제출이 완료되었습니다.");
    await loadAll();
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="panel">참여 페이지를 불러오는 중입니다...</div>
      </main>
    );
  }

  if (error && !workspace) {
    return (
      <main className="page-shell">
        <div className="error-box">{error}</div>
      </main>
    );
  }

  if (!workspace || !selfForm) return null;

  const selfDone = workspace.surveyMeta.status === "submitted";
  const peerDone = Boolean(workspace.linked.peerSubmitted);

  return (
    <main className="page-shell">
      <section className="page-hero">
        <div>
          <div className="eyebrow">2026 SK엔무브 팀장 SUPEX 워크샵</div>
          <h1>{workspace.participant.nameKo} 팀장님, 진단을 진행해 주세요.</h1>
          <p>
            자가진단과 Peer 피드백을 작성해 주세요. 제출해 주신 모든 응답은 익명 처리되며, 팀장 워크샵 세션용으로만
            활용됩니다. (~3/18(수))
          </p>
        </div>
        <div className="hero-badge">{workspace.participant.teamName}</div>
      </section>

      <div className="meta-card">
        <div>
          <div className="meta-label">자가진단</div>
          <div className="meta-value">{selfDone ? "완료" : "작성 필요"}</div>
        </div>
        <div>
          <div className="meta-label">Peer 피드백</div>
          <div className="meta-value">
            {workspace.linked.peerCompleted} / {workspace.linked.peerAssignments}
          </div>
        </div>
        <div>
          <div className="meta-label">리포트 안내</div>
          <div className="meta-value">HR 별도 제공</div>
        </div>
      </div>

      <div className="tab-row">
        <button className={`tab-btn ${tab === "self" ? "active" : ""}`} onClick={() => setTab("self")}>
          자가진단
        </button>
        <button className={`tab-btn ${tab === "peer" ? "active" : ""}`} onClick={() => setTab("peer")}>
          Peer 피드백
        </button>
      </div>

      {error ? <div className="error-box" style={{ marginTop: 18 }}>{error}</div> : null}
      {selfMessage ? <div className="message">{selfMessage}</div> : null}
      {peerMessage ? <div className="message">{peerMessage}</div> : null}

      <div className="grid-2" style={{ alignItems: "start", marginTop: 22 }}>
        <div>
          {tab === "self" ? (
            <section className="panel">
              <h2>자가진단 작성</h2>

              <section className="survey-section strength-section">
                <div className="survey-section-head">
                  <div className="survey-section-badge strength">강점</div>
                  <h3>내가 생각하는 강점 2가지</h3>
                </div>
                <p className="muted">강점 2개를 고르고 각 항목에 대한 판단 근거를 작성해 주세요.</p>
                <div className="form-grid">
                  <div className="field">
                    <label>강점 1</label>
                    <select className="select" value={selfForm.strength1} onChange={(e) => updateSelf("strength1", e.target.value)}>
                      <option value="">---선택하세요---</option>
                      {workspace.surveyMeta.dimensions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>강점 1 판단 근거</label>
                    <textarea className="textarea" value={selfForm.strength1Comment} onChange={(e) => updateSelf("strength1Comment", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>강점 2</label>
                    <select className="select" value={selfForm.strength2} onChange={(e) => updateSelf("strength2", e.target.value)}>
                      <option value="">---선택하세요---</option>
                      {workspace.surveyMeta.dimensions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>강점 2 판단 근거</label>
                    <textarea className="textarea" value={selfForm.strength2Comment} onChange={(e) => updateSelf("strength2Comment", e.target.value)} />
                  </div>
                </div>
              </section>

              <section className="survey-section growth-section">
                <div className="survey-section-head">
                  <div className="survey-section-badge growth">성장가능성</div>
                  <h3>앞으로 더 키우고 싶은 영역 2가지</h3>
                </div>
                <p className="muted">성장가능성 2개를 고르고 각 항목에 대한 판단 근거를 작성해 주세요.</p>
                <div className="form-grid">
                  <div className="field">
                    <label>성장가능성 1</label>
                    <select className="select" value={selfForm.growth1} onChange={(e) => updateSelf("growth1", e.target.value)}>
                      <option value="">---선택하세요---</option>
                      {workspace.surveyMeta.dimensions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>성장가능성 1 판단 근거</label>
                    <textarea className="textarea" value={selfForm.growth1Comment} onChange={(e) => updateSelf("growth1Comment", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>성장가능성 2</label>
                    <select className="select" value={selfForm.growth2} onChange={(e) => updateSelf("growth2", e.target.value)}>
                      <option value="">---선택하세요---</option>
                      {workspace.surveyMeta.dimensions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>성장가능성 2 판단 근거</label>
                    <textarea className="textarea" value={selfForm.growth2Comment} onChange={(e) => updateSelf("growth2Comment", e.target.value)} />
                  </div>
                </div>
              </section>

              {selfValidation ? <div className="notice">저장 조건: {selfValidation}</div> : null}

              <div className="button-row">
                <button className="btn" type="button" disabled={Boolean(selfValidation) || savingSelf} onClick={saveSelf}>
                  {savingSelf ? "저장 중..." : "자가진단 저장"}
                </button>
                {workspace.linked.peerToken ? (
                  <button className="btn secondary" type="button" onClick={() => setTab("peer")}>
                    Peer 피드백으로 이동
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          {tab === "peer" ? (
            <section className="panel">
              <h2>Peer 피드백</h2>
              {!workspace.linked.peerToken || !peerData ? (
                <div className="empty-state">이 계정에는 배정된 Peer 피드백 대상이 없습니다.</div>
              ) : (
                <>
                  <div className="progress-grid">
                    {peerData.assignments.map((assignment) => {
                      const form = peerForms[assignment.assignmentId];
                      const complete = form && !validatePeer(form);
                      return (
                        <button
                          key={assignment.assignmentId}
                          type="button"
                          className={`assignment-card ${activeAssignmentId === assignment.assignmentId ? "active" : ""} ${complete ? "completed" : ""}`}
                          onClick={() => setActiveAssignmentId(assignment.assignmentId)}
                        >
                          <div className={`status-pill ${complete ? "done" : assignment.status === "in_progress" ? "progress" : "pending"}`}>
                            {complete ? "완료" : assignment.status === "in_progress" ? "작성 중" : "미작성"}
                          </div>
                          <h3 style={{ margin: "12px 0 6px" }}>
                            {assignment.sequenceNo}. {assignment.target.nameKo}
                          </h3>
                          <div className="muted">{assignment.target.teamName}</div>
                        </button>
                      );
                    })}
                  </div>

                  {activePeerForm ? (
                    <div style={{ marginTop: 20 }}>
                      <section className="survey-section strength-section">
                        <div className="survey-section-head">
                          <div className="survey-section-badge strength">강점</div>
                          <h3>{peerData.assignments.find((item) => item.assignmentId === activeAssignmentId)?.target.nameKo} 팀장의 강점 2가지</h3>
                        </div>
                        <p className="muted">강점 2개를 고르고 각 항목에 대한 판단 근거를 작성해 주세요.</p>
                        <div className="form-grid">
                          <div className="field">
                            <label>강점 1</label>
                            <select className="select" value={activePeerForm.strength1} onChange={(e) => updatePeer(activePeerForm.assignmentId, "strength1", e.target.value)}>
                              <option value="">---선택하세요---</option>
                              {peerData.dimensions.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>강점 1 판단 근거</label>
                            <textarea className="textarea" value={activePeerForm.strength1Comment} onChange={(e) => updatePeer(activePeerForm.assignmentId, "strength1Comment", e.target.value)} />
                          </div>
                          <div className="field">
                            <label>강점 2</label>
                            <select className="select" value={activePeerForm.strength2} onChange={(e) => updatePeer(activePeerForm.assignmentId, "strength2", e.target.value)}>
                              <option value="">---선택하세요---</option>
                              {peerData.dimensions.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>강점 2 판단 근거</label>
                            <textarea className="textarea" value={activePeerForm.strength2Comment} onChange={(e) => updatePeer(activePeerForm.assignmentId, "strength2Comment", e.target.value)} />
                          </div>
                        </div>
                      </section>

                      <section className="survey-section growth-section">
                        <div className="survey-section-head">
                          <div className="survey-section-badge growth">성장가능성</div>
                          <h3>{peerData.assignments.find((item) => item.assignmentId === activeAssignmentId)?.target.nameKo} 팀장의 성장가능성 2가지</h3>
                        </div>
                        <p className="muted">성장가능성 2개를 고르고 각 항목에 대한 판단 근거를 작성해 주세요.</p>
                        <div className="form-grid">
                          <div className="field">
                            <label>성장가능성 1</label>
                            <select className="select" value={activePeerForm.growth1} onChange={(e) => updatePeer(activePeerForm.assignmentId, "growth1", e.target.value)}>
                              <option value="">---선택하세요---</option>
                              {peerData.dimensions.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>성장가능성 1 판단 근거</label>
                            <textarea className="textarea" value={activePeerForm.growth1Comment} onChange={(e) => updatePeer(activePeerForm.assignmentId, "growth1Comment", e.target.value)} />
                          </div>
                          <div className="field">
                            <label>성장가능성 2</label>
                            <select className="select" value={activePeerForm.growth2} onChange={(e) => updatePeer(activePeerForm.assignmentId, "growth2", e.target.value)}>
                              <option value="">---선택하세요---</option>
                              {peerData.dimensions.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>성장가능성 2 판단 근거</label>
                            <textarea className="textarea" value={activePeerForm.growth2Comment} onChange={(e) => updatePeer(activePeerForm.assignmentId, "growth2Comment", e.target.value)} />
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
                          <textarea className="textarea" value={activePeerForm.freeMessage} onChange={(e) => updatePeer(activePeerForm.assignmentId, "freeMessage", e.target.value)} />
                          <div className="notice" style={{ marginTop: 0 }}>동료에게 평소 해 주고 싶었던 메시지를 작성해 주세요!</div>
                        </div>
                      </section>

                      {activePeerValidation ? <div className="notice">저장 조건: {activePeerValidation}</div> : null}

                      <div className="button-row">
                        <button className="btn" type="button" disabled={Boolean(activePeerValidation) || savingPeer} onClick={() => savePeer(false)}>
                          {savingPeer ? "저장 중..." : "현재 대상 저장"}
                        </button>
                        <button className="btn secondary" type="button" disabled={Boolean(activePeerValidation) || savingPeer} onClick={() => savePeer(true)}>
                          저장 후 다음
                        </button>
                        <button className="btn secondary" type="button" disabled={!allPeerComplete || submittingPeer || peerDone} onClick={submitPeer}>
                          {peerDone ? "최종 제출 완료" : submittingPeer ? "제출 중..." : "Peer 최종 제출"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
        </div>

        <DimensionGuide title="리더십 3영역 - 6개 Dimension 설명" />
      </div>
    </main>
  );
}
