import { useState, useEffect, useCallback } from "react";
import { EXTRA_CHALLENGES } from "../data/challenges";
import { CHALLENGES_BATCH2 } from "../data/challenges2";

/* ── 챌린지 문제 정의 ── */
export interface Challenge {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  language: string;
  description: string;
  constraints: string[];
  starterCode: string;
  testCases: { input: string; expected: string; hidden?: boolean }[];
  /** 정답 판별 함수 – 학생 코드 문자열을 받아 통과 여부 반환 */
  validate: (code: string) => { passed: boolean; results: TestResult[] };
}

export interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  hidden?: boolean;
}

/* ── 내장 챌린지 목록 ── */
const CHALLENGES: Challenge[] = [
  {
    id: "ch-sum-array",
    title: "배열 합계 구하기",
    difficulty: "easy",
    language: "javascript",
    description:
      "정수 배열을 받아 모든 요소의 합을 반환하는 함수 `sumArray`를 작성하세요.",
    constraints: [
      "빈 배열이면 0을 반환",
      "음수도 포함될 수 있음",
      "for / reduce 등 자유롭게 사용 가능",
    ],
    starterCode: `function sumArray(arr) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[1, 2, 3]", expected: "6" },
      { input: "[]", expected: "0" },
      { input: "[-1, 5, -3]", expected: "1" },
      { input: "[100]", expected: "100", hidden: true },
    ],
    validate(code) {
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn sumArray;")();
        for (const tc of this.testCases) {
          const arr = JSON.parse(tc.input);
          const actual = String(fn(arr));
          results.push({ input: tc.input, expected: tc.expected, actual, passed: actual === tc.expected, hidden: tc.hidden });
        }
      } catch (e) {
        for (const tc of this.testCases) {
          results.push({ input: tc.input, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
        }
      }
      return { passed: results.every((r) => r.passed), results };
    },
  },
  {
    id: "ch-fizzbuzz",
    title: "FizzBuzz",
    difficulty: "easy",
    language: "javascript",
    description:
      "1부터 n까지의 FizzBuzz 결과를 배열로 반환하는 함수 `fizzBuzz(n)`을 작성하세요.\n3의 배수 → 'Fizz', 5의 배수 → 'Buzz', 15의 배수 → 'FizzBuzz', 나머지 → 숫자(문자열).",
    constraints: ["n은 1 이상의 정수", "반환값은 문자열 배열"],
    starterCode: `function fizzBuzz(n) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "5", expected: '["1","2","Fizz","4","Buzz"]' },
      { input: "15", expected: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
      { input: "1", expected: '["1"]' },
      { input: "3", expected: '["1","2","Fizz"]', hidden: true },
    ],
    validate(code) {
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn fizzBuzz;")();
        for (const tc of this.testCases) {
          const actual = JSON.stringify(fn(Number(tc.input)));
          results.push({ input: tc.input, expected: tc.expected, actual, passed: actual === tc.expected, hidden: tc.hidden });
        }
      } catch (e) {
        for (const tc of this.testCases) {
          results.push({ input: tc.input, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
        }
      }
      return { passed: results.every((r) => r.passed), results };
    },
  },
  {
    id: "ch-palindrome",
    title: "팰린드롬 판별",
    difficulty: "medium",
    language: "javascript",
    description:
      "문자열이 팰린드롬(앞뒤가 같은 문자열)인지 판별하는 함수 `isPalindrome(s)`을 작성하세요.\n대소문자를 구분하지 않으며, 알파벳과 숫자만 비교합니다.",
    constraints: ["공백·특수문자 무시", "대소문자 무시", "빈 문자열은 true"],
    starterCode: `function isPalindrome(s) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"racecar"', expected: "true" },
      { input: '"A man, a plan, a canal: Panama"', expected: "true" },
      { input: '"hello"', expected: "false" },
      { input: '""', expected: "true", hidden: true },
    ],
    validate(code) {
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn isPalindrome;")();
        for (const tc of this.testCases) {
          const arg = JSON.parse(tc.input);
          const actual = String(fn(arg));
          results.push({ input: tc.input, expected: tc.expected, actual, passed: actual === tc.expected, hidden: tc.hidden });
        }
      } catch (e) {
        for (const tc of this.testCases) {
          results.push({ input: tc.input, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
        }
      }
      return { passed: results.every((r) => r.passed), results };
    },
  },
  {
    id: "ch-two-sum",
    title: "Two Sum",
    difficulty: "medium",
    language: "javascript",
    description:
      "정수 배열 nums와 정수 target이 주어질 때, 합이 target이 되는 두 수의 인덱스를 배열로 반환하는 함수 `twoSum(nums, target)`을 작성하세요.",
    constraints: ["정답은 정확히 하나 존재", "같은 요소를 두 번 사용 불가", "인덱스 오름차순 반환"],
    starterCode: `function twoSum(nums, target) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[2,7,11,15], 9", expected: "[0,1]" },
      { input: "[3,2,4], 6", expected: "[1,2]" },
      { input: "[1,5,3,7], 8", expected: "[1,2]", hidden: true },
    ],
    validate(code) {
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn twoSum;")();
        const cases = [
          { nums: [2,7,11,15], target: 9, expected: [0,1] },
          { nums: [3,2,4], target: 6, expected: [1,2] },
          { nums: [1,5,3,7], target: 8, expected: [1,2] },
        ];
        for (let i = 0; i < cases.length; i++) {
          const c = cases[i];
          const tc = this.testCases[i];
          const res = fn(c.nums, c.target);
          const actual = JSON.stringify(res?.sort((a: number, b: number) => a - b));
          const expected = JSON.stringify(c.expected);
          results.push({ input: tc.input, expected: tc.expected, actual: actual ?? "undefined", passed: actual === expected, hidden: tc.hidden });
        }
      } catch (e) {
        for (const tc of this.testCases) {
          results.push({ input: tc.input, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
        }
      }
      return { passed: results.every((r) => r.passed), results };
    },
  },
  {
    id: "ch-flatten",
    title: "배열 평탄화 (Flatten)",
    difficulty: "hard",
    language: "javascript",
    description:
      "중첩된 배열을 1차원 배열로 평탄화하는 함수 `flatten(arr)`을 작성하세요.\n내장 flat() 메서드를 사용하지 마세요.",
    constraints: ["재귀 또는 스택 사용", "Array.prototype.flat 사용 금지", "깊이 제한 없음"],
    starterCode: `function flatten(arr) {\n  // flat() 사용 금지!\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[[1,2],[3,[4,5]]]", expected: "[1,2,3,4,5]" },
      { input: "[1,[2,[3,[4]]]]", expected: "[1,2,3,4]" },
      { input: "[]", expected: "[]" },
      { input: "[[[[1]]]]", expected: "[1]", hidden: true },
    ],
    validate(code) {
      if (code.includes(".flat(")) {
        return {
          passed: false,
          results: this.testCases.map((tc) => ({
            input: tc.input, expected: tc.expected, actual: "flat() 사용 금지!", passed: false, hidden: tc.hidden,
          })),
        };
      }
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn flatten;")();
        for (const tc of this.testCases) {
          const arr = JSON.parse(tc.input);
          const actual = JSON.stringify(fn(arr));
          results.push({ input: tc.input, expected: tc.expected, actual, passed: actual === tc.expected, hidden: tc.hidden });
        }
      } catch (e) {
        for (const tc of this.testCases) {
          results.push({ input: tc.input, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
        }
      }
      return { passed: results.every((r) => r.passed), results };
    },
  },
];

// 추가 챌린지 합치기
CHALLENGES.push(...EXTRA_CHALLENGES, ...CHALLENGES_BATCH2);

/* ── 난이도 색상 ── */
const diffStyle = {
  easy:   { bg: "bg-status-safe/10", text: "text-status-safe", label: "쉬움" },
  medium: { bg: "bg-toss-blue/10",   text: "text-toss-blue",   label: "보통" },
  hard:   { bg: "bg-status-danger/10", text: "text-status-danger", label: "어려움" },
};

/* ── Props ── */
interface Props {
  onStartChallenge: (challenge: Challenge) => void;
  currentId?: string;
}

export default function CodingChallenge({ onStartChallenge, currentId }: Props) {
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("solved_challenges") || "[]") as string[];
    setSolved(new Set(stored));
  }, []);

  const filtered = CHALLENGES
    .filter((ch) => filter === "all" || ch.difficulty === filter)
    .filter((ch) => !search || ch.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="py-2 space-y-2">
      {/* 진행률 */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-txt-tertiary">{solved.size}/{CHALLENGES.length} 해결</span>
        <div className="flex-1 mx-3 h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div className="h-full bg-status-safe rounded-full transition-all" style={{ width: `${(solved.size / CHALLENGES.length) * 100}%` }} />
        </div>
      </div>
      {/* 검색 */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="문제 검색..."
        className="w-full px-3 py-1.5 text-[11px] bg-bg-elevated rounded-lg text-txt-primary placeholder-txt-tertiary border border-line-primary focus:border-toss-blue outline-none transition"
      />
      {/* 난이도 필터 */}
      <div className="flex gap-1 mb-1">
        {(["all", "easy", "medium", "hard"] as const).map((f) => {
          const labels = { all: "전체", easy: "쉬움", medium: "보통", hard: "어려움" };
          const count = f === "all" ? CHALLENGES.length : CHALLENGES.filter((c) => c.difficulty === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-[10px] rounded-lg transition ${filter === f ? "bg-toss-blue text-white font-bold" : "text-txt-tertiary hover:text-txt-secondary bg-bg-elevated"}`}
            >
              {labels[f]} ({count})
            </button>
          );
        })}
      </div>
      {filtered.map((ch) => {
        const ds = diffStyle[ch.difficulty];
        const isSolved = solved.has(ch.id);
        const isCurrent = ch.id === currentId;
        return (
          <div
            key={ch.id}
            className={`rounded-xl px-3 py-2.5 cursor-pointer transition-all ${isCurrent ? "bg-toss-blue-dim border border-toss-blue/30" : isSolved ? "bg-bg-elevated/40 opacity-70" : "bg-bg-elevated/50 hover:bg-bg-elevated"}`}
            onClick={() => onStartChallenge(ch)}
          >
            <div className="flex items-center gap-2">
              {isSolved ? (
                <span className="w-4 h-4 rounded-full bg-status-safe flex items-center justify-center text-[10px] text-white shrink-0">✓</span>
              ) : isCurrent ? (
                <span className="w-4 h-4 rounded-full bg-toss-blue flex items-center justify-center text-[10px] text-white shrink-0">▶</span>
              ) : (
                <span className="w-4 h-4 rounded-full border border-line-primary shrink-0" />
              )}
              <span className={`text-xs font-bold flex-1 ${isSolved ? "line-through text-txt-tertiary" : isCurrent ? "text-toss-blue" : "text-txt-primary"}`}>{ch.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ds.bg} ${ds.text}`}>{ds.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 챌린지 문제 패널 (에디터 왼쪽 사이드) ── */
export function ChallengePanel({ challenge, code, onClose, runCount, onNext, onReset, onPrev, onPass }: { challenge: Challenge; code: string; onClose: () => void; runCount?: number; onNext?: () => void; onReset?: () => void; onPrev?: () => void; onPass?: () => void }) {
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [allPassed, setAllPassed] = useState(false);
  const [activeSection, setActiveSection] = useState<"desc" | "tests" | "hints">("desc");
  const [hintLevel, setHintLevel] = useState(0);

  // 문제 번호
  const challengeIdx = CHALLENGES.findIndex((c) => c.id === challenge.id);
  const challengeNum = challengeIdx + 1;

  // 힌트 (문제별 3단계)
  const hints = [
    `이 문제는 "${challenge.title}"입니다. 먼저 문제를 잘 읽고 입출력 예시를 확인해보세요.`,
    `${challenge.constraints[0] || "제약 조건을 다시 확인해보세요."} 이 조건을 만족하는 방법을 생각해보세요.`,
    `테스트 케이스의 첫 번째 예시: 입력 ${challenge.testCases[0]?.input} → 출력 ${challenge.testCases[0]?.expected}. 이 패턴을 일반화해보세요.`,
  ];

  // 문제 바뀌면 리셋
  useEffect(() => {
    setResults(null);
    setAllPassed(false);
    setActiveSection("desc");
    setHintLevel(0);
  }, [challenge.id]);

  // 실행될 때마다 자동 검증
  useEffect(() => {
    if (runCount && runCount > 0) {
      const { passed, results: r } = challenge.validate(code);
      setResults(r);
      setAllPassed(passed);
      setActiveSection("tests");
      if (passed) {
        const stored = JSON.parse(localStorage.getItem("solved_challenges") || "[]") as string[];
        if (!stored.includes(challenge.id)) {
          stored.push(challenge.id);
          localStorage.setItem("solved_challenges", JSON.stringify(stored));
          onPass?.();
        }
      }
    }
  }, [runCount]);

  const ds = diffStyle[challenge.difficulty];
  const visibleTests = challenge.testCases.filter((tc) => !tc.hidden);
  const hiddenCount = challenge.testCases.filter((tc) => tc.hidden).length;

  return (
    <div className="w-[340px] min-w-[300px] max-w-[420px] shrink-0 flex flex-col h-full bg-bg-card border-r border-line-secondary animate-fade-in">
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-3 border-b border-line-secondary">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-txt-tertiary">#{challengeNum}/{CHALLENGES.length}</span>
            <span className="text-lg">🏆</span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${ds.bg} ${ds.text}`}>{ds.label}</span>
          </div>
          <div className="flex items-center gap-1">
            {onReset && (
              <button onClick={onReset} className="text-[10px] text-txt-tertiary hover:text-status-warn transition px-2 py-1 rounded-lg hover:bg-bg-hover" title="코드 초기화">↺ 리셋</button>
            )}
            <button onClick={onClose} className="text-txt-tertiary hover:text-txt-primary text-lg leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-hover transition">×</button>
          </div>
        </div>
        <h2 className="text-base font-extrabold text-txt-primary leading-snug">{challenge.title}</h2>
        {allPassed && onNext && (
          <button onClick={onNext} className="mt-2 w-full py-2 bg-toss-blue hover:bg-toss-blue-light rounded-xl text-[11px] font-bold text-white transition animate-slide-up">
            🎉 통과! 다음 문제 →
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 px-4 pt-3 pb-1">
        {([ ["desc", "문제 설명"], ["tests", "테스트 결과"], ["hints", "💡 힌트"] ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-3 py-1.5 text-[11px] rounded-lg transition-all ${
              activeSection === key ? "bg-toss-blue text-white font-bold" : "text-txt-tertiary hover:text-txt-secondary"
            }`}
          >
            {label}
            {key === "tests" && results && (
              <span className={`ml-1.5 ${allPassed ? "text-status-safe" : "text-status-danger"}`}>
                {allPassed ? "✓" : `${results.filter((r) => !r.passed).length}✗`}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {activeSection === "desc" && (
          <div className="space-y-4 animate-fade-in">
            {/* 설명 */}
            <div>
              <p className="text-[10px] font-bold text-toss-blue tracking-wider mb-2">DESCRIPTION</p>
              <p className="text-xs text-txt-secondary leading-relaxed whitespace-pre-line">{challenge.description}</p>
            </div>

            {/* 제약 조건 */}
            {challenge.constraints.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-status-warn tracking-wider mb-2">CONSTRAINTS</p>
                <ul className="space-y-1.5">
                  {challenge.constraints.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-txt-secondary leading-relaxed">
                      <span className="text-status-warn mt-0.5 shrink-0">⚠</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 예시 입출력 */}
            <div>
              <p className="text-[10px] font-bold text-txt-tertiary tracking-wider mb-2">EXAMPLES</p>
              <div className="space-y-2">
                {visibleTests.map((tc, i) => (
                  <div key={i} className="bg-bg-elevated rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-txt-tertiary">Example {i + 1}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] text-toss-blue font-bold w-10 shrink-0">Input</span>
                        <code className="text-[11px] font-mono text-txt-primary bg-bg-primary px-2 py-0.5 rounded">{tc.input}</code>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] text-status-safe font-bold w-10 shrink-0">Output</span>
                        <code className="text-[11px] font-mono text-status-safe bg-bg-primary px-2 py-0.5 rounded">{tc.expected}</code>
                      </div>
                    </div>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <p className="text-[10px] text-txt-tertiary italic">+ 히든 테스트 {hiddenCount}개</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === "tests" && (
          <div className="space-y-3 animate-fade-in">
            {!results && (
              <div className="text-center py-8">
                <p className="text-txt-tertiary text-xs mb-2">아직 테스트를 실행하지 않았어요</p>
                <p className="text-txt-tertiary text-[11px]">아래 버튼을 눌러 코드를 검증하세요</p>
              </div>
            )}

            {results && (
              <>
                {/* 결과 요약 */}
                <div className={`rounded-xl p-4 text-center ${allPassed ? "bg-status-safe/10" : "bg-status-danger/10"}`}>
                  <p className={`text-lg font-extrabold ${allPassed ? "text-status-safe" : "text-status-danger"}`}>
                    {allPassed ? "🎉 All Passed!" : `${results.filter((r) => r.passed).length} / ${results.length} Passed`}
                  </p>
                  {allPassed && <p className="text-[11px] text-status-safe mt-1">축하해요! 다음 챌린지에 도전해보세요</p>}
                </div>

                {/* 개별 결과 */}
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className={`rounded-xl p-3 border ${r.passed ? "border-status-safe/20 bg-status-safe/5" : "border-status-danger/20 bg-status-danger/5"}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${r.passed ? "bg-status-safe" : "bg-status-danger"}`}>
                          {r.passed ? "✓" : "✗"}
                        </span>
                        <span className="text-[11px] font-bold text-txt-primary">
                          {r.hidden ? `히든 테스트 #${i + 1}` : `테스트 #${i + 1}`}
                        </span>
                      </div>
                      {!r.hidden && (
                        <div className="ml-7 space-y-1 text-[11px] font-mono">
                          <div className="flex gap-2">
                            <span className="text-txt-tertiary w-12">Input:</span>
                            <span className="text-txt-secondary">{r.input}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-txt-tertiary w-12">기대값:</span>
                            <span className="text-status-safe">{r.expected}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-txt-tertiary w-12">실제값:</span>
                            <span className={`${r.passed ? "text-status-safe" : "text-status-danger"} break-all`}>{r.actual.length > 80 ? r.actual.slice(0, 80) + "…" : r.actual}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeSection === "hints" && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-[10px] text-txt-tertiary">막히면 힌트를 하나씩 열어보세요. 최대한 스스로 풀어보는 게 좋아요!</p>
            {hints.map((hint, i) => (
              <div key={i}>
                {i <= hintLevel ? (
                  <div className="bg-toss-blue-dim rounded-xl p-3 animate-slide-up">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-toss-blue">💡 힌트 {i + 1}</span>
                    </div>
                    <p className="text-[11px] text-txt-secondary leading-relaxed">{hint}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setHintLevel(i)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-bg-elevated text-[11px] text-txt-tertiary hover:text-toss-blue transition"
                  >
                    🔒 힌트 {i + 1} 열기
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 — 네비게이션 */}
      <div className="px-5 py-2 border-t border-line-secondary flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={!onPrev || CHALLENGES.findIndex((c) => c.id === challenge.id) === 0}
          className="text-[10px] text-txt-tertiary hover:text-toss-blue disabled:opacity-20 transition"
        >
          ← 이전
        </button>
        <p className="text-[10px] text-txt-tertiary">▶ 실행 또는 Cmd+Enter</p>
        {allPassed && onNext ? (
          <button onClick={onNext} className="px-4 py-1.5 bg-toss-blue hover:bg-toss-blue-light rounded-lg text-[11px] font-bold text-white transition">
            다음 문제 →
          </button>
        ) : (
          <span className="text-[10px] text-txt-tertiary">
            {challengeNum < CHALLENGES.length ? `→ 다음` : "마지막"}
          </span>
        )}
      </div>
    </div>
  );
}

export { CHALLENGES };
