import type { Challenge, TestResult } from "../components/CodingChallenge";

function jsValidate(code: string, fnName: string, cases: { args: string; expected: string; hidden?: boolean }[]): { passed: boolean; results: TestResult[] } {
  const results: TestResult[] = [];
  try {
    const fn = new Function(code + `\nreturn ${fnName};`)();
    for (const tc of cases) {
      try {
        const args = JSON.parse(`[${tc.args}]`);
        const result = fn(...args);
        const actual = JSON.stringify(result) ?? String(result);
        const passed = actual === tc.expected || String(result) === tc.expected;
        results.push({ input: tc.args, expected: tc.expected, actual, passed, hidden: tc.hidden });
      } catch (e) {
        results.push({ input: tc.args, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
      }
    }
  } catch (e) {
    for (const tc of cases) {
      results.push({ input: tc.args, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
    }
  }
  return { passed: results.every((r) => r.passed), results };
}

export const EXTRA_CHALLENGES: Challenge[] = [
  // ── Round 1: 문자열 ──
  {
    id: "ch-reverse-str", title: "문자열 뒤집기", difficulty: "easy", language: "javascript",
    description: "문자열을 뒤집어 반환하는 함수 `reverseString(s)`을 작성하세요.",
    constraints: ["내장 reverse() 사용 가능", "빈 문자열은 빈 문자열 반환"],
    starterCode: `function reverseString(s) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"hello"', expected: '"olleh"' },
      { input: '"world"', expected: '"dlrow"' },
      { input: '""', expected: '""' },
      { input: '"a"', expected: '"a"', hidden: true },
    ],
    validate(code) { return jsValidate(code, "reverseString", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden }))); },
  },
  {
    id: "ch-count-vowels", title: "모음 개수 세기", difficulty: "easy", language: "javascript",
    description: "문자열에서 모음(a, e, i, o, u)의 개수를 반환하는 함수 `countVowels(s)`을 작성하세요. 대소문자 구분 없음.",
    constraints: ["대소문자 무시", "모음: a, e, i, o, u"],
    starterCode: `function countVowels(s) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"hello"', expected: "2" },
      { input: '"AEIOU"', expected: "5" },
      { input: '"xyz"', expected: "0" },
      { input: '"Programming"', expected: "3", hidden: true },
    ],
    validate(code) { return jsValidate(code, "countVowels", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden }))); },
  },
  {
    id: "ch-capitalize", title: "단어 첫 글자 대문자", difficulty: "easy", language: "javascript",
    description: "문자열의 각 단어 첫 글자를 대문자로 변환하는 함수 `capitalize(s)`을 작성하세요.",
    constraints: ["단어는 공백으로 구분", "나머지 글자는 소문자"],
    starterCode: `function capitalize(s) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"hello world"', expected: '"Hello World"' },
      { input: '"javaScript is fun"', expected: '"Javascript Is Fun"' },
      { input: '""', expected: '""' },
      { input: '"a"', expected: '"A"', hidden: true },
    ],
    validate(code) { return jsValidate(code, "capitalize", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden }))); },
  },

  // ── Round 2: 배열 ──
  {
    id: "ch-unique", title: "배열 중복 제거", difficulty: "easy", language: "javascript",
    description: "배열에서 중복을 제거하고 원래 순서를 유지한 새 배열을 반환하는 함수 `unique(arr)`을 작성하세요.",
    constraints: ["원래 순서 유지", "Set 사용 가능"],
    starterCode: `function unique(arr) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[1,2,2,3,3,3]", expected: "[1,2,3]" },
      { input: '["a","b","a"]', expected: '["a","b"]' },
      { input: "[]", expected: "[]" },
      { input: "[1]", expected: "[1]", hidden: true },
    ],
    validate(code) { return jsValidate(code, "unique", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden }))); },
  },
  {
    id: "ch-chunk", title: "배열 청크 나누기", difficulty: "medium", language: "javascript",
    description: "배열을 주어진 크기의 청크로 나누는 함수 `chunk(arr, size)`를 작성하세요.",
    constraints: ["마지막 청크는 size보다 작을 수 있음", "size는 1 이상"],
    starterCode: `function chunk(arr, size) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[1,2,3,4,5], 2", expected: "[[1,2],[3,4],[5]]" },
      { input: "[1,2,3], 3", expected: "[[1,2,3]]" },
      { input: "[1,2,3], 1", expected: "[[1],[2],[3]]" },
      { input: "[], 2", expected: "[]", hidden: true },
    ],
    validate(code) { return jsValidate(code, "chunk", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden }))); },
  },
  {
    id: "ch-intersection", title: "배열 교집합", difficulty: "medium", language: "javascript",
    description: "두 배열의 교집합을 반환하는 함수 `intersection(a, b)`을 작성하세요. 결과에 중복 없이.",
    constraints: ["결과에 중복 없음", "순서 무관"],
    starterCode: `function intersection(a, b) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[1,2,3], [2,3,4]", expected: "[2,3]" },
      { input: "[1,1,2], [2,2,3]", expected: "[2]" },
      { input: "[], [1,2]", expected: "[]" },
      { input: "[5,5,5], [5]", expected: "[5]", hidden: true },
    ],
    validate(code) {
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn intersection;")();
        const cases = [
          { a: [1,2,3], b: [2,3,4], expected: [2,3] },
          { a: [1,1,2], b: [2,2,3], expected: [2] },
          { a: [] as number[], b: [1,2], expected: [] as number[] },
          { a: [5,5,5], b: [5], expected: [5] },
        ];
        for (let i = 0; i < cases.length; i++) {
          const c = cases[i];
          const tc = this.testCases[i];
          const res = fn(c.a, c.b);
          const actual = JSON.stringify(res?.sort());
          const expected = JSON.stringify(c.expected.sort());
          results.push({ input: tc.input, expected: tc.expected, actual: JSON.stringify(res), passed: actual === expected, hidden: tc.hidden });
        }
      } catch (e) {
        for (const tc of this.testCases) results.push({ input: tc.input, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
      }
      return { passed: results.every(r => r.passed), results };
    },
  },

  // ── Round 3: 객체/맵 ──
  {
    id: "ch-word-count", title: "단어 빈도수", difficulty: "medium", language: "javascript",
    description: "문자열에서 각 단어의 등장 횟수를 객체로 반환하는 함수 `wordCount(s)`을 작성하세요.",
    constraints: ["소문자로 통일", "단어는 공백으로 구분"],
    starterCode: `function wordCount(s) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '"hello hello world"', expected: '{"hello":2,"world":1}' },
      { input: '"a b a b a"', expected: '{"a":3,"b":2}' },
      { input: '""', expected: '{}' },
      { input: '"test"', expected: '{"test":1}', hidden: true },
    ],
    validate(code) { return jsValidate(code, "wordCount", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden }))); },
  },
  {
    id: "ch-group-by", title: "배열 그룹핑", difficulty: "medium", language: "javascript",
    description: "배열의 요소를 주어진 함수의 반환값으로 그룹핑하는 함수 `groupBy(arr, fn)`을 작성하세요.",
    constraints: ["fn은 요소를 받아 키를 반환", "결과는 { key: [elements] } 형태"],
    starterCode: `function groupBy(arr, fn) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[1,2,3,4,5,6], (n) => n % 2 === 0 ? 'even' : 'odd'", expected: '{"odd":[1,3,5],"even":[2,4,6]}' },
      { input: '["hi","hey","hello"], (s) => s[0]', expected: '{"h":["hi","hey","hello"]}' },
      { input: "[], (x) => x", expected: "{}", hidden: true },
    ],
    validate(code) {
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn groupBy;")();
        const c1 = fn([1,2,3,4,5,6], (n: number) => n % 2 === 0 ? "even" : "odd");
        results.push({ input: this.testCases[0].input, expected: this.testCases[0].expected, actual: JSON.stringify(c1), passed: JSON.stringify(c1) === this.testCases[0].expected });
        const c2 = fn(["hi","hey","hello"], (s: string) => s[0]);
        results.push({ input: this.testCases[1].input, expected: this.testCases[1].expected, actual: JSON.stringify(c2), passed: JSON.stringify(c2) === this.testCases[1].expected });
        const c3 = fn([], (x: unknown) => x);
        results.push({ input: this.testCases[2].input, expected: this.testCases[2].expected, actual: JSON.stringify(c3), passed: JSON.stringify(c3) === "{}", hidden: true });
      } catch (e) {
        for (const tc of this.testCases) results.push({ input: tc.input, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
      }
      return { passed: results.every(r => r.passed), results };
    },
  },

  // ── Round 4: 재귀/수학 ──
  {
    id: "ch-fibonacci", title: "피보나치 수열", difficulty: "medium", language: "javascript",
    description: "n번째 피보나치 수를 반환하는 함수 `fibonacci(n)`을 작성하세요.\nfib(0)=0, fib(1)=1, fib(n)=fib(n-1)+fib(n-2)",
    constraints: ["n >= 0", "효율적인 구현 권장 (메모이제이션 등)"],
    starterCode: `function fibonacci(n) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "0", expected: "0" },
      { input: "1", expected: "1" },
      { input: "10", expected: "55" },
      { input: "20", expected: "6765", hidden: true },
    ],
    validate(code) { return jsValidate(code, "fibonacci", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden }))); },
  },
  {
    id: "ch-power", title: "거듭제곱 구현", difficulty: "medium", language: "javascript",
    description: "Math.pow 없이 x의 n제곱을 구하는 함수 `power(x, n)`을 작성하세요.",
    constraints: ["n은 0 이상 정수", "Math.pow, ** 연산자 사용 금지"],
    starterCode: `function power(x, n) {\n  // Math.pow, ** 사용 금지!\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "2, 10", expected: "1024" },
      { input: "3, 0", expected: "1" },
      { input: "5, 3", expected: "125" },
      { input: "2, 20", expected: "1048576", hidden: true },
    ],
    validate(code) {
      if (code.includes("Math.pow") || code.includes("**")) {
        return { passed: false, results: this.testCases.map(tc => ({ input: tc.input, expected: tc.expected, actual: "Math.pow/** 사용 금지!", passed: false, hidden: tc.hidden })) };
      }
      return jsValidate(code, "power", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden })));
    },
  },
  {
    id: "ch-gcd", title: "최대공약수 (GCD)", difficulty: "easy", language: "javascript",
    description: "두 양의 정수의 최대공약수를 반환하는 함수 `gcd(a, b)`을 작성하세요.",
    constraints: ["유클리드 호제법 사용 권장", "a, b > 0"],
    starterCode: `function gcd(a, b) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "12, 8", expected: "4" },
      { input: "100, 75", expected: "25" },
      { input: "7, 13", expected: "1" },
      { input: "48, 18", expected: "6", hidden: true },
    ],
    validate(code) { return jsValidate(code, "gcd", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden }))); },
  },

  // ── Round 5: 고급 ──
  {
    id: "ch-debounce", title: "디바운스 구현", difficulty: "hard", language: "javascript",
    description: "함수 호출을 지연시키는 `debounce(fn, delay)` 함수를 작성하세요.\n마지막 호출 후 delay(ms)가 지나야 fn이 실행됩니다.",
    constraints: ["clearTimeout 사용", "연속 호출 시 이전 타이머 취소", "this 바인딩 유지"],
    starterCode: `function debounce(fn, delay) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "() => 1, 100", expected: "function" },
    ],
    validate(code) {
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn debounce;")();
        const result = fn(() => 1, 100);
        const isFunc = typeof result === "function";
        results.push({ input: "() => 1, 100", expected: "function", actual: typeof result, passed: isFunc });
        // 타이머 ID 확인
        let called = 0;
        const debounced = fn(() => { called++; }, 50);
        debounced(); debounced(); debounced();
        results.push({ input: "3회 연속 호출 직후", expected: "0", actual: String(called), passed: called === 0 });
      } catch (e) {
        results.push({ input: "() => 1, 100", expected: "function", actual: `Error: ${e}`, passed: false });
      }
      return { passed: results.every(r => r.passed), results };
    },
  },
  {
    id: "ch-deep-clone", title: "깊은 복사", difficulty: "hard", language: "javascript",
    description: "객체를 깊은 복사하는 함수 `deepClone(obj)`을 작성하세요.\nJSON.parse/stringify 사용 금지.",
    constraints: ["JSON 메서드 사용 금지", "중첩 객체/배열 지원", "원시값은 그대로 반환"],
    starterCode: `function deepClone(obj) {\n  // JSON.parse/stringify 사용 금지!\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: '{"a":1,"b":{"c":2}}', expected: '{"a":1,"b":{"c":2}}' },
      { input: "[1,[2,[3]]]", expected: "[1,[2,[3]]]" },
      { input: "null", expected: "null" },
      { input: "42", expected: "42", hidden: true },
    ],
    validate(code) {
      if (code.includes("JSON.parse") || code.includes("JSON.stringify")) {
        return { passed: false, results: this.testCases.map(tc => ({ input: tc.input, expected: tc.expected, actual: "JSON 사용 금지!", passed: false, hidden: tc.hidden })) };
      }
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn deepClone;")();
        const cases = [{ a: 1, b: { c: 2 } }, [1, [2, [3]]], null, 42];
        for (let i = 0; i < cases.length; i++) {
          const tc = this.testCases[i];
          const result = fn(cases[i]);
          const actual = JSON.stringify(result);
          const passed = actual === tc.expected;
          // 깊은 복사 확인 (참조 다른지)
          if (i === 0 && passed && result === cases[i]) {
            results.push({ input: tc.input, expected: tc.expected, actual: "얕은 복사!", passed: false, hidden: tc.hidden });
          } else {
            results.push({ input: tc.input, expected: tc.expected, actual: actual ?? "undefined", passed, hidden: tc.hidden });
          }
        }
      } catch (e) {
        for (const tc of this.testCases) results.push({ input: tc.input, expected: tc.expected, actual: `Error: ${e}`, passed: false, hidden: tc.hidden });
      }
      return { passed: results.every(r => r.passed), results };
    },
  },
  {
    id: "ch-curry", title: "커링 함수", difficulty: "hard", language: "javascript",
    description: "함수를 커링하는 `curry(fn)` 함수를 작성하세요.\ncurry(fn)(a)(b)(c) === fn(a, b, c)",
    constraints: ["fn.length로 인자 수 확인", "인자가 충분하면 원래 함수 호출"],
    starterCode: `function curry(fn) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "(a,b,c) => a+b+c, then (1)(2)(3)", expected: "6" },
      { input: "(a,b) => a*b, then (3)(4)", expected: "12" },
    ],
    validate(code) {
      const results: TestResult[] = [];
      try {
        const fn = new Function(code + "\nreturn curry;")();
        const add = fn((a: number, b: number, c: number) => a + b + c);
        const r1 = add(1)(2)(3);
        results.push({ input: this.testCases[0].input, expected: "6", actual: String(r1), passed: r1 === 6 });
        const mul = fn((a: number, b: number) => a * b);
        const r2 = mul(3)(4);
        results.push({ input: this.testCases[1].input, expected: "12", actual: String(r2), passed: r2 === 12 });
      } catch (e) {
        for (const tc of this.testCases) results.push({ input: tc.input, expected: tc.expected, actual: `Error: ${e}`, passed: false });
      }
      return { passed: results.every(r => r.passed), results };
    },
  },
  {
    id: "ch-binary-search", title: "이진 탐색", difficulty: "medium", language: "javascript",
    description: "정렬된 배열에서 target의 인덱스를 반환하는 함수 `binarySearch(arr, target)`을 작성하세요.\n없으면 -1 반환.",
    constraints: ["O(log n) 시간복잡도", "indexOf 사용 금지"],
    starterCode: `function binarySearch(arr, target) {\n  // indexOf 사용 금지!\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[1,3,5,7,9], 5", expected: "2" },
      { input: "[1,3,5,7,9], 4", expected: "-1" },
      { input: "[2,4,6,8], 8", expected: "3" },
      { input: "[], 1", expected: "-1", hidden: true },
    ],
    validate(code) {
      if (code.includes(".indexOf(")) {
        return { passed: false, results: this.testCases.map(tc => ({ input: tc.input, expected: tc.expected, actual: "indexOf 사용 금지!", passed: false, hidden: tc.hidden })) };
      }
      return jsValidate(code, "binarySearch", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden })));
    },
  },
  {
    id: "ch-max-subarray", title: "최대 부분합 (Kadane)", difficulty: "hard", language: "javascript",
    description: "정수 배열에서 연속 부분 배열의 최대 합을 반환하는 함수 `maxSubarraySum(arr)`을 작성하세요.",
    constraints: ["Kadane's Algorithm 권장", "배열 길이 1 이상", "음수만 있을 수 있음"],
    starterCode: `function maxSubarraySum(arr) {\n  // 여기에 코드를 작성하세요\n}`,
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expected: "6" },
      { input: "[1]", expected: "1" },
      { input: "[-1,-2,-3]", expected: "-1" },
      { input: "[5,4,-1,7,8]", expected: "23", hidden: true },
    ],
    validate(code) { return jsValidate(code, "maxSubarraySum", this.testCases.map(tc => ({ args: tc.input, expected: tc.expected, hidden: tc.hidden }))); },
  },
];
