// Mock data for frontend-only development

export const MOCK_USERS = {
  instructor: {
    id: 1, email: "prof@sogang.ac.kr", name: "김교수", role: "instructor", course_id: 1,
  },
  students: [
    { id: 10, email: "s1@sogang.ac.kr", name: "이민수", role: "student", course_id: 1 },
    { id: 11, email: "s2@sogang.ac.kr", name: "박지현", role: "student", course_id: 1 },
    { id: 12, email: "s3@sogang.ac.kr", name: "최영호", role: "student", course_id: 1 },
    { id: 13, email: "s4@sogang.ac.kr", name: "정수아", role: "student", course_id: 1 },
    { id: 14, email: "s5@sogang.ac.kr", name: "한도윤", role: "student", course_id: 1 },
  ],
};

const PATHOLOGIES = [
  { code: "NULL_CHECK_MISSING", name: "Null 체크 누락", category: "safety", severity: "high" },
  { code: "OFF_BY_ONE", name: "Off-by-One 오류", category: "logic", severity: "medium" },
  { code: "INFINITE_LOOP_RISK", name: "무한 루프 위험", category: "logic", severity: "critical" },
  { code: "UNUSED_VARIABLE", name: "미사용 변수", category: "style", severity: "low" },
  { code: "DEEP_NESTING", name: "과도한 중첩", category: "complexity", severity: "medium" },
  { code: "MAGIC_NUMBER", name: "매직 넘버 사용", category: "style", severity: "low" },
  { code: "EMPTY_CATCH", name: "빈 catch 블록", category: "safety", severity: "high" },
  { code: "RESOURCE_LEAK", name: "리소스 미해제", category: "safety", severity: "critical" },
];

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString();
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let diagId = 100;
function makeDiagnosis(studentId: number, daysAgo = 30) {
  const p = randomPick(PATHOLOGIES);
  const recurring = Math.random() > 0.6;
  return {
    id: diagId++,
    submission_id: diagId,
    student_id: studentId,
    pathology_name: p.name,
    pathology_code: p.code,
    category: p.category,
    severity: p.severity,
    symptom: `${p.name} 패턴이 코드에서 감지되었습니다.`,
    root_cause: `${p.category} 영역의 기본 개념 이해가 부족할 수 있습니다.`,
    prescription: `${p.name} 관련 연습 문제를 풀어보세요.`,
    hint_given: "",
    is_recurring: recurring,
    recurrence_count: recurring ? Math.floor(Math.random() * 4) + 2 : 1,
    code_snippet: `// ${p.name} 예시\nfor (int i = 0; i <= arr.length; i++) {\n  System.out.println(arr[i]);\n}`,
    diagnosed_at: randomDate(daysAgo),
  };
}

// Generate diagnoses per student
const studentDiagnoses: Record<number, ReturnType<typeof makeDiagnosis>[]> = {};
for (const s of MOCK_USERS.students) {
  const count = 5 + Math.floor(Math.random() * 10);
  studentDiagnoses[s.id] = Array.from({ length: count }, () => makeDiagnosis(s.id));
}

export function getMockStudentCard(studentId: number) {
  const student = MOCK_USERS.students.find((s) => s.id === studentId) || MOCK_USERS.students[0];
  const diagnoses = studentDiagnoses[studentId] || [];
  const riskScore = Math.random() * 0.8 + 0.1;
  return {
    student: { id: student.id, name: student.name, email: student.email },
    diagnoses,
    risk_score: riskScore,
    risk_factors: { danger_ratio: 0.2, error_freq: 0.15, recurring: 0.3 },
  };
}

export function getMockStudentDiagnoses(studentId: number, page = 1) {
  const all = studentDiagnoses[studentId] || [];
  const perPage = 10;
  const start = (page - 1) * perPage;
  return {
    items: all.slice(start, start + perPage),
    total: all.length,
    page,
    per_page: perPage,
  };
}

export function getMockStudentDetail(studentId: number) {
  const diagnoses = studentDiagnoses[studentId] || [];
  const sevDist: Record<string, number> = {};
  const catDist: Record<string, number> = {};
  const pathCount: Record<string, { code: string; name: string; category: string; count: number }> = {};

  for (const d of diagnoses) {
    sevDist[d.severity] = (sevDist[d.severity] || 0) + 1;
    catDist[d.category] = (catDist[d.category] || 0) + 1;
    if (!pathCount[d.pathology_code]) {
      pathCount[d.pathology_code] = { code: d.pathology_code, name: d.pathology_name, category: d.category, count: 0 };
    }
    pathCount[d.pathology_code].count++;
  }

  const recurring = Object.values(pathCount)
    .filter((p) => p.count >= 2)
    .map((p) => ({
      code: p.code, name: p.name, count: p.count,
      occurrences: diagnoses
        .filter((d) => d.pathology_code === p.code)
        .map((d) => ({ diagnosed_at: d.diagnosed_at, severity: d.severity, symptom: d.symptom, code_snippet: d.code_snippet })),
    }));

  const dateMap: Record<string, { total: number; issues: number }> = {};
  for (const d of diagnoses) {
    const date = d.diagnosed_at.slice(0, 10);
    if (!dateMap[date]) dateMap[date] = { total: 0, issues: 0 };
    dateMap[date].total++;
    if (d.severity !== "none") dateMap[date].issues++;
  }

  return {
    total_diagnoses: diagnoses.length,
    total_issues: diagnoses.filter((d) => d.severity !== "none").length,
    severity_distribution: sevDist,
    category_distribution: catDist,
    top_pathologies: Object.values(pathCount).sort((a, b) => b.count - a.count).slice(0, 5),
    recurring_pathologies: recurring,
    timeline: Object.entries(dateMap).sort().map(([date, v]) => ({ date, ...v })),
    code_snippets: diagnoses.filter((d) => d.code_snippet).slice(0, 10).map((d) => ({
      pathology_name: d.pathology_name, pathology_code: d.pathology_code,
      severity: d.severity, symptom: d.symptom, code_snippet: d.code_snippet, diagnosed_at: d.diagnosed_at,
    })),
  };
}

export function getMockCourseHeatmap(_courseId: number) {
  const allDiags = Object.values(studentDiagnoses).flat();
  const patternMap: Record<string, { name: string; category: string; count: number; affected: Set<number>; severities: Record<string, number> }> = {};

  for (const d of allDiags) {
    if (!patternMap[d.pathology_code]) {
      patternMap[d.pathology_code] = { name: d.pathology_name, category: d.category, count: 0, affected: new Set(), severities: {} };
    }
    patternMap[d.pathology_code].count++;
    patternMap[d.pathology_code].affected.add(d.student_id);
    patternMap[d.pathology_code].severities[d.severity] = (patternMap[d.pathology_code].severities[d.severity] || 0) + 1;
  }

  const total = allDiags.length || 1;
  return Object.entries(patternMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([code, v]) => ({
      pathology_code: code,
      name: v.name,
      category: v.category,
      count: v.count,
      percentage: Math.round((v.count / total) * 100),
      affected_count: v.affected.size,
      severity_breakdown: v.severities,
    }));
}

export function getMockEpidemiology(_courseId: number) {
  const heatmap = getMockCourseHeatmap(_courseId);
  const top5 = heatmap.slice(0, 5);
  return {
    top_pathologies: top5.map((p) => ({ code: p.pathology_code, name: p.name, category: p.category, count: p.count })),
    recommendation: `이번 주 클래스에서 "${top5[0]?.name || '패턴'}" 이슈가 가장 많이 발생했습니다. 다음 강의 초반 5분간 관련 개념을 복습하는 것을 권장합니다. 특히 ${top5.length}개 주요 패턴에 대해 실습 예제를 추가로 제공하면 효과적일 것입니다.`,
  };
}

export function getMockCourseRisk(_courseId: number) {
  return MOCK_USERS.students.map((s) => {
    const diags = studentDiagnoses[s.id] || [];
    const score = Math.min(1, diags.length * 0.05 + Math.random() * 0.3);
    return {
      student_id: s.id, student_name: s.name, score,
      factors: { danger_ratio: Math.random() * 0.4, error_freq: Math.random() * 0.3, recurring: Math.random() * 0.5 },
    };
  }).sort((a, b) => b.score - a.score);
}

export function getMockComparative(_courseId: number) {
  return MOCK_USERS.students.map((s) => {
    const diags = studentDiagnoses[s.id] || [];
    const issues = diags.filter((d) => d.severity !== "none");
    const recurring = diags.filter((d) => d.is_recurring);
    const uniquePatterns = new Set(diags.map((d) => d.pathology_code));
    const sevDist: Record<string, number> = {};
    const catDist: Record<string, number> = {};
    for (const d of issues) {
      sevDist[d.severity] = (sevDist[d.severity] || 0) + 1;
      catDist[d.category] = (catDist[d.category] || 0) + 1;
    }
    return {
      student_id: s.id, student_name: s.name, email: s.email,
      total_diagnoses: diags.length, total_issues: issues.length,
      severity_distribution: sevDist, recurring_count: recurring.length,
      unique_pathologies: uniquePatterns.size,
      category_distribution: catDist,
      risk_score: Math.min(1, issues.length * 0.06 + Math.random() * 0.2),
      top_pathology: diags[0]?.pathology_name || "-",
    };
  });
}

export function getMockPathologyDetail(_courseId: number, pathologyCode: string) {
  const allDiags = Object.values(studentDiagnoses).flat().filter((d) => d.pathology_code === pathologyCode);
  const affected = new Map<number, { name: string; count: number; severities: string[]; first: string; last: string }>();
  const sevDist: Record<string, number> = {};
  const dateMap: Record<string, number> = {};

  for (const d of allDiags) {
    const s = MOCK_USERS.students.find((st) => st.id === d.student_id);
    if (!affected.has(d.student_id)) affected.set(d.student_id, { name: s?.name || "?", count: 0, severities: [], first: d.diagnosed_at, last: d.diagnosed_at });
    const a = affected.get(d.student_id)!;
    a.count++;
    a.severities.push(d.severity);
    if (d.diagnosed_at < a.first) a.first = d.diagnosed_at;
    if (d.diagnosed_at > a.last) a.last = d.diagnosed_at;
    sevDist[d.severity] = (sevDist[d.severity] || 0) + 1;
    const date = d.diagnosed_at.slice(0, 10);
    dateMap[date] = (dateMap[date] || 0) + 1;
  }

  const recurringCount = allDiags.filter((d) => d.is_recurring).length;
  const category = allDiags[0]?.category || "";
  return {
    pathology_code: pathologyCode,
    pathology_name: allDiags[0]?.pathology_name || pathologyCode,
    category,
    root_cause: `${category} 영역의 기본 개념 이해가 부족할 수 있습니다.`,
    prescription: `${allDiags[0]?.pathology_name || pathologyCode} 관련 연습 문제를 풀어보세요.`,
    affected_count: affected.size,
    total_occurrences: allDiags.length,
    recurrence_rate: allDiags.length > 0 ? recurringCount / allDiags.length : 0,
    avg_per_student: affected.size > 0 ? +(allDiags.length / affected.size).toFixed(1) : 0,
    first_seen: allDiags.sort((a, b) => a.diagnosed_at.localeCompare(b.diagnosed_at))[0]?.diagnosed_at || "",
    last_seen: allDiags.sort((a, b) => b.diagnosed_at.localeCompare(a.diagnosed_at))[0]?.diagnosed_at || "",
    severity_distribution: sevDist,
    timeline: Object.entries(dateMap).sort().map(([date, count]) => ({ date, count })),
    affected_students: Array.from(affected.entries()).map(([id, v]) => ({
      student_id: id, student_name: v.name, occurrence_count: v.count,
      severities: v.severities, first_seen: v.first, last_seen: v.last,
    })),
    code_examples: allDiags.slice(0, 10).map((d) => ({
      student_id: d.student_id,
      student_name: MOCK_USERS.students.find((s) => s.id === d.student_id)?.name || "?",
      code: d.code_snippet, symptom: d.symptom, severity: d.severity, diagnosed_at: d.diagnosed_at,
    })),
  };
}

export function getMockCourseOverview(_courseId: number) {
  return {
    course: { id: 1, name: "Java 프로그래밍 기초", language: "java" },
    student_count: MOCK_USERS.students.length,
    students: MOCK_USERS.students,
  };
}

// Mock diagnosis from code submission
export function getMockDiagnosis(code: string, _language: string) {
  const issues: typeof PATHOLOGIES[number][] = [];
  if (code.includes("for") && code.includes("<=")) issues.push(PATHOLOGIES[1]); // off-by-one
  if (code.includes("while (true)") || code.includes("while(true)")) issues.push(PATHOLOGIES[2]); // infinite loop
  if (code.includes("catch") && /catch\s*\([^)]*\)\s*\{\s*\}/.test(code)) issues.push(PATHOLOGIES[6]); // empty catch
  if (/\bnull\b/.test(code) && !code.includes("!= null") && !code.includes("== null")) issues.push(PATHOLOGIES[0]); // null check
  if (issues.length === 0 && code.length > 10) issues.push(randomPick(PATHOLOGIES));

  if (issues.length === 0) {
    return {
      pathology_name: "코드가 깨끗합니다",
      pathology_code: "CLEAN",
      category: "none",
      severity: "none",
      symptom: "특별한 문제가 발견되지 않았습니다.",
      root_cause: "좋은 코딩 습관을 유지하고 있습니다.",
      prescription: "현재 수준을 유지하면서 더 복잡한 문제에 도전해보세요.",
      meta_insight: "잘하고 있어요! 계속 이 페이스를 유지하세요.",
      is_recurring: false,
      recurrence_count: 0,
    };
  }

  const p = issues[0];
  return {
    pathology_name: p.name,
    pathology_code: p.code,
    category: p.category,
    severity: p.severity,
    symptom: `${p.name} 패턴이 코드에서 감지되었습니다.`,
    root_cause: `${p.category} 영역의 기본 개념을 다시 확인해보세요.`,
    prescription: `${p.name}을 방지하려면 관련 연습 문제를 풀어보세요.`,
    meta_insight: `이 패턴은 초보 개발자에게 흔히 나타나는 패턴이에요. 함께 고쳐나가요!`,
    is_recurring: Math.random() > 0.5,
    recurrence_count: Math.floor(Math.random() * 3) + 1,
  };
}

// Mock hints
const MOCK_HINTS = [
  "이 부분에서 반복문의 종료 조건을 다시 한번 살펴볼까요?",
  "배열의 인덱스가 0부터 시작한다는 점을 기억하세요.",
  "예외 처리에서 빈 catch 블록은 어떤 문제를 숨길 수 있을까요?",
  "변수를 선언했는데 사용하지 않는 경우, 코드의 가독성에 어떤 영향을 줄까요?",
  "이 조건문에서 null 체크를 먼저 하면 어떨까요?",
];

export function getMockHint(level: number) {
  const idx = Math.min(level - 1, MOCK_HINTS.length - 1);
  return {
    type: "hint" as const,
    message: MOCK_HINTS[Math.max(0, idx)],
    hint_level: level,
    related_line: Math.floor(Math.random() * 20) + 1,
  };
}
