from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.services.auth import get_current_user
from app.db.dynamo import get_diagnoses_by_student, get_students_by_course, get_risk_score

router = APIRouter()


@router.get("/student/{student_id}")
async def get_student_diagnoses(
    student_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _=Depends(get_current_user),
):
    all_diags = get_diagnoses_by_student(student_id, limit=200)
    offset = (page - 1) * size
    items = all_diags[offset:offset + size]
    return {"items": items, "total": len(all_diags), "page": page, "size": size}


@router.get("/student/{student_id}/detail")
async def get_student_detail_analysis(
    student_id: int,
    _=Depends(get_current_user),
):
    """학생별 세부 분석: 반복병리, 심각도 분포, 카테고리별, 코드 스니펫 포함"""
    all_diags = get_diagnoses_by_student(student_id, limit=200)

    # 심각도 분포
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "none": 0}
    # 카테고리 분포
    category_counts: dict = {}
    # 병리코드별 반복 추적
    pathology_history: dict = {}
    # 타임라인 (날짜별 진단 수)
    timeline: dict = {}
    # 코드 스니펫 목록
    code_snippets = []

    for d in all_diags:
        sev = d.get("severity", "none")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

        cat = d.get("category", "unknown")
        if sev != "none":
            category_counts[cat] = category_counts.get(cat, 0) + 1

        pcode = d.get("pathology_code", "UNKNOWN")
        if pcode != "NORMAL":
            if pcode not in pathology_history:
                pathology_history[pcode] = {
                    "code": pcode,
                    "name": d.get("pathology_name", pcode),
                    "category": cat,
                    "occurrences": [],
                }
            pathology_history[pcode]["occurrences"].append({
                "diagnosed_at": d.get("diagnosedAt", ""),
                "severity": sev,
                "symptom": d.get("symptom", ""),
                "code_snippet": d.get("code_snippet", "")[:200],
            })

        date_str = (d.get("diagnosedAt") or "")[:10]
        if date_str:
            if date_str not in timeline:
                timeline[date_str] = {"date": date_str, "total": 0, "issues": 0}
            timeline[date_str]["total"] += 1
            if sev != "none":
                timeline[date_str]["issues"] += 1

        snippet = d.get("code_snippet", "")
        if snippet and sev != "none":
            code_snippets.append({
                "pathology_name": d.get("pathology_name", ""),
                "pathology_code": pcode,
                "severity": sev,
                "symptom": d.get("symptom", ""),
                "code_snippet": snippet[:300],
                "diagnosed_at": d.get("diagnosedAt", ""),
            })

    # 반복 병리 (2회 이상)
    recurring = [
        {**v, "count": len(v["occurrences"])}
        for v in pathology_history.values()
        if len(v["occurrences"]) >= 2
    ]
    recurring.sort(key=lambda x: x["count"], reverse=True)

    # 가장 많은 병리 Top5
    all_pathologies = [
        {"code": v["code"], "name": v["name"], "category": v["category"], "count": len(v["occurrences"])}
        for v in pathology_history.values()
    ]
    all_pathologies.sort(key=lambda x: x["count"], reverse=True)

    total_issues = sum(v for k, v in severity_counts.items() if k != "none")

    return {
        "total_diagnoses": len(all_diags),
        "total_issues": total_issues,
        "severity_distribution": severity_counts,
        "category_distribution": category_counts,
        "top_pathologies": all_pathologies[:10],
        "recurring_pathologies": recurring,
        "timeline": sorted(timeline.values(), key=lambda x: x["date"]),
        "code_snippets": code_snippets[:20],
    }


@router.get("/course/{course_id}/heatmap")
async def get_course_heatmap(
    course_id: int,
    _=Depends(get_current_user),
):
    students = get_students_by_course(course_id)
    pathology_counts: dict = {}

    for student in students:
        diags = get_diagnoses_by_student(student["userId"])
        for d in diags:
            if d.get("severity") == "none":
                continue
            code = d.get("pathology_code", "UNKNOWN")
            name = d.get("pathology_name", code)
            if code not in pathology_counts:
                pathology_counts[code] = {
                    "pathology_code": code,
                    "name": name,
                    "category": d.get("category", ""),
                    "count": 0,
                    "affected_students": set(),
                    "severity_breakdown": {"critical": 0, "high": 0, "medium": 0, "low": 0},
                }
            pathology_counts[code]["count"] += 1
            pathology_counts[code]["affected_students"].add(student["userId"])
            sev = d.get("severity", "low")
            if sev in pathology_counts[code]["severity_breakdown"]:
                pathology_counts[code]["severity_breakdown"][sev] += 1

    items = sorted(pathology_counts.values(), key=lambda x: x["count"], reverse=True)
    total = sum(i["count"] for i in items) or 1
    for i in items:
        i["percentage"] = round(i["count"] / total * 100, 1)
        i["affected_count"] = len(i["affected_students"])
        del i["affected_students"]
    return items


@router.get("/course/{course_id}/epidemiology")
async def get_epidemiology(
    course_id: int,
    _=Depends(get_current_user),
):
    students = get_students_by_course(course_id)
    pathology_counts = {}

    for student in students:
        diags = get_diagnoses_by_student(student["userId"])
        for d in diags:
            if d.get("severity") == "none":
                continue
            code = d.get("pathology_code", "UNKNOWN")
            if code not in pathology_counts:
                pathology_counts[code] = {
                    "code": code,
                    "name": d.get("pathology_name", code),
                    "category": d.get("category", ""),
                    "count": 0,
                }
            pathology_counts[code]["count"] += 1

    top = sorted(pathology_counts.values(), key=lambda x: x["count"], reverse=True)[:5]
    return {
        "top_pathologies": top,
        "recommendation": f"다음 수업에서 '{top[0]['name']}' 관련 내용을 한 번 더 짚어주시면 좋을 것 같아요" if top else "특별히 짚을 패턴이 없어요. 잘 진행되고 있어요!",
    }


@router.get("/course/{course_id}/comparative")
async def get_comparative_analysis(
    course_id: int,
    _=Depends(get_current_user),
):
    """반 전체 학생 비교 분석: 학생별 병리 수, 심각도, 반복률"""
    students = get_students_by_course(course_id)
    result = []

    for student in students:
        diags = get_diagnoses_by_student(student["userId"], limit=200)
        risk = get_risk_score(student["userId"])

        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        category_counts: dict = {}
        pathology_codes: dict = {}

        for d in diags:
            sev = d.get("severity", "none")
            if sev != "none":
                severity_counts[sev] = severity_counts.get(sev, 0) + 1
                cat = d.get("category", "")
                category_counts[cat] = category_counts.get(cat, 0) + 1
                pcode = d.get("pathology_code", "")
                pathology_codes[pcode] = pathology_codes.get(pcode, 0) + 1

        total_issues = sum(severity_counts.values())
        recurring_count = sum(1 for v in pathology_codes.values() if v >= 2)

        result.append({
            "student_id": student["userId"],
            "student_name": student["name"],
            "email": student["email"],
            "total_diagnoses": len(diags),
            "total_issues": total_issues,
            "severity_distribution": severity_counts,
            "category_distribution": category_counts,
            "recurring_count": recurring_count,
            "unique_pathologies": len(pathology_codes),
            "risk_score": risk.get("score", 0) if risk else 0,
            "top_pathology": max(pathology_codes.items(), key=lambda x: x[1])[0] if pathology_codes else "없음",
        })

    result.sort(key=lambda x: x["total_issues"], reverse=True)
    return result


@router.get("/course/{course_id}/pathology/{pathology_code}")
async def get_pathology_detail(
    course_id: int,
    pathology_code: str,
    _=Depends(get_current_user),
):
    """특정 패턴 상세: 해당 패턴이 보인 학생들, 코드 예시, 심각도 분포, 시간별 추이"""
    students = get_students_by_course(course_id)
    affected_students = []
    code_examples = []
    severity_dist = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    timeline_map: dict = {}  # YYYY-MM-DD -> count

    pathology_name = ""
    root_cause = ""
    prescription = ""
    category = ""

    for student in students:
        diags = get_diagnoses_by_student(student["userId"], limit=200)
        student_occurrences = []
        student_severities = []
        for d in diags:
            if d.get("pathology_code") == pathology_code:
                student_occurrences.append(d)
                sev = d.get("severity", "low")
                student_severities.append(sev)
                severity_dist[sev] = severity_dist.get(sev, 0) + 1

                # Capture pattern metadata from the first matching diagnosis
                if not pathology_name:
                    pathology_name = d.get("pathology_name", pathology_code)
                    root_cause = d.get("root_cause", "")
                    prescription = d.get("prescription", "")
                    category = d.get("category", "")

                # Timeline aggregation
                diagnosed_at = d.get("diagnosedAt", "")
                if diagnosed_at:
                    day = diagnosed_at[:10]
                    timeline_map[day] = timeline_map.get(day, 0) + 1

                snippet = d.get("code_snippet", "")
                if snippet:
                    code_examples.append({
                        "student_id": student["userId"],
                        "student_name": student["name"],
                        "code": snippet[:400],
                        "symptom": d.get("symptom", ""),
                        "severity": sev,
                        "diagnosed_at": diagnosed_at,
                    })

        if student_occurrences:
            # diagnosedAt is typically ISO; list[0] is latest, list[-1] is oldest
            dates = [d.get("diagnosedAt", "") for d in student_occurrences if d.get("diagnosedAt")]
            first_seen = min(dates) if dates else ""
            last_seen = max(dates) if dates else ""
            affected_students.append({
                "student_id": student["userId"],
                "student_name": student["name"],
                "occurrence_count": len(student_occurrences),
                "severities": student_severities,
                "first_seen": first_seen,
                "last_seen": last_seen,
            })

    # Sort affected students by occurrence count desc
    affected_students.sort(key=lambda s: s["occurrence_count"], reverse=True)

    # Timeline sorted by date
    timeline = [
        {"date": day, "count": count}
        for day, count in sorted(timeline_map.items())
    ]

    affected_count = len(affected_students)
    total_occurrences = sum(s["occurrence_count"] for s in affected_students)
    recurring_count = sum(1 for s in affected_students if s["occurrence_count"] >= 2)
    recurrence_rate = (recurring_count / affected_count) if affected_count > 0 else 0
    avg_per_student = (total_occurrences / affected_count) if affected_count > 0 else 0

    all_dates = [d["diagnosed_at"] for d in code_examples if d.get("diagnosed_at")]
    pattern_first_seen = min(all_dates) if all_dates else ""
    pattern_last_seen = max(all_dates) if all_dates else ""

    return {
        "pathology_code": pathology_code,
        "pathology_name": pathology_name or pathology_code,
        "category": category,
        "root_cause": root_cause,
        "prescription": prescription,
        "affected_count": affected_count,
        "total_occurrences": total_occurrences,
        "recurrence_rate": round(recurrence_rate, 3),
        "avg_per_student": round(avg_per_student, 2),
        "first_seen": pattern_first_seen,
        "last_seen": pattern_last_seen,
        "severity_distribution": severity_dist,
        "timeline": timeline,
        "affected_students": affected_students,
        "code_examples": code_examples[:10],
    }
