# Self Awareness Session Web App

## 시작 파일
브라우저에서 아래 파일을 직접 열면 됩니다.

- index.html
- admin-dashboard.html
- self-survey.html
- peer-survey.html
- report-viewer.html

## 현재 가능한 기능
- 참가자/Peer assignment 데이터 로드
- 자가진단 저장 및 재열람
- Peer 피드백 4명 순차 작성 및 최종 제출 처리
- 운영 대시보드에서 진행 현황 집계
- 개인 리포트 자동 계산 및 JSON 다운로드
- 응답 데이터 / 리포트 데이터 JSON 다운로드

## 링크 파라미터 지원
개인별 링크 운영을 가정해 아래 파라미터를 지원합니다.

- self-survey.html?participant=TL001
- peer-survey.html?responder=TL002
- report-viewer.html?participant=TL001

## 현재 저장 방식
- 브라우저 localStorage
- 별도 서버/DB 없음

## 배포형 확장 설계 문서
- service-design/deployment-architecture.md
- service-design/api-spec.yaml
- service-design/schema.sql
- service-design/gpt-summary-integration.md
- service-design/backend-structure.md
- service-design/example-json/

## 스타터 백엔드 뼈대
- ../service-starter/backend/
- ../service-starter/backend/examples/

## 확장 포인트
1. localStorage 대신 API/DB로 저장 전환
2. GPT 요약 API 연결
3. 개인별 PDF 리포트 생성
4. 관리자 로그인 및 권한 분리
5. 이메일/문자 링크 발송 자동화
