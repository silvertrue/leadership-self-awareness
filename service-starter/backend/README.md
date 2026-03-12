# Backend Starter

Next.js App Router + Prisma 기준의 백엔드 스타터입니다.

## 현재 들어있는 것
- `package.json`, `tsconfig.json`, `next.config.mjs`
- `app/api/...` Route Handler 뼈대
- `prisma/schema.prisma`
- `src/types`, `src/lib`, `src/repositories`, `src/services`, `src/workers`, `src/prompts`, `src/templates`
- `examples/` 응답 예시 JSON
- 관리자 로그인/세션/로그아웃 API
- 리포트 HTML 저장 + Playwright PDF fallback worker

## 시작 순서
1. Node.js 설치
2. `npm install`
3. `.env.example`를 `.env`로 복사
4. PostgreSQL 준비
5. `npx prisma generate`
6. `npx prisma migrate dev`
7. `npm run dev`

## 관리자 인증
- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`

환경변수:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_SESSION_MAX_AGE_HOURS`

## 리포트 출력
- 리포트 생성 시 HTML 파일을 먼저 저장합니다.
- `playwright`가 설치되어 있고 실행 가능하면 PDF까지 같이 생성합니다.
- PDF 생성이 실패해도 HTML 산출물은 남습니다.
- 출력 경로는 `REPORT_OUTPUT_DIR` 환경변수로 조정합니다.

## 먼저 구현/보완하면 좋은 곳
- `src/services/dashboard-service.ts`
  - 실제 집계 쿼리 채우기
- `src/services/llm-summary-service.ts`
  - OpenAI API 연결 검증 및 에러 재시도 정책
- 관리자 로그인 UI
- 리포트 HTML 템플릿 고도화

## 참고 문서
- ../site-mvp/service-design/deployment-architecture.md
- ../site-mvp/service-design/api-spec.yaml
- ../site-mvp/service-design/schema.sql
- ../site-mvp/service-design/gpt-summary-integration.md
- ../site-mvp/service-design/backend-structure.md
