"""DynamoDB wrapper for all data operations."""
from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Dict, Any

import boto3
from boto3.dynamodb.conditions import Key, Attr

REGION = os.environ.get("AWS_REGION", "ap-northeast-2")
dynamodb = boto3.resource("dynamodb", region_name=REGION)

# Tables
users_table = dynamodb.Table(os.environ.get("USERS_TABLE", "codepath-users"))
courses_table = dynamodb.Table(os.environ.get("COURSES_TABLE", "codepath-courses"))
submissions_table = dynamodb.Table(os.environ.get("SUBMISSIONS_TABLE", "codepath-submissions"))
diagnoses_table = dynamodb.Table(os.environ.get("DIAGNOSES_TABLE", "codepath-diagnoses"))
heartbeat_table = dynamodb.Table(os.environ.get("HEARTBEAT_TABLE", "codepath-heartbeat"))
risk_table = dynamodb.Table(os.environ.get("RISK_TABLE", "codepath-risk-scores"))

_id_counter_table = dynamodb.Table(os.environ.get("USERS_TABLE", "codepath-users"))


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _next_id(table_name: str) -> int:
    """Simple auto-increment using timestamp + random bits."""
    return int(time.time() * 1000) % 2_000_000_000


def _clean_decimals(obj):
    """Convert Decimal types from DynamoDB to int/float for JSON."""
    if isinstance(obj, list):
        return [_clean_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: _clean_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    return obj


# ─── Users ───

def create_user(email: str, name: str, password_hash: str, role: str, course_id: Optional[int] = None) -> dict:
    user_id = _next_id("users")
    item = {
        "email": email,
        "userId": user_id,
        "name": name,
        "password_hash": password_hash,
        "role": role,
        "created_at": _now_iso(),
    }
    if course_id is not None:
        item["course_id"] = course_id
    users_table.put_item(Item=item)
    return _clean_decimals(item)


def get_user_by_email(email: str) -> Optional[dict]:
    resp = users_table.get_item(Key={"email": email})
    item = resp.get("Item")
    return _clean_decimals(item) if item else None


def get_user_by_id(user_id: int) -> Optional[dict]:
    resp = users_table.query(
        IndexName="userId-index",
        KeyConditionExpression=Key("userId").eq(user_id),
    )
    items = resp.get("Items", [])
    return _clean_decimals(items[0]) if items else None


def update_user(email: str, updates: dict) -> None:
    expr_parts = []
    values = {}
    names = {}
    for k, v in updates.items():
        safe_key = f"#{k}"
        val_key = f":{k}"
        expr_parts.append(f"{safe_key} = {val_key}")
        values[val_key] = v
        names[safe_key] = k
    users_table.update_item(
        Key={"email": email},
        UpdateExpression="SET " + ", ".join(expr_parts),
        ExpressionAttributeValues=values,
        ExpressionAttributeNames=names,
    )


def get_students_by_course(course_id: int) -> List[dict]:
    resp = users_table.scan(
        FilterExpression=Attr("course_id").eq(course_id) & Attr("role").eq("student"),
    )
    return _clean_decimals(resp.get("Items", []))


# ─── Courses ───

def create_course(name: str, language: str, instructor_id: int) -> dict:
    course_id = _next_id("courses")
    item = {
        "courseId": course_id,
        "name": name,
        "language": language,
        "instructorId": instructor_id,
        "created_at": _now_iso(),
    }
    courses_table.put_item(Item=item)
    return _clean_decimals(item)


def get_course(course_id: int) -> Optional[dict]:
    resp = courses_table.get_item(Key={"courseId": course_id})
    item = resp.get("Item")
    return _clean_decimals(item) if item else None


# ─── Submissions ───

def create_submission(student_id: int, course_id: int, code: str, language: str,
                      file_name: Optional[str] = None, ast_json: Optional[dict] = None) -> dict:
    now = _now_iso()
    item = {
        "studentId": student_id,
        "submittedAt": now,
        "submissionId": _next_id("submissions"),
        "courseId": course_id,
        "code": code,
        "language": language,
    }
    if file_name:
        item["fileName"] = file_name
    if ast_json:
        item["astJson"] = ast_json
    submissions_table.put_item(Item=item)
    return _clean_decimals(item)


def get_submissions_by_student(student_id: int, limit: int = 20) -> List[dict]:
    resp = submissions_table.query(
        KeyConditionExpression=Key("studentId").eq(student_id),
        ScanIndexForward=False,
        Limit=limit,
    )
    return _clean_decimals(resp.get("Items", []))


# ─── Diagnoses ───

def create_diagnosis(student_id: int, submission_id: int, diagnosis_data: dict) -> dict:
    now = _now_iso()
    item = {
        "studentId": student_id,
        "diagnosedAt": now,
        "diagnosisId": _next_id("diagnoses"),
        "submissionId": submission_id,
        **diagnosis_data,
    }
    diagnoses_table.put_item(Item=item)
    return _clean_decimals(item)


def get_diagnoses_by_student(student_id: int, limit: int = 50) -> List[dict]:
    resp = diagnoses_table.query(
        KeyConditionExpression=Key("studentId").eq(student_id),
        ScanIndexForward=False,
        Limit=limit,
    )
    return _clean_decimals(resp.get("Items", []))


def get_diagnoses_by_course(course_id: int) -> List[dict]:
    resp = diagnoses_table.scan(
        FilterExpression=Attr("courseId").exists(),
    )
    # Filter by courseId from submissions
    return _clean_decimals(resp.get("Items", []))


def count_pathology(student_id: int, pathology_code: str) -> int:
    resp = diagnoses_table.query(
        KeyConditionExpression=Key("studentId").eq(student_id),
        FilterExpression=Attr("pathology_code").eq(pathology_code),
    )
    return len(resp.get("Items", []))


# ─── Heartbeat ───

def save_heartbeat(student_id: int, course_id: int, event_type: str, data: dict, status: str) -> None:
    heartbeat_table.put_item(Item={
        "studentId": student_id,
        "timestamp": _now_iso(),
        "courseId": course_id,
        "event": event_type,
        "data": str(data),
        "status": status,
    })


def get_recent_heartbeats(student_id: int, limit: int = 20) -> List[dict]:
    resp = heartbeat_table.query(
        KeyConditionExpression=Key("studentId").eq(student_id),
        ScanIndexForward=False,
        Limit=limit,
    )
    return _clean_decimals(resp.get("Items", []))


# ─── Risk Scores ───

def save_risk_score(student_id: int, course_id: int, score: float, factors: dict) -> None:
    safe_factors = {k: Decimal(str(v)) if isinstance(v, float) else v for k, v in factors.items()}
    risk_table.put_item(Item={
        "studentId": student_id,
        "courseId": course_id,
        "score": Decimal(str(round(score, 3))),
        "factors": safe_factors,
        "calculatedAt": _now_iso(),
    })


def get_risk_score(student_id: int) -> Optional[dict]:
    resp = risk_table.get_item(Key={"studentId": student_id})
    item = resp.get("Item")
    return _clean_decimals(item) if item else None


def get_course_risks(course_id: int) -> List[dict]:
    resp = risk_table.scan(
        FilterExpression=Attr("courseId").eq(course_id),
    )
    items = _clean_decimals(resp.get("Items", []))
    return sorted(items, key=lambda x: x.get("score", 0), reverse=True)
