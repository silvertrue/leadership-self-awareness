"use client";

import { useEffect, useMemo, useState } from 'react';
import type { AdminDashboardResponse } from '../types/api';

type SessionInfo = {
  email: string;
  expiresAt: string;
};

type LoginState = {
  email: string;
  password: string;
};

export default function AdminDashboardClient() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [login, setLogin] = useState<LoginState>({ email: '', password: '' });

  async function loadDashboard() {
    const response = await fetch('/api/admin/dashboard', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || '대시보드 정보를 불러오지 못했습니다.');
    }
    setData(payload);
  }

  async function loadSession() {
    const response = await fetch('/api/admin/session', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSession(null);
      return false;
    }
    setSession(payload.session);
    return true;
  }

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      setError('');
      try {
        const hasSession = await loadSession();
        if (hasSession) {
          await loadDashboard();
        }
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '관리자 화면을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  const participantCompletion = useMemo(() => {
    if (!data || data.summary.participantCount === 0) return 0;
    return Math.round((data.summary.selfCompleted / data.summary.participantCount) * 100);
  }, [data]);

  const peerCompletion = useMemo(() => {
    if (!data || data.summary.peerAssignments === 0) return 0;
    return Math.round((data.summary.peerCompleted / data.summary.peerAssignments) * 100);
  }, [data]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || '로그인에 실패했습니다.');
      }
      setSession(payload.session);
      await loadDashboard();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '로그인에 실패했습니다.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError('');
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setSession(null);
      setData(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '로그아웃에 실패했습니다.');
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return <main className="page-shell"><div className="panel">HR 대시보드를 불러오는 중입니다...</div></main>;
  }

  if (!session) {
    return (
      <main className="page-shell">
        <section className="page-hero">
          <div>
            <div className="eyebrow">HR Dashboard</div>
            <h1>워크샵 응답 현황을 한눈에 확인하세요</h1>
            <p>자가진단 제출률, Peer 피드백 진행률, 리포트 생성 준비 상태를 관리자 전용 화면에서 확인할 수 있습니다.</p>
          </div>
          <div className="hero-badge">관리자 전용</div>
        </section>
        <div className="grid-2">
          <section className="panel">
            <h2>관리자 로그인</h2>
            <p className="muted">Vercel 환경변수에 등록한 관리자 이메일과 비밀번호로 로그인해 주세요.</p>
            {error ? <div className="error-box" style={{ marginTop: 16 }}>{error}</div> : null}
            <form onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="email">이메일</label>
                <input id="email" className="input" type="email" value={login.email} onChange={(e) => setLogin((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="password">비밀번호</label>
                <input id="password" className="input" type="password" value={login.password} onChange={(e) => setLogin((prev) => ({ ...prev, password: e.target.value }))} />
              </div>
              <div className="button-row">
                <button className="btn" type="submit" disabled={loggingIn || !login.email || !login.password}>{loggingIn ? '로그인 중...' : '로그인'}</button>
              </div>
            </form>
          </section>
          <section className="panel">
            <h2>이 화면에서 보는 정보</h2>
            <div className="chip-row" style={{ marginTop: 12 }}>
              <span className="chip blue">자가진단 제출 현황</span>
              <span className="chip orange">Peer 진행 현황</span>
              <span className="chip green">리포트 준비 현황</span>
            </div>
            <div className="notice">로그인 후에는 조별 현황, 응답자별 완료 수, 참가자별 리포트 준비 상태까지 바로 확인할 수 있습니다.</div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-hero">
        <div>
          <div className="eyebrow">HR Dashboard</div>
          <h1>2026 1차 팀장 워크샵 응답 현황</h1>
          <p>자가진단, Peer 피드백, 리포트 준비 상태를 실시간으로 확인하고 미완료 대상을 빠르게 파악할 수 있습니다.</p>
        </div>
        <div className="hero-badge">{session.email}</div>
      </section>

      {error ? <div className="error-box" style={{ marginTop: 22 }}>{error}</div> : null}

      <div className="admin-toolbar">
        <div className="notice">세션 만료: {new Date(session.expiresAt).toLocaleString('ko-KR')}</div>
        <div className="button-row" style={{ marginTop: 0 }}>
          <button className="btn secondary" type="button" onClick={() => loadDashboard()}>새로고침</button>
          <button className="btn secondary" type="button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? '로그아웃 중...' : '로그아웃'}</button>
        </div>
      </div>

      {data ? (
        <>
          <section className="admin-stat-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-label">전체 참가자</div>
              <div className="admin-stat-value">{data.summary.participantCount}명</div>
              <div className="admin-stat-sub">워크샵 대상 전체 인원</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">자가진단 제출</div>
              <div className="admin-stat-value">{data.summary.selfCompleted}명</div>
              <div className="admin-stat-sub">제출률 {participantCompletion}%</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Peer 완료</div>
              <div className="admin-stat-value">{data.summary.peerCompleted}/{data.summary.peerAssignments}</div>
              <div className="admin-stat-sub">응답 진행률 {peerCompletion}%</div>
            </div>
            <div className="admin-stat-card highlight">
              <div className="admin-stat-label">리포트 준비 완료</div>
              <div className="admin-stat-value">{data.summary.reportReady}명</div>
              <div className="admin-stat-sub">자가진단 + Peer 조건 충족</div>
            </div>
          </section>

          <div className="grid-2" style={{ alignItems: 'start' }}>
            <section className="panel">
              <h2>조별 현황</h2>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>조</th>
                      <th>인원</th>
                      <th>자가진단</th>
                      <th>리포트 준비</th>
                      <th>1인당 Peer 대상</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.map((group) => (
                      <tr key={group.groupName}>
                        <td>{group.groupName}</td>
                        <td>{group.members}</td>
                        <td>{group.selfCompleted}/{group.members}</td>
                        <td>{group.reportReady}/{group.members}</td>
                        <td>{group.targetsPerPerson}명</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <h2>응답자별 Peer 진행</h2>
              <div className="table-wrap admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>조</th>
                      <th>완료</th>
                      <th>최종 제출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.responders.map((responder) => (
                      <tr key={responder.responderId}>
                        <td>{responder.nameKo}</td>
                        <td>{responder.groupName}</td>
                        <td>{responder.completed}/{responder.total}</td>
                        <td>
                          <span className={`status-pill ${responder.submitted ? 'done' : responder.completed > 0 ? 'progress' : 'pending'}`}>
                            {responder.submitted ? '제출 완료' : responder.completed > 0 ? '작성 중' : '미작성'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="panel" style={{ marginTop: 22 }}>
            <h2>참가자별 리포트 준비 상태</h2>
            <div className="table-wrap admin-table-scroll-lg">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>조직</th>
                    <th>조</th>
                    <th>자가진단</th>
                    <th>Peer 수집</th>
                    <th>리포트 상태</th>
                    <th>리포트</th>
                  </tr>
                </thead>
                <tbody>
                  {data.participants.map((participant) => (
                    <tr key={participant.participantId}>
                      <td>{participant.nameKo}</td>
                      <td>{participant.teamName}</td>
                      <td>{participant.groupName}</td>
                      <td>
                        <span className={`status-pill ${participant.selfCompleted ? 'done' : 'pending'}`}>
                          {participant.selfCompleted ? '완료' : '대기'}
                        </span>
                      </td>
                      <td>{participant.peerResponseCount}/{participant.expectedPeerCount}</td>
                      <td>
                        <span className={`status-pill ${participant.reportReady ? 'done' : participant.peerResponseCount > 0 || participant.selfCompleted ? 'progress' : 'pending'}`}>
                          {participant.reportReady ? '준비 완료' : participant.peerResponseCount > 0 || participant.selfCompleted ? '진행 중' : '대기'}
                        </span>
                      </td>
                      <td>
                        {participant.reportToken ? (
                          <div className="admin-link-stack">
                            <a className="btn secondary admin-mini-btn" href={`/report/${participant.reportToken}`} target="_blank" rel="noreferrer">열기</a>
                            <a className="btn secondary admin-mini-btn" href={`/report/${participant.reportToken}?print=1`} target="_blank" rel="noreferrer">다운로드</a>
                          </div>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}