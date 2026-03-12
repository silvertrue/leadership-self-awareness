# 백엔드 폴더 구조 제안

## 권장 루트
- self-awareness-session/
  - site-mvp/                현재 브라우저 앱
  - service-starter/         배포형 서비스 시작점
    - backend/

## backend 구조
```text
backend/
  README.md
  src/
    routes/
      public/
        self.ts
        peer.ts
        report.ts
      admin/
        auth.ts
        participants.ts
        assignments.ts
        dashboard.ts
        reports.ts
    services/
      self-response-service.ts
      peer-response-service.ts
      dashboard-service.ts
      report-service.ts
      token-service.ts
      llm-summary-service.ts
    repositories/
      participant-repository.ts
      assignment-repository.ts
      self-response-repository.ts
      peer-response-repository.ts
      report-run-repository.ts
    workers/
      report-generation-worker.ts
    prompts/
      strength-summary.prompt.md
      growth-summary.prompt.md
    lib/
      db.ts
      auth.ts
      validation.ts
      time.ts
    types/
      api.ts
      report.ts
      survey.ts
  examples/
    public-self-get-response.json
    public-peer-get-response.json
    public-report-get-response.json
    admin-dashboard-response.json
```

## 왜 이렇게 나누는가
- routes
  - HTTP 입출력만 처리
  - validation 호출
  - service layer 호출
- services
  - 실제 업무 규칙 처리
  - 제출 가능 여부, 상태 계산, 리포트 생성 트리거 담당
- repositories
  - DB read/write 캡슐화
  - ORM 교체 영향 최소화
- workers
  - GPT 요약, HTML/PDF 생성 같은 비동기 작업 처리
- prompts
  - LLM 프롬프트 버전 관리
- lib
  - DB 연결, 공통 유틸, auth, validation
- types
  - API payload와 리포트 구조 정의

## 엔드포인트와 파일 매핑 예시
- `GET /api/public/self/:token` -> `routes/public/self.ts`
- `POST /api/public/self/:token` -> `routes/public/self.ts`
- `GET /api/public/peer/:token` -> `routes/public/peer.ts`
- `POST /api/public/peer/:token` -> `routes/public/peer.ts`
- `POST /api/public/peer/:token/submit` -> `routes/public/peer.ts`
- `GET /api/public/report/:token` -> `routes/public/report.ts`
- `GET /api/admin/dashboard` -> `routes/admin/dashboard.ts`
- `POST /api/admin/reports/generate-all` -> `routes/admin/reports.ts`

## 구현 순서 추천
1. lib/db + types + repositories
2. public self / peer 저장 API
3. admin dashboard 집계 API
4. report service + worker
5. LLM summary service 연결

## 지금 만든 스타터 폴더
- service-starter/backend/
이 폴더는 아직 런타임 코드는 없고, 구조를 바로 채울 수 있도록 빈 디렉터리와 예시 파일을 준비한 상태입니다.
