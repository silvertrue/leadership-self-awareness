"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicSelfGetResponse } from "../types/api";
import type { Dimension } from "../types/survey";
import DimensionGuide from "./DimensionGuide";

type SelectValue = Dimension | "";

type FormState = {
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

function validate(form: FormState) {
  if (!form.strength1 || !form.strength2) return "강점 1과 강점 2를 모두 선택해 주세요.";
  if (!form.growth1 || !form.growth2) return "성장가능성 1과 성장가능성 2를 모두 선택해 주세요.";
  if (form.strength1 === form.strength2) return "강점 1과 강점 2는 서로 다른 항목이어야 합니다.";
  if (form.growth1 === form.growth2) return "성장가능성 1과 성장가능성 2는 서로 다른 항목이어야 합니다.";
  if (![form.strength1Comment, form.strength2Comment, form.growth1Comment, form.growth2Comment].every((item) => item.trim())) {
    return "모든 판단 근거를 작성해 주세요.";
  }
  return "";
}

function buildInitialForm(payload: PublicSelfGetResponse): FormState {
  return {
    participantId: payload.participant.participantId,
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
      const payload = await response.json();
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

  async function save() {
    if (!form || !data || validationMessage) {
      setError(validationMessage || "필수 문항을 모두 작성해 주세요.");
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/public/self/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
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
          <h1>강점 2개와 성장가능성 2개를 선택하고, 그렇게 고른 근거를 작성해 주세요.</h1>
          <p>
            정답을 맞히는 시간이 아니라, 내가 실제로 어떤 경험과 행동을 통해 그렇게 인식하고 있는지 돌아보는
            시간입니다.
          </p>
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
          <p className="muted">
            각 영역에서 항목을 먼저 선택한 뒤, 왜 그렇게 판단했는지 근거를 작성해 주세요. 모든 판단 근거는
            필수입니다.
          </p>

          {error ? <div className="error-box" style={{ marginTop: 16 }}>{error}</div> : null}
          {message ? <div className="message">{message}</div> : null}
          {validationMessage ? <div className="notice">저장 가능 조건: {validationMessage}</div> : null}

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
              <textarea
                className="textarea"
                value={form.strength1Comment}
                onChange={(e) => update("strength1Comment", e.target.value)}
              />
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
              <textarea
                className="textarea"
                value={form.strength2Comment}
                onChange={(e) => update("strength2Comment", e.target.value)}
              />
            </div>

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
              <textarea
                className="textarea"
                value={form.growth1Comment}
                onChange={(e) => update("growth1Comment", e.target.value)}
              />
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
              <textarea
                className="textarea"
                value={form.growth2Comment}
                onChange={(e) => update("growth2Comment", e.target.value)}
              />
            </div>
          </div>

          <div className="button-row">
            <button className="btn" disabled={saving || Boolean(validationMessage)} onClick={save}>
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>

        <DimensionGuide title="6개 Dimension 안내" />
      </div>
    </main>
  );
}
