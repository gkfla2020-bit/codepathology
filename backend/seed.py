"""Seed script for DynamoDB: python3 seed.py"""
import time
from app.services.auth import hash_password
from app.db.dynamo import (
    create_user, create_course, create_submission, create_diagnosis,
    save_heartbeat, save_risk_score, update_user,
)

SAMPLE_SUBMISSIONS = {
    "student1": [
        {"code": 'public class Main {\n    public static void main(String[] args) {\n        int[] arr = {1, 2, 3, 4, 5};\n        for (int i = 0; i <= arr.length; i++) {\n            System.out.println(arr[i]);\n        }\n    }\n}',
         "diag": {"pathology_name": "경계값 사고 미형성", "pathology_code": "BOUNDARY_THINKING_DEFICIT", "category": "반복문·배열", "severity": "high",
                  "symptom": "4번째 줄: i <= arr.length 사용으로 ArrayIndexOutOfBoundsException", "root_cause": "배열 인덱스가 0부터 시작하여 length-1까지라는 경계값 개념 미내재화",
                  "prescription": "1) 길이 3 배열 유효 인덱스 나열 2) <= vs < 비교 3) 경계값 테스트"}},
        {"code": 'public class Main {\n    public static void main(String[] args) {\n        String text = "Hello";\n        for (int i = 0; i <= text.length(); i++) {\n            System.out.println(text.charAt(i));\n        }\n    }\n}',
         "diag": {"pathology_name": "경계값 사고 미형성", "pathology_code": "BOUNDARY_THINKING_DEFICIT", "category": "반복문·배열", "severity": "high",
                  "symptom": "4번째 줄: i <= text.length()에서 StringIndexOutOfBoundsException", "root_cause": "배열과 문자열 동일 경계값 패턴 일반화 실패",
                  "prescription": "1) length()와 마지막 인덱스 관계 정리 2) 다양한 컬렉션 경계값 패턴"}},
        {"code": 'public class Main {\n    public static void main(String[] args) {\n        int[] arr = {10, 20, 30};\n        for (int i = 0; i < arr.length; i++) {\n            System.out.println(arr[i]);\n        }\n    }\n}',
         "diag": {"pathology_name": "정상", "pathology_code": "NORMAL", "category": "none", "severity": "none",
                  "symptom": "없음", "root_cause": "없음", "prescription": "없음"}},
    ],
    "student2": [
        {"code": 'public class Main {\n    public static void main(String[] args) {\n        String name = null;\n        System.out.println(name.length());\n    }\n}',
         "diag": {"pathology_name": "Null 체크 회피증", "pathology_code": "NULL_CHECK_AVOIDANCE", "category": "예외처리", "severity": "high",
                  "symptom": "4번째 줄: null인 name에 .length() 호출", "root_cause": "null 상태 사전 확인 방어적 사고 부족",
                  "prescription": "1) null 상황 5가지 나열 2) if (x != null) 패턴 연습 3) Optional 학습"}},
    ],
    "student3": [
        {"code": 'public class Calculator {\n    public int add(int a, int b) { return a + b; }\n    public int multiply(int a, int b) { return a * b; }\n    public static void main(String[] args) {\n        Calculator calc = new Calculator();\n        System.out.println(calc.add(3, 5));\n    }\n}',
         "diag": {"pathology_name": "정상", "pathology_code": "NORMAL", "category": "none", "severity": "none",
                  "symptom": "없음", "root_cause": "없음", "prescription": "없음"}},
    ],
    "student4": [
        {"code": 'public class Main {\n    public static void main(String[] args) {\n        int count = 0;\n        while (true) {\n            count++;\n            System.out.println(count);\n        }\n    }\n}',
         "diag": {"pathology_name": "무한루프 미인식", "pathology_code": "INFINITE_LOOP_BLINDNESS", "category": "반복문", "severity": "critical",
                  "symptom": "4번째 줄: while(true)에 break 없음", "root_cause": "반복 종료 조건 설계 선행 인식 부족",
                  "prescription": "1) 종료 조건부터 먼저 정하기 2) while(true) 대신 조건식 사용 변환"}},
        {"code": 'public class Main {\n    public static void main(String[] args) {\n        for (int i = 0; i < 5; i++) {\n            int temp = i * 2;\n        }\n        System.out.println(temp);\n    }\n}',
         "diag": {"pathology_name": "변수 스코프 혼동", "pathology_code": "SCOPE_CONFUSION", "category": "변수·자료형", "severity": "medium",
                  "symptom": "6번째 줄: for 블록 안 temp를 밖에서 접근", "root_cause": "블록 스코프 개념 미형성",
                  "prescription": "1) 중괄호와 변수 생존 범위 시각화 2) 같은 이름 변수 다른 스코프 실험"}},
    ],
    "student5": [
        {"code": 'public class Main {\n    public static void main(String[] args) {\n        int a = 10;\n        int b = 0;\n        int result = a / b;\n        System.out.println(result);\n    }\n}',
         "diag": {"pathology_name": "예외처리 회피증", "pathology_code": "EXCEPTION_AVOIDANCE", "category": "예외처리", "severity": "high",
                  "symptom": "5번째 줄: 0으로 나누기 예외처리 없음", "root_cause": "예외 상황 예측·방어 사고 패턴 부족",
                  "prescription": "1) ArithmeticException 상황 정리 2) try-catch 방어 3) if 사전 검증"}},
    ],
}

RISK_SCORES = {"student1": 0.82, "student2": 0.45, "student3": 0.08, "student4": 0.65, "student5": 0.30}
HB_STATUS = {"student1": "danger", "student2": "stalled", "student3": "normal", "student4": "stalled", "student5": "normal"}


def seed():
    # Instructor
    instructor = create_user("instructor@test.com", "Kim Instructor", hash_password("password123"), "instructor")
    print(f"  Instructor: instructor@test.com (id={instructor['userId']})")

    # Course
    course = create_course("Java Fullstack 3-Ban", "java", instructor["userId"])
    course_id = course["courseId"]
    update_user("instructor@test.com", {"course_id": course_id})
    print(f"  Course: {course['name']} (id={course_id})")

    # Students
    students = {}
    for i in range(1, 6):
        key = f"student{i}"
        user = create_user(f"{key}@test.com", f"Student {i}", hash_password("password123"), "student", course_id)
        students[key] = user
        time.sleep(0.01)  # avoid ID collision
    print(f"  Students: student1~5@test.com")

    # Submissions + Diagnoses
    for key, subs in SAMPLE_SUBMISSIONS.items():
        user = students[key]
        for j, sub in enumerate(subs):
            submission = create_submission(user["userId"], course_id, sub["code"], "java")
            time.sleep(0.01)
            d = sub["diag"]
            is_rec = j > 0 and d["pathology_code"] == subs[0]["diag"]["pathology_code"] and d["pathology_code"] != "NORMAL"
            create_diagnosis(user["userId"], submission["submissionId"], {
                "courseId": course_id,
                "pathology_name": d["pathology_name"],
                "pathology_code": d["pathology_code"],
                "category": d["category"],
                "severity": d["severity"],
                "symptom": d["symptom"],
                "root_cause": d["root_cause"],
                "prescription": d["prescription"],
                "is_recurring": is_rec,
                "recurrence_count": j + 1 if is_rec else 1,
                "code_snippet": sub["code"][:300],
            })
            time.sleep(0.01)

    # Heartbeat + Risk
    for key, status in HB_STATUS.items():
        user = students[key]
        for k in range(3):
            save_heartbeat(user["userId"], course_id, "typing" if status == "normal" else "pause",
                           {"chars_per_min": 40} if status == "normal" else {"duration_sec": 600}, status)
            time.sleep(0.01)

    for key, score in RISK_SCORES.items():
        user = students[key]
        save_risk_score(user["userId"], course_id, score, {
            "danger_ratio": round(score * 0.3, 3),
            "error_frequency": round(score * 0.2, 3),
            "submission_interval": round(score * 0.15, 3),
            "recurring_pathologies": round(score * 0.2, 3),
        })

    print("Seed complete!")


if __name__ == "__main__":
    seed()
