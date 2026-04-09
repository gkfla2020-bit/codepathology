from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.heartbeat import HeartbeatEvent
from app.models.diagnosis import Diagnosis
from app.models.submission import Submission
from app.models.risk_score import RiskScore
from app.models.user import User


async def calculate_risk(db: AsyncSession, student_id: int, course_id: int) -> dict:
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    three_days = now - timedelta(days=3)

    # 1. Danger ratio (7 days)
    hb_total = await db.execute(
        select(func.count(HeartbeatEvent.id)).where(
            HeartbeatEvent.student_id == student_id,
            HeartbeatEvent.recorded_at >= week_ago,
        )
    )
    hb_danger = await db.execute(
        select(func.count(HeartbeatEvent.id)).where(
            HeartbeatEvent.student_id == student_id,
            HeartbeatEvent.status == "danger",
            HeartbeatEvent.recorded_at >= week_ago,
        )
    )
    total_hb = hb_total.scalar() or 1
    danger_count = hb_danger.scalar() or 0
    danger_ratio = danger_count / max(total_hb, 1)

    # 2. Error frequency
    error_count = await db.execute(
        select(func.count(HeartbeatEvent.id)).where(
            HeartbeatEvent.student_id == student_id,
            HeartbeatEvent.event_type == "error",
            HeartbeatEvent.recorded_at >= week_ago,
        )
    )
    errors = error_count.scalar() or 0
    error_score = min(errors / 20, 1.0)

    # 3. Submission interval
    subs = await db.execute(
        select(Submission.submitted_at)
        .where(Submission.student_id == student_id, Submission.course_id == course_id)
        .order_by(Submission.submitted_at.desc())
        .limit(5)
    )
    sub_times = [s[0] for s in subs.all()]
    if len(sub_times) >= 2:
        intervals = [(sub_times[i] - sub_times[i + 1]).total_seconds() for i in range(len(sub_times) - 1)]
        avg_interval = sum(intervals) / len(intervals)
        interval_score = min(avg_interval / (86400 * 3), 1.0)  # 3 days = 1.0
    else:
        interval_score = 0.5

    # 4. Recurring pathologies
    recurring = await db.execute(
        select(func.count(Diagnosis.id)).where(
            Diagnosis.student_id == student_id,
            Diagnosis.is_recurring == True,
        )
    )
    recurring_count = recurring.scalar() or 0
    recurring_score = min(recurring_count / 5, 1.0)

    # 5. Critical diagnoses
    critical = await db.execute(
        select(func.count(Diagnosis.id)).where(
            Diagnosis.student_id == student_id,
            Diagnosis.severity == "critical",
        )
    )
    critical_count = critical.scalar() or 0
    critical_score = min(critical_count / 3, 1.0)

    # 6. Recent activity (3 days)
    recent_hb = await db.execute(
        select(func.count(HeartbeatEvent.id)).where(
            HeartbeatEvent.student_id == student_id,
            HeartbeatEvent.recorded_at >= three_days,
        )
    )
    recent = recent_hb.scalar() or 0
    inactivity_score = max(1.0 - (recent / 50), 0.0)

    # Weighted average
    factors = {
        "danger_ratio": round(danger_ratio, 3),
        "error_frequency": round(error_score, 3),
        "submission_interval": round(interval_score, 3),
        "recurring_pathologies": round(recurring_score, 3),
        "critical_diagnoses": round(critical_score, 3),
        "recent_inactivity": round(inactivity_score, 3),
    }
    weights = [0.25, 0.15, 0.15, 0.2, 0.15, 0.1]
    values = list(factors.values())
    score = sum(w * v for w, v in zip(weights, values))
    score = round(min(max(score, 0.0), 1.0), 3)

    return {"score": score, "factors": factors}


async def batch_calculate(db: AsyncSession, course_id: int) -> list[dict]:
    students_result = await db.execute(
        select(User).where(User.course_id == course_id, User.role == "student")
    )
    students = students_result.scalars().all()
    results = []
    for s in students:
        risk = await calculate_risk(db, s.id, course_id)
        # Save to DB
        rs = RiskScore(
            student_id=s.id,
            course_id=course_id,
            score=risk["score"],
            factors=risk["factors"],
        )
        db.add(rs)
        results.append({
            "student_id": s.id,
            "student_name": s.name,
            "score": risk["score"],
            "factors": risk["factors"],
        })
    await db.commit()
    return sorted(results, key=lambda x: x["score"], reverse=True)
