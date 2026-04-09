from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.submission import SubmissionCreate
from app.services.auth import get_current_user
from app.services.ast_parser import parse_code
from app.services.ai_diagnosis import diagnose_code
from app.services.rag_engine import get_curriculum_context
from app.db.dynamo import (
    create_submission, get_diagnoses_by_student, create_diagnosis,
    count_pathology, get_submissions_by_student,
)

router = APIRouter()


@router.post("")
async def create_submission_endpoint(
    body: SubmissionCreate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can submit")
    course_id = current_user.get("course_id")
    if not course_id:
        raise HTTPException(status_code=400, detail="Student not enrolled in a course")

    # 1. Parse AST
    ast_result = parse_code(body.code, body.language)

    # 2. Save submission
    submission = create_submission(
        student_id=current_user["userId"],
        course_id=course_id,
        code=body.code,
        language=body.language,
        file_name=body.file_name,
        ast_json=ast_result,
    )

    # 3. Get curriculum context
    curriculum_ctx = await get_curriculum_context(course_id, body.code)

    # 4. Get student history
    past_diags = get_diagnoses_by_student(current_user["userId"], limit=5)
    history = [
        {"pathology_code": d.get("pathology_code"), "pathology_name": d.get("pathology_name"), "severity": d.get("severity")}
        for d in past_diags
    ]

    # 5. AI diagnosis
    diagnosis_result = await diagnose_code(
        code=body.code,
        language=body.language,
        ast_result=ast_result,
        student_history=history,
        curriculum_context=curriculum_ctx,
    )

    # 6. Check recurrence & save
    existing_count = count_pathology(current_user["userId"], diagnosis_result.pathology_code)
    is_recurring = existing_count > 0

    diagnosis = create_diagnosis(
        student_id=current_user["userId"],
        submission_id=submission["submissionId"],
        diagnosis_data={
            "courseId": course_id,
            "pathology_name": diagnosis_result.pathology_name,
            "pathology_code": diagnosis_result.pathology_code,
            "category": diagnosis_result.category,
            "severity": diagnosis_result.severity,
            "symptom": diagnosis_result.symptom,
            "root_cause": diagnosis_result.root_cause,
            "prescription": diagnosis_result.prescription,
            "hint_given": diagnosis_result.meta_insight,
            "is_recurring": is_recurring,
            "recurrence_count": existing_count + 1,
            "code_snippet": body.code[:500],
        },
    )

    return {
        "submission_id": submission["submissionId"],
        "diagnosis": diagnosis,
    }


@router.get("/{submission_id}")
async def get_submission(
    submission_id: int,
    current_user: dict = Depends(get_current_user),
):
    subs = get_submissions_by_student(current_user["userId"])
    for s in subs:
        if s.get("submissionId") == submission_id:
            return s
    raise HTTPException(status_code=404, detail="Submission not found")
