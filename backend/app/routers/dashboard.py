from __future__ import annotations

from typing import Optional, List
from fastapi import APIRouter, Depends

from app.services.auth import get_current_user
from app.services.rag_engine import index_curriculum, SAMPLE_CURRICULUM
from app.db.dynamo import (
    get_students_by_course, get_user_by_id,
    get_diagnoses_by_student, get_risk_score, get_course_risks,
    save_risk_score,
)

router = APIRouter()


@router.get("/course/{course_id}/overview")
async def course_overview(
    course_id: int,
    _=Depends(get_current_user),
):
    students = get_students_by_course(course_id)
    return {
        "course_id": course_id,
        "student_count": len(students),
        "students": [{"id": s["userId"], "name": s["name"], "email": s["email"]} for s in students],
    }


@router.get("/student/{student_id}/card")
async def student_card(
    student_id: int,
    _=Depends(get_current_user),
):
    user = get_user_by_id(student_id)
    diagnoses = get_diagnoses_by_student(student_id)
    risk = get_risk_score(student_id)

    return {
        "student": {"id": user["userId"], "name": user["name"], "email": user["email"]} if user else None,
        "diagnoses": diagnoses,
        "risk_score": risk.get("score", 0.0) if risk else 0.0,
        "risk_factors": risk.get("factors", {}) if risk else {},
    }


@router.get("/risk/course/{course_id}")
async def course_risk(
    course_id: int,
    _=Depends(get_current_user),
):
    risks = get_course_risks(course_id)
    result = []
    for r in risks:
        user = get_user_by_id(r["studentId"])
        result.append({
            "student_id": r["studentId"],
            "student_name": user["name"] if user else f"Student {r['studentId']}",
            "score": r.get("score", 0),
            "factors": r.get("factors", {}),
        })
    return result


@router.post("/courses/{course_id}/curriculum")
async def upload_curriculum(
    course_id: int,
    documents: Optional[List[dict]] = None,
    _=Depends(get_current_user),
):
    docs = documents or SAMPLE_CURRICULUM
    await index_curriculum(course_id, docs)
    return {"status": "indexed", "count": len(docs)}
