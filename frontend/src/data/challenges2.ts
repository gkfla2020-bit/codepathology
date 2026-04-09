import type { Challenge, TestResult } from "../components/CodingChallenge";

function jv(code: string, fn: string, cases: { args: string; expected: string; hidden?: boolean }[]): { passed: boolean; results: TestResult[] } {
  const r: TestResult[] = [];
  try {
    const f = new Function(code + `\nreturn ${fn};`)();
    for (const c of cases) {
      try {
        const a = JSON.parse(`[${c.args}]`);
        const res = f(...a);
        const act = JSON.stringify(res) ?? String(res);
        const ok = act === c.expected || String(res) === c.expected;
        r.push({ input: c.args, expected: c.expected, actual: act, passed: ok, hidden: c.hidden });
      } catch (e) { r.push({ input: c.args, expected: c.expected, actual: `${e}`, passed: false, hidden: c.hidden }); }
    }
  } catch (e) { for (const c of cases) r.push({ input: c.args, expected: c.expected, actual: `${e}`, passed: false, hidden: c.hidden }); }
  return { passed: r.every(x => x.passed), results: r };
}

export const CHALLENGES_BATCH2: Challenge[] = [
  {
    id: "ch-anagram", title: "애너그램 판별", difficulty: "easy", language: "javascript",
    description: "두 문자열이 애너그램인지 판별하는 함수 `isAnagram(a, b)`을 작성하세요.\n대소문자 무시, 공백 무시.",
    constraints: ["대소문자 무시", "공백 무시"],
    starterCode: `function isAnagram(a, b) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"listen", "silent"', expected: "true" },
      { input: '"hello", "world"', expected: "false" },
      { input: '"Astronomer", "Moon starer"', expected: "true" },
      { input: '"", ""', expected: "true", hidden: true },
    ],
    validate(code) { return jv(code, "isAnagram", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-compress", title: "문자열 압축", difficulty: "medium", language: "javascript",
    description: "연속된 같은 문자를 '문자+개수'로 압축하는 함수 `compress(s)`을 작성하세요.\n1개면 숫자 생략.",
    constraints: ["1개면 숫자 생략", "빈 문자열은 빈 문자열 반환"],
    starterCode: `function compress(s) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"aabcccccaaa"', expected: '"a2bc5a3"' },
      { input: '"abc"', expected: '"abc"' },
      { input: '""', expected: '""' },
      { input: '"aaaa"', expected: '"a4"', hidden: true },
    ],
    validate(code) { return jv(code, "compress", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-rotate-arr", title: "배열 회전", difficulty: "easy", language: "javascript",
    description: "배열을 k만큼 오른쪽으로 회전하는 함수 `rotate(arr, k)`를 작성하세요.",
    constraints: ["원본 배열 수정 금지", "k가 배열 길이보다 클 수 있음"],
    starterCode: `function rotate(arr, k) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[1,2,3,4,5], 2", expected: "[4,5,1,2,3]" },
      { input: "[1,2,3], 0", expected: "[1,2,3]" },
      { input: "[1,2], 4", expected: "[1,2]" },
      { input: "[1], 100", expected: "[1]", hidden: true },
    ],
    validate(code) { return jv(code, "rotate", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-range", title: "범위 생성기", difficulty: "easy", language: "javascript",
    description: "Python의 range처럼 동작하는 함수 `range(start, end, step)`을 작성하세요.\nstep 기본값 1.",
    constraints: ["step이 0이면 빈 배열", "음수 step 지원"],
    starterCode: `function range(start, end, step = 1) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "0, 5", expected: "[0,1,2,3,4]" },
      { input: "1, 10, 2", expected: "[1,3,5,7,9]" },
      { input: "5, 0, -1", expected: "[5,4,3,2,1]" },
      { input: "0, 0", expected: "[]", hidden: true },
    ],
    validate(code) { return jv(code, "range", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-deep-equal", title: "깊은 비교", difficulty: "medium", language: "javascript",
    description: "두 값이 깊은 비교로 같은지 판별하는 함수 `deepEqual(a, b)`을 작성하세요.",
    constraints: ["객체, 배열, 원시값 모두 지원", "JSON.stringify 사용 금지"],
    starterCode: `function deepEqual(a, b) {\n  // JSON.stringify 사용 금지!\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '{"a":1}, {"a":1}', expected: "true" },
      { input: "[1,[2]], [1,[2]]", expected: "true" },
      { input: '{"a":1}, {"a":2}', expected: "false" },
      { input: "null, null", expected: "true", hidden: true },
    ],
    validate(code) {
      if (code.includes("JSON.stringify")) return { passed: false, results: this.testCases.map(t => ({ input: t.input, expected: t.expected, actual: "JSON.stringify 금지!", passed: false, hidden: t.hidden })) };
      return jv(code, "deepEqual", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden })));
    },
  },
  {
    id: "ch-memoize", title: "메모이제이션", difficulty: "hard", language: "javascript",
    description: "함수의 결과를 캐싱하는 `memoize(fn)` 함수를 작성하세요.\n같은 인자로 호출하면 캐시된 결과 반환.",
    constraints: ["인자를 키로 사용", "Map 또는 객체 사용"],
    starterCode: `function memoize(fn) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "(x) => x * 2, then call(5) twice", expected: "10" },
    ],
    validate(code) {
      const r: TestResult[] = [];
      try {
        const f = new Function(code + "\nreturn memoize;")();
        let callCount = 0;
        const expensive = (x: number) => { callCount++; return x * 2; };
        const memo = f(expensive);
        const r1 = memo(5);
        const r2 = memo(5);
        r.push({ input: "memo(5) 첫 호출", expected: "10", actual: String(r1), passed: r1 === 10 });
        r.push({ input: "memo(5) 두 번째 (캐시)", expected: "10", actual: String(r2), passed: r2 === 10 });
        r.push({ input: "원본 함수 호출 횟수", expected: "1", actual: String(callCount), passed: callCount === 1 });
      } catch (e) { r.push({ input: "memoize test", expected: "10", actual: `${e}`, passed: false }); }
      return { passed: r.every(x => x.passed), results: r };
    },
  },

  {
    id: "ch-pipe", title: "파이프 함수", difficulty: "hard", language: "javascript",
    description: "여러 함수를 순서대로 합성하는 `pipe(...fns)` 함수를 작성하세요.\npipe(f, g, h)(x) === h(g(f(x)))",
    constraints: ["함수 0개면 identity 반환", "왼쪽에서 오른쪽 순서"],
    starterCode: `function pipe(...fns) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "x=>x+1, x=>x*2, then call(3)", expected: "8" },
      { input: "identity, then call(5)", expected: "5" },
    ],
    validate(code) {
      const r: TestResult[] = [];
      try {
        const f = new Function(code + "\nreturn pipe;")();
        const r1 = f((x: number) => x + 1, (x: number) => x * 2)(3);
        r.push({ input: "pipe(x=>x+1, x=>x*2)(3)", expected: "8", actual: String(r1), passed: r1 === 8 });
        const r2 = f()(5);
        r.push({ input: "pipe()(5)", expected: "5", actual: String(r2), passed: r2 === 5 });
      } catch (e) { r.push({ input: "pipe test", expected: "8", actual: `${e}`, passed: false }); }
      return { passed: r.every(x => x.passed), results: r };
    },
  },
  {
    id: "ch-matrix-rotate", title: "행렬 90도 회전", difficulty: "hard", language: "javascript",
    description: "N×N 행렬을 시계 방향으로 90도 회전하는 함수 `rotateMatrix(m)`을 작성하세요.",
    constraints: ["새 행렬 반환", "정사각 행렬만"],
    starterCode: `function rotateMatrix(m) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[[1,2],[3,4]]", expected: "[[3,1],[4,2]]" },
      { input: "[[1,2,3],[4,5,6],[7,8,9]]", expected: "[[7,4,1],[8,5,2],[9,6,3]]" },
      { input: "[[1]]", expected: "[[1]]", hidden: true },
    ],
    validate(code) { return jv(code, "rotateMatrix", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-valid-brackets", title: "괄호 유효성 검사", difficulty: "medium", language: "javascript",
    description: "문자열의 괄호가 올바르게 짝지어졌는지 판별하는 함수 `isValid(s)`을 작성하세요.\n(), [], {} 지원.",
    constraints: ["스택 사용 권장", "빈 문자열은 true"],
    starterCode: `function isValid(s) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"()[]{}"', expected: "true" },
      { input: '"(]"', expected: "false" },
      { input: '"{[]}"', expected: "true" },
      { input: '""', expected: "true", hidden: true },
      { input: '"((("', expected: "false", hidden: true },
    ],
    validate(code) { return jv(code, "isValid", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-longest-substr", title: "최장 부분 문자열", difficulty: "hard", language: "javascript",
    description: "중복 없는 가장 긴 부분 문자열의 길이를 반환하는 함수 `lengthOfLongestSubstring(s)`을 작성하세요.",
    constraints: ["슬라이딩 윈도우 권장", "빈 문자열은 0"],
    starterCode: `function lengthOfLongestSubstring(s) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"abcabcbb"', expected: "3" },
      { input: '"bbbbb"', expected: "1" },
      { input: '"pwwkew"', expected: "3" },
      { input: '""', expected: "0", hidden: true },
    ],
    validate(code) { return jv(code, "lengthOfLongestSubstring", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-throttle", title: "쓰로틀 구현", difficulty: "hard", language: "javascript",
    description: "함수 호출을 일정 간격으로 제한하는 `throttle(fn, delay)` 함수를 작성하세요.\n첫 호출은 즉시 실행.",
    constraints: ["첫 호출 즉시 실행", "delay 내 추가 호출 무시"],
    starterCode: `function throttle(fn, delay) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [{ input: "() => 1, 100", expected: "function" }],
    validate(code) {
      const r: TestResult[] = [];
      try {
        const f = new Function(code + "\nreturn throttle;")();
        const res = f(() => 1, 100);
        r.push({ input: "typeof result", expected: "function", actual: typeof res, passed: typeof res === "function" });
        let count = 0;
        const t = f(() => { count++; }, 1000);
        t(); t(); t();
        r.push({ input: "3회 즉시 호출 후 count", expected: "1", actual: String(count), passed: count === 1 });
      } catch (e) { r.push({ input: "throttle", expected: "function", actual: `${e}`, passed: false }); }
      return { passed: r.every(x => x.passed), results: r };
    },
  },
  {
    id: "ch-event-emitter", title: "이벤트 이미터", difficulty: "hard", language: "javascript",
    description: "on, emit, off 메서드를 가진 EventEmitter 클래스를 작성하세요.",
    constraints: ["on(event, callback)", "emit(event, ...args)", "off(event, callback)"],
    starterCode: `class EventEmitter {\n  constructor() {\n    // 여기에 코드를 작성하세요\n  }\n  on(event, cb) {}\n  emit(event, ...args) {}\n  off(event, cb) {}\n}`,
    testCases: [{ input: "new EventEmitter()", expected: "object" }],
    validate(code) {
      const r: TestResult[] = [];
      try {
        const E = new Function(code + "\nreturn EventEmitter;")();
        const e = new E();
        r.push({ input: "new EventEmitter()", expected: "object", actual: typeof e, passed: typeof e === "object" });
        let val = 0;
        const cb = (x: number) => { val = x; };
        e.on("test", cb);
        e.emit("test", 42);
        r.push({ input: 'emit("test", 42)', expected: "42", actual: String(val), passed: val === 42 });
        e.off("test", cb);
        e.emit("test", 99);
        r.push({ input: 'off 후 emit', expected: "42", actual: String(val), passed: val === 42 });
      } catch (e) { r.push({ input: "EventEmitter", expected: "object", actual: `${e}`, passed: false }); }
      return { passed: r.every(x => x.passed), results: r };
    },
  },
  {
    id: "ch-promise-all", title: "Promise.all 구현", difficulty: "hard", language: "javascript",
    description: "Promise.all과 동일하게 동작하는 `promiseAll(promises)` 함수를 작성하세요.",
    constraints: ["순서 보장", "하나라도 reject되면 전체 reject"],
    starterCode: `function promiseAll(promises) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [{ input: "[Promise.resolve(1), Promise.resolve(2)]", expected: "[1,2]" }],
    validate(code) {
      const r: TestResult[] = [];
      try {
        const f = new Function(code + "\nreturn promiseAll;")();
        const isFunc = typeof f === "function";
        r.push({ input: "typeof promiseAll", expected: "function", actual: typeof f, passed: isFunc });
        const res = f([Promise.resolve(1), Promise.resolve(2)]);
        const isPromise = res instanceof Promise;
        r.push({ input: "returns Promise", expected: "true", actual: String(isPromise), passed: isPromise });
      } catch (e) { r.push({ input: "promiseAll", expected: "function", actual: `${e}`, passed: false }); }
      return { passed: r.every(x => x.passed), results: r };
    },
  },
  {
    id: "ch-lru-cache", title: "LRU 캐시", difficulty: "hard", language: "javascript",
    description: "용량 제한이 있는 LRU 캐시를 구현하세요.\nget(key), put(key, value) 메서드.",
    constraints: ["용량 초과 시 가장 오래된 항목 제거", "get 시 최근 사용으로 갱신"],
    starterCode: `class LRUCache {\n  constructor(capacity) {\n    // 여기에 코드를 작성하세요\n  }\n  get(key) {}\n  put(key, value) {}\n}`,
    testCases: [{ input: "new LRUCache(2)", expected: "object" }],
    validate(code) {
      const r: TestResult[] = [];
      try {
        const C = new Function(code + "\nreturn LRUCache;")();
        const c = new C(2);
        c.put(1, 1); c.put(2, 2);
        r.push({ input: "get(1)", expected: "1", actual: String(c.get(1)), passed: c.get(1) === 1 });
        c.put(3, 3); // evicts key 2
        r.push({ input: "get(2) after evict", expected: "-1", actual: String(c.get(2)), passed: c.get(2) === -1 || c.get(2) === undefined });
        r.push({ input: "get(3)", expected: "3", actual: String(c.get(3)), passed: c.get(3) === 3 });
      } catch (e) { r.push({ input: "LRUCache", expected: "object", actual: `${e}`, passed: false }); }
      return { passed: r.every(x => x.passed), results: r };
    },
  },
  {
    id: "ch-flat-obj", title: "객체 평탄화", difficulty: "medium", language: "javascript",
    description: "중첩 객체를 점(.) 표기법으로 평탄화하는 함수 `flattenObject(obj)`을 작성하세요.",
    constraints: ["배열은 인덱스로", "null은 그대로"],
    starterCode: `function flattenObject(obj, prefix = "") {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '{"a":{"b":1},"c":2}', expected: '{"a.b":1,"c":2}' },
      { input: '{"x":{"y":{"z":1}}}', expected: '{"x.y.z":1}' },
      { input: '{}', expected: '{}', hidden: true },
    ],
    validate(code) { return jv(code, "flattenObject", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-camel-case", title: "camelCase 변환", difficulty: "easy", language: "javascript",
    description: "snake_case 또는 kebab-case 문자열을 camelCase로 변환하는 함수 `toCamelCase(s)`을 작성하세요.",
    constraints: ["첫 글자는 소문자", "_ 와 - 모두 지원"],
    starterCode: `function toCamelCase(s) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"hello_world"', expected: '"helloWorld"' },
      { input: '"my-variable-name"', expected: '"myVariableName"' },
      { input: '"already"', expected: '"already"' },
      { input: '""', expected: '""', hidden: true },
    ],
    validate(code) { return jv(code, "toCamelCase", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-zip", title: "배열 Zip", difficulty: "easy", language: "javascript",
    description: "여러 배열을 zip하는 함수 `zip(...arrays)`을 작성하세요.\nPython의 zip과 동일.",
    constraints: ["가장 짧은 배열 길이에 맞춤"],
    starterCode: `function zip(...arrays) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[1,2,3], [4,5,6]", expected: "[[1,4],[2,5],[3,6]]" },
      { input: "[1,2], [3,4,5]", expected: "[[1,3],[2,4]]" },
      { input: "[], [1]", expected: "[]" },
      { input: "[1], [2], [3]", expected: "[[1,2,3]]", hidden: true },
    ],
    validate(code) { return jv(code, "zip", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
  {
    id: "ch-retry", title: "재시도 함수", difficulty: "hard", language: "javascript",
    description: "실패 시 최대 n번 재시도하는 `retry(fn, n)` 함수를 작성하세요.\nPromise를 반환.",
    constraints: ["fn은 Promise 반환", "n번 모두 실패하면 마지막 에러 throw"],
    starterCode: `async function retry(fn, n) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [{ input: "() => Promise.resolve(1), 3", expected: "function" }],
    validate(code) {
      const r: TestResult[] = [];
      try {
        const f = new Function(code + "\nreturn retry;")();
        const res = f(() => Promise.resolve(1), 3);
        r.push({ input: "returns Promise", expected: "true", actual: String(res instanceof Promise), passed: res instanceof Promise });
      } catch (e) { r.push({ input: "retry", expected: "function", actual: `${e}`, passed: false }); }
      return { passed: r.every(x => x.passed), results: r };
    },
  },
  {
    id: "ch-spiral", title: "나선형 행렬", difficulty: "hard", language: "javascript",
    description: "N×N 크기의 나선형 행렬을 생성하는 함수 `spiral(n)`을 작성하세요.\n1부터 n²까지 나선형으로 채움.",
    constraints: ["시계 방향", "1부터 시작"],
    starterCode: `function spiral(n) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "2", expected: "[[1,2],[4,3]]" },
      { input: "3", expected: "[[1,2,3],[8,9,4],[7,6,5]]" },
      { input: "1", expected: "[[1]]", hidden: true },
    ],
    validate(code) { return jv(code, "spiral", this.testCases.map(t => ({ args: t.input, expected: t.expected, hidden: t.hidden }))); },
  },
];
