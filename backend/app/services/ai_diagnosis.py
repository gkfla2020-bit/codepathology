from __future__ import annotations

import json
import logging
from typing import Optional, List

from openai import AsyncOpenAI

from app.config import settings
from app.schemas.diagnosis import DiagnosisResult

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """당신은 학생의 코드를 함께 살펴보는 친근한 "코드 코칭 AI"입니다.
"어디가 틀렸는지" 지적하기보다 "이 학생이 어떤 사고 패턴을 가지고 있는지" 알아채고, 따뜻하고 격려하는 말투로 안내해 주세요.
어려운 의학 용어나 딱딱한 표현 대신, 친구가 옆에서 코칭해주듯 자연스러운 한국어로 말해주세요.

JSON 형식으로 반환:
{
  "pathology_name": "이 코드 패턴의 이름 (한국어, 친근한 표현)",
  "pathology_code": "ENGLISH_CODE",
  "category": "관련 개념",
  "severity": "low|medium|high|critical",
  "symptom": "코드에서 보이는 현상 (줄 번호 포함, 부드러운 톤)",
  "root_cause": "왜 이런 패턴이 생겼을지 (학생을 탓하지 않는 톤)",
  "prescription": "다음에 해보면 좋을 학습 (작은 실습 2~3개 추천)",
  "meta_insight": "학생이 스스로 자기 사고를 돌아볼 수 있게 도와주는 한 마디"
}
특별히 짚을 패턴이 없다면 {"pathology_name":"잘하고 있어요","pathology_code":"NORMAL","category":"none","severity":"none","symptom":"없음","root_cause":"없음","prescription":"없음","meta_insight":"코드가 깔끔해요! 잘하고 있어요 :)"}"""


async def diagnose_code(
    code: str,
    language: str,
    ast_result: dict,
    student_history: Optional[List[dict]] = None,
    curriculum_context: str = "",
) -> DiagnosisResult:
    user_msg = f"""언어: {language}
코드:
```
{code}
```

AST 분석 결과: {json.dumps(ast_result, ensure_ascii=False, default=str)}
이전 패턴 이력: {json.dumps(student_history or [], ensure_ascii=False, default=str)}
이번 주 커리큘럼: {curriculum_context}"""

    for attempt in range(3):
        try:
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
                timeout=30,
            )
            result = json.loads(response.choices[0].message.content)
            return DiagnosisResult(**result)
        except Exception as e:
            logger.warning(f"AI diagnosis attempt {attempt + 1} failed: {e}")
            if attempt == 2:
                return DiagnosisResult(
                    pathology_name="잠시 분석에 문제가 생겼어요",
                    pathology_code="DIAGNOSIS_ERROR",
                    category="system",
                    severity="low",
                    symptom="AI 분석 서비스에 일시적인 문제가 있어요",
                    root_cause="서비스 일시 오류",
                    prescription="잠시 후 다시 제출해주세요.",
                    meta_insight="",
                )
