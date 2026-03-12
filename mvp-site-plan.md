# 자기인식 세션 서베이/리포트 사이트 MVP 구상

## 가능 여부
가능합니다. 현재 자료를 기준으로 하면 아래 3가지를 한 사이트로 묶을 수 있습니다.

1. 팀장 대상 서베이 배포
2. 응답 자동 취합
3. 개인 리포트 자동 생성

## 추천 범위
처음부터 복잡하게 가지 말고 MVP는 다음 범위로 가는 게 가장 안전합니다.

- 응답자 구분용 고유 링크 발송
- 자가진단 응답 폼
- Peer 피드백 응답 폼
- 관리자 페이지에서 응답 현황 확인
- 개인별 비교 리포트 자동 생성
- HTML/PDF 다운로드

## 권장 구조

### 프론트엔드
- React 또는 Next.js
- 페이지
  - 참가자용 자가진단 폼
  - 참가자용 Peer 피드백 폼
  - 응답 완료 페이지
  - 관리자 대시보드
  - 리포트 미리보기 페이지

### 백엔드
- FastAPI 또는 Node/Express
- 기능
  - 응답 저장 API
  - 대상자/응답자 매핑 API
  - 리포트 생성 API
  - PDF export API

### DB
- MVP는 SQLite로 시작 가능
- 실제 운영은 PostgreSQL 권장

## 핵심 데이터 모델

### participants
- id
- name
- team_name
- email
- role
- token_self
- created_at

### peer_targets
- id
- participant_id
- target_participant_id
- token_peer
- status

### self_responses
- id
- participant_id
- strength_1
- strength_1_comment
- strength_2
- strength_2_comment
- growth_1
- growth_1_comment
- growth_2
- growth_2_comment
- submitted_at

### peer_responses
- id
- target_participant_id
- responder_token
- strength_1
- strength_1_comment
- strength_2
- strength_2_comment
- growth_1
- growth_1_comment
- growth_2
- growth_2_comment
- free_message
- submitted_at

### generated_reports
- id
- participant_id
- summary_json
- html_path
- pdf_path
- generated_at

## 자동 리포트 생성 로직

1. 자가진단 응답 1건 조회
2. 해당 팀장에 대한 Peer 피드백 전체 조회
3. 강점 항목 빈도 집계
4. 성장가능성 항목 빈도 집계
5. 강점 코멘트 / 성장가능성 코멘트 분리 정리
6. 자가인식 vs 타인인식 비교 문장 생성
7. HTML 리포트 렌더링
8. PDF 파일 저장

## 리포트에 자동으로 들어갈 내용
- 자가진단 강점 2개 + 판단 근거
- 자가진단 성장과제 2개 + 판단 근거
- Peer 강점 Top 2 + 강점 코멘트
- Peer 성장가능성 Top 2 + 성장가능성 코멘트
- 일치/차이 인사이트
- 액션플랜 템플릿

## 운영 흐름

### 사전 준비
- 팀장 명단 업로드
- 자기 링크 / Peer 링크 생성
- 이메일 또는 메신저로 링크 배포

### 응답 수집
- 팀장은 자기진단 1회 제출
- 동료는 지정된 팀장에 대해 Peer 피드백 제출

### 마감 후
- 관리자 페이지에서 응답률 확인
- 리포트 일괄 생성 버튼 실행
- 개인별 HTML/PDF 다운로드

## 실제 운영에서 중요한 점
- 익명성 여부를 명확히 설계해야 함
- Peer 응답 중복 방지 필요
- 링크 유출 방지용 토큰 필요
- 마감일 이후 수정 허용 여부 결정 필요
- PDF 출력 시 한글 폰트 포함 필요

## 추천 MVP 순서

### 1단계
- 폼 2개 웹앱화
- 응답 DB 저장
- 관리자 응답 조회

### 2단계
- 리포트 HTML 자동 생성
- 강점/성장가능성 코멘트 분리 출력

### 3단계
- PDF export
- 일괄 배포용 ZIP 생성

## 지금 바로 만들 수 있는 것
현재 워크스페이스에서 별도 프로젝트로 아래까지는 바로 착수 가능합니다.

- 설문 웹앱 기본 구조
- SQLite 기반 저장
- 관리자 대시보드 초안
- 리포트 HTML 자동 생성기

## 추천 시작안
별도 프로젝트 폴더를 새로 만들어 아래 구조로 가는 것을 권장합니다.

- self-awareness-app/frontend
- self-awareness-app/backend
- self-awareness-app/reports
- self-awareness-app/data

## 결론
실제로 팀장들에게 돌릴 수 있는 사이트로 만드는 것 자체는 충분히 가능합니다. 핵심은 설문 입력보다도, 응답을 어떻게 매핑하고 리포트를 어떤 규칙으로 자동 생성할지 구조를 먼저 안정적으로 잡는 것입니다.
