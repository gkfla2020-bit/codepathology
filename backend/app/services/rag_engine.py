from __future__ import annotations

import logging
import os

from app.config import settings

logger = logging.getLogger(__name__)

try:
    from langchain_openai import OpenAIEmbeddings
    from langchain_community.vectorstores import FAISS
    from langchain.schema import Document
    _HAS_LANGCHAIN = True
except ImportError:
    _HAS_LANGCHAIN = False

FAISS_DIR = "/tmp/faiss_indices"
os.makedirs(FAISS_DIR, exist_ok=True)

_stores: dict = {}

SAMPLE_CURRICULUM = [
    {"week_number": 1, "title": "변수·자료형·연산자", "content": "Java 기본 자료형(int, double, char, boolean), 변수 선언과 초기화, 산술/비교/논리 연산자, 형변환(casting), 상수(final). 주의사항: 정수 나눗셈, overflow."},
    {"week_number": 2, "title": "조건문 (if/switch)", "content": "if-else, else if 체이닝, switch-case, 삼항 연산자. 중첩 조건문, 논리 연산자 조합. 주의사항: == vs equals(), fall-through."},
    {"week_number": 3, "title": "반복문 + 배열", "content": "for, while, do-while, enhanced for. 배열 선언/초기화/순회. 다차원 배열. 주의사항: off-by-one, ArrayIndexOutOfBoundsException, 무한루프."},
    {"week_number": 4, "title": "메서드 + 클래스 기초", "content": "메서드 정의, 매개변수, 반환값, 오버로딩. 클래스, 객체, 생성자, this, 접근제어자. 주의사항: NullPointerException, 변수 스코프."},
    {"week_number": 5, "title": "상속·다형성·인터페이스", "content": "extends, super, 메서드 오버라이딩, 다형성, 추상 클래스, 인터페이스(implements). 주의사항: 다운캐스팅, instanceof."},
    {"week_number": 6, "title": "예외처리 + 컬렉션", "content": "try-catch-finally, throws, 사용자 정의 예외. ArrayList, HashMap, Iterator. 주의사항: checked vs unchecked exception, ConcurrentModificationException."},
]


async def index_curriculum(course_id: int, documents: list) -> None:
    if not _HAS_LANGCHAIN:
        logger.warning("LangChain not available, skipping curriculum indexing")
        return
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=settings.OPENAI_API_KEY)
    docs = [
        Document(
            page_content=f"[{d['week_number']}주차] {d['title']}\n{d['content']}",
            metadata={"week_number": d["week_number"], "title": d["title"]},
        )
        for d in documents
    ]
    store = FAISS.from_documents(docs, embeddings)
    _stores[course_id] = store
    path = os.path.join(FAISS_DIR, f"course_{course_id}")
    store.save_local(path)
    logger.info(f"Indexed {len(docs)} documents for course {course_id}")


async def get_curriculum_context(course_id: int, code: str, error_msg: str = "") -> str:
    if not _HAS_LANGCHAIN:
        return ""
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=settings.OPENAI_API_KEY)
    store = _stores.get(course_id)
    if not store:
        path = os.path.join(FAISS_DIR, f"course_{course_id}")
        if os.path.exists(path):
            store = FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)
            _stores[course_id] = store
        else:
            return ""

    query = f"코드: {code[:500]}\n에러: {error_msg}"
    results = store.similarity_search(query, k=3)
    return "\n---\n".join(doc.page_content for doc in results)
