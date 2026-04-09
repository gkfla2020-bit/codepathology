import json
import logging

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """코딩 교육 튜터. 절대 답을 직접 주지 마세요. 소크라테스식 질문으로 유도.
Level 1: 넓은 방향 ("어떤 부분을 다시 확인해볼까요?")
Level 2: 개념 상기 ("배열 인덱스는 몇부터 시작하죠?")
Level 3: 유사 예시 (더 간단한 예시 보여주고 비교)
Level 4: 부분 코드 (핵심만 빈칸으로)
이번 주 배운 범위 안에서만. 한국어 2~3문장.

JSON으로 반환:
{"message": "힌트 메시지", "hint_level": 1, "related_line": 5}"""


async def generate_hint(
    code: str,
    error_msg: str,
    language: str,
    hint_level: int = 1,
    student_context: str = "",
) -> dict:
    user_msg = f"""코드:
```{language}
{code}
```
에러: {error_msg}
힌트 레벨: {hint_level}
학생 상태: {student_context}"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.5,
            response_format={"type": "json_object"},
            timeout=15,
        )
        result = json.loads(response.choices[0].message.content)
        return {
            "message": result.get("message", "다시 한번 코드를 살펴보세요."),
            "hint_level": result.get("hint_level", hint_level),
            "related_line": result.get("related_line"),
        }
    except Exception as e:
        logger.warning(f"Hint generation failed: {e}")
        return {
            "message": "코드를 천천히 한 줄씩 따라가 보세요.",
            "hint_level": hint_level,
            "related_line": None,
        }


def should_auto_hint(stall_sec: int, error_count: int) -> tuple[bool, int]:
    if stall_sec >= 900:  # 15min
        return True, 3
    if stall_sec >= 600 and error_count >= 3:  # 10min + 3 errors
        return True, 2
    if stall_sec >= 300 and error_count >= 2:  # 5min + 2 errors
        return True, 1
    return False, 0
