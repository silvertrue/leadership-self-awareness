"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicSelfGetResponse } from "../types/api";
import type { Dimension, LaptopBringOption, LaptopOs, TransportMode } from "../types/survey";
import DimensionGuide from "./DimensionGuide";

type SelectValue = Dimension | "";

type FormState = {
  participantId: string;
  transportMode: TransportMode | "";
  laptopBringOption: LaptopBringOption | "";
  laptopOs: LaptopOs | "";
  strength1: SelectValue;
  strength1Comment: string;
  strength2: SelectValue;
  strength2Comment: string;
  growth1: SelectValue;
  growth1Comment: string;
  growth2: SelectValue;
  growth2Comment: string;
};

function validate(form: FormState) {
  if (!form.transportMode) return "대절버스 이용 여부를 선택해 주세요.";
  if (!form.laptopBringOption) return "개인 노트북 지참 가능 여부를 선택해 주세요.";
  if (form.laptopBringOption === "bring" && !form.laptopOs) return "노트북 지참 가능 시 OS 종류를 선택해 주세요.";
  if (!form.strength1 || !form.strength2) return "강점 1과 강점 2를 모두 선택해 주세요.";
  if (!form.growth1 || !form.growth2) return "성장가능성 1과 성장가능성 2를 모두 선택해 주세요.";
  if (form.strength1 === form.strength2) return "강점 1과 강점 2는 서로 다른 항목이어야 합니다.";
  if (form.growth1 === form.growth2) return "성장가능성 1과 성장가능성 2는 서로 다른 항목이어야 합니다.";
  if (![form.strength1Comment, form.strength2Comment, form.growth1Comment, form.growth2Comment].every((item) => item.trim())) {
    return "강점과 성장가능성에 대한 판단 근거를 모두 작성해 주세요.";
  }
  return "";
}

function buildInitialForm(payload: PublicSelfGetResponse): FormState {
  return {
    participantId: payload.participant.participantId,
    transportMode: payload.response.transportMode || "",
    laptopBringOption: payload.response.laptopBringOption || "",
    laptopOs: payload.response.laptopOs || "",
    strength1: (payload.response.strength1 as SelectValue) || "",
    strength1Comment: payload.response.strength1Comment || "",
    strength2: (payload.response.strength2 as SelectValue) || "",
    strength2Comment: payload.response.strength2Comment || "",
    growth1: (payload.response.growth1 as SelectValue) || "",
    growth1Comment: payload.response.growth1Comment || "",
    growth2: (payload.response.growth2 as SelectValue) || "",
    growth2Comment: payload.response.growth2Comment || "",
  };
}

export default function SelfSurveyClient({ token }: { token: string }) {
  const [data, setData] = useState<PublicSelfGetResponse | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/public/self/${token}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "자가진단 정보를 불러오지 못했습니다.");
        return;
      }

      setData(payload);
      setForm(buildInitialForm(payload));
    }

    load();
  }, [token]);

  const validationMessage = useMemo(() => (form ? validate(form) : ""), [form]);

  function update(key: keyof FormState, value: string) {
    if (!form) return;
    setForm({ ...form, [key]: value } as FormState);
    setError("");
    setMessage("");
  }

  function selectTransportMode(value: TransportMode) {
    if (!form) return;
    setForm({ ...form, transportMode: value });
    setError("");
    setMessage("");
  }

  function selectLaptopBringOption(value: LaptopBringOption) {
    if (!form) return;
    setForm({
      ...form,
      laptopBringOption: value,
      laptopOs: value === "bring" ? form.laptopOs : "",
    });
    setError("");
    setMessage("");
  }

  function selectLaptopOs(value: LaptopOs) {
    if (!form) return;
    setForm({ ...form, laptopOs: value });
    setError("");
    setMessage("");
  }

  async function save() {
    if (!form || validationMessage) {
      setError(validationMessage || "필수 문항을 모두 작성해 주세요.");
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/public/self/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error || "저장에 실패했습니다.");
      return;
    }

    setMessage("자가진단이 저장되었습니다.");
  }

  if (error && !data) {
    return (
      <main className="page-shell">
        <div className="error-box">{error}</div>
      </main>
    );
  }

  if (!data || !form) {
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
          <div className="eyebrow">자가진단</div>
          <h1>강점과 성장가능성을 구분해 선택하고, 그 근거를 작성해 주세요.</h1>
          <p>강점 2개와 성장가능성 2개를 각각 선택한 뒤, 판단 근거를 구체적으로 작성해 주세요.</p>
        </div>
        <div className="hero-badge">참가자용</div>
      </section>

      <div className="meta-card">
        <div>
          <div className="meta-label">이름</div>
          <div className="meta-value">{data.participant.nameKo}</div>
        </div>
        <div>
          <div className="meta-label">조직</div>
          <div className="meta-value">{data.participant.teamName}</div>
        </div>
        <div>
          <div className="meta-label">상태</div>
          <div className="meta-value">{data.surveyMeta.status === "submitted" ? "제출 완료" : "작성 중"}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>자가진단 입력</h2>
          <p className="muted">강점과 성장가능성은 서로 다른 의미이므로, 아래 두 섹션을 나누어 작성해 주세요.</p>

          {error ? <div className="error-box" style={{ marginTop: 16 }}>{error}</div> : null}
          {message ? <div className="message">{message}</div> : null}
          {validationMessage ? <div className="notice">저장 조건: {validationMessage}</div> : null}

          <div className="prep-grid">
            <section className="prep-card">
              <h3>워크샵 준비 문항 1</h3>
              <p className="muted">대절버스 이용 여부를 선택해 주세요.</p>
              <div className="choice-row">
                <button type="button" className={`choice-chip ${form.transportMode === "chartered_bus" ? "active" : ""}`} onClick={() => selectTransportMode("chartered_bus")}>
                  대절버스 이용
                </button>
                <button type="button" className={`choice-chip ${form.transportMode === "self_drive" ? "active" : ""}`} onClick={() => selectTransportMode("self_drive")}>
                  자차 이동
                </button>
              </div>
            </section>

            <section className="prep-card">
              <h3>워크샵 준비 문항 2</h3>
              <p className="muted">이번 워크샵에서는 AX 교육 실습을 위하여 개인 노트북 지참이 필요합니다. 노트북 지참이 가능하신지 응답해 주세요.</p>
              <div className="choice-row">
                <button type="button" className={`choice-chip ${form.laptopBringOption === "bring" ? "active" : ""}`} onClick={() => selectLaptopBringOption("bring")}>
                  개인노트북 지참 가능
                </button>
                <button type="button" className={`choice-chip ${form.laptopBringOption === "cannot_bring" ? "active" : ""}`} onClick={() => selectLaptopBringOption("cannot_bring")}>
                  개인노트북 지참 불가
                </button>
              </div>
              {form.laptopBringOption === "bring" ? (
                <div className="choice-row">
                  <button type="button" className={`choice-chip soft-active ${form.laptopOs === "windows" ? "active" : ""}`} onClick={() => selectLaptopOs("windows")}>
                    윈도우
                  </button>
                  <button type="button" className={`choice-chip soft-active ${form.laptopOs === "mac" ? "active" : ""}`} onClick={() => selectLaptopOs("mac")}>
                    맥
                  </button>
                </div>
              ) : null}
            </section>
          </div>

          <section className="survey-section strength-section">
            <div className="survey-section-head">
              <div className="survey-section-badge strength">강점</div>
              <h3>내가 생각하는 강점 2가지</h3>
            </div>
            <p className="muted">우측 설명을 참고해서 강점 2개를 고르고 각 항목에 대한 판단 근거를 작성해 주세요.</p>
            <div className="form-grid">
              <div className="field">
                <label>강점 1</label>
                <select className="select" value={form.strength1} onChange={(e) => update("strength1", e.target.value)}>
                  <option value="">---선택하세요---</option>
                  {data.surveyMeta.dimensions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>강점 1 판단 근거</label>
                <textarea className="textarea" value={form.strength1Comment} onChange={(e) => update("strength1Comment", e.target.value)} />
              </div>
              <div className="field">
                <label>강점 2</label>
                <select className="select" value={form.strength2} onChange={(e) => update("strength2", e.target.value)}>
                  <option value="">---선택하세요---</option>
                  {data.surveyMeta.dimensions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>강점 2 판단 근거</label>
                <textarea className="textarea" value={form.strength2Comment} onChange={(e) => update("strength2Comment", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="survey-section growth-section">
            <div className="survey-section-head">
              <div className="survey-section-badge growth">성장가능성</div>
              <h3>앞으로 더 키우고 싶은 영역 2가지</h3>
            </div>
            <p className="muted">우측 설명을 참고해서 성장가능성 2개를 고르고 각 항목에 대한 판단 근거를 작성해 주세요.</p>
            <div className="form-grid">
              <div className="field">
                <label>성장가능성 1</label>
                <select className="select" value={form.growth1} onChange={(e) => update("growth1", e.target.value)}>
                  <option value="">---선택하세요---</option>
                  {data.surveyMeta.dimensions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>성장가능성 1 판단 근거</label>
                <textarea className="textarea" value={form.growth1Comment} onChange={(e) => update("growth1Comment", e.target.value)} />
              </div>
              <div className="field">
                <label>성장가능성 2</label>
                <select className="select" value={form.growth2} onChange={(e) => update("growth2", e.target.value)}>
                  <option value="">---선택하세요---</option>
                  {data.surveyMeta.dimensions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>성장가능성 2 판단 근거</label>
                <textarea className="textarea" value={form.growth2Comment} onChange={(e) => update("growth2Comment", e.target.value)} />
              </div>
            </div>
          </section>

          <div className="button-row">
            <button className="btn" disabled={saving || Boolean(validationMessage)} onClick={save}>
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>

        <DimensionGuide title="리더십 3영역 - 6개 Dimension 설명" />
      </div>
    </main>
  );
}
