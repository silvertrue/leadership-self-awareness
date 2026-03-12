# GPT 요약 연동 설계

## 목적
Peer 원문 코멘트를 그대로 보여주지 않고, 강점 코멘트와 성장가능성 코멘트를 각각 더 읽기 쉽고 상처받지 않는 문장으로 요약한다.

## 어디에 붙는가
1. Peer 응답이 모두 마감되거나
2. 운영자가 리포트 생성을 눌렀을 때
3. Report worker가 원문을 모아 GPT 요약 요청을 보낸다.

## 입력 데이터
- participant 기본 정보
- 자가진단 강점/성장 항목
- Peer 강점 선택 항목들
- Peer 성장가능성 선택 항목들
- Peer 강점 판단 근거 원문 목록
- Peer 성장가능성 판단 근거 원문 목록
- Peer 응원 메시지 목록

## 출력 데이터
- strength_summary_paragraphs: string[]
- growth_summary_paragraphs: string[]
- tone_check: string
- optional_keywords: string[]

## 권장 처리 단계
1. Peer 원문을 강점/성장가능성으로 분리
2. 같은 Dimension 기준으로 그룹핑
3. 반복되는 표현과 의미를 묶음
4. GPT에 순화 요약 요청
5. 금칙 표현 검사
6. 리포트 JSON에 반영

## 시스템 프롬프트 예시
당신은 리더십 피드백을 정리하는 코치입니다.
주어진 Peer 피드백 원문을 바탕으로, 당사자가 방어적으로 느끼지 않도록 표현을 순화하면서도 핵심 의미는 유지해 요약하세요.
강점 코멘트와 성장가능성 코멘트를 분리해서 작성하세요.
원문을 그대로 복사하지 말고, 유사한 의견은 통합하세요.
행동 중심, 관찰 중심, 성장 중심 언어를 사용하세요.
단정적 진단이나 낙인 표현은 제거하세요.

## 사용자 프롬프트 예시
참가자 이름: 홍길동
자가진단 강점: Leadership, 전문성
자가진단 성장과제: Learning Agility, Design 역량

강점 관련 원문:
- ...
- ...

성장가능성 관련 원문:
- ...
- ...

응원 메시지:
- ...
- ...

다음 JSON 형식으로 응답하세요.
{
  "strength_summary_paragraphs": ["...", "..."],
  "growth_summary_paragraphs": ["...", "..."],
  "tone_check": "...",
  "optional_keywords": ["...", "..."]
}

## 후처리 규칙
- 문장이 3개를 넘으면 2개만 남긴다.
- '부족하다', '문제가 있다' 같은 단정형 표현은 재작성한다.
- 특정 응답자를 추정할 수 있는 고유 사건/표현은 제거한다.
- 강점 요약은 안정감과 신뢰감이 느껴지는 문체로 정리한다.
- 성장 요약은 기대와 제안의 문체로 정리한다.

## 실패 시 fallback
LLM 호출이 실패하면 아래 규칙 기반 요약으로 대체한다.
- Top 2 Dimension 빈도 집계
- 각 Dimension에 대한 사전 정의 cue 문장 사용
- '총 n명의 동료 응답을 종합하면 ...' 형식으로 2문장 생성

## 저장 위치
- report_runs.report_json
- llm_model
- llm_prompt_version
- generated_at

## 운영 권장
- 최초 생성 시와 최종 배포 직전, 총 2회 재생성 허용
- prompt version을 반드시 저장
- 민감한 표현 검수용 관리자 재생성 버튼 제공
