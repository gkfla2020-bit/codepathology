import { useState, useEffect, useMemo, ReactNode, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../stores/useStore";
import { login, register, getMe } from "../services/api";
import { useInView } from "../hooks/useInView";

const DEMO_ACCOUNTS = [
  { label: "Instructor Account", email: "prof@sogang.ac.kr", role: "instructor", desc: "전체 대시보드 분석" },
  { label: "Student 1 — 이민수", email: "s1@sogang.ac.kr", role: "student", desc: "경계값 처리 오류" },
  { label: "Student 2 — 박지현", email: "s2@sogang.ac.kr", role: "student", desc: "Null 체크 누락" },
  { label: "Student 3 — 최영호", email: "s3@sogang.ac.kr", role: "student", desc: "정상 코드" },
  { label: "Student 4 — 정수아", email: "s4@sogang.ac.kr", role: "student", desc: "무한 루프" },
  { label: "Student 5 — 한도윤", email: "s5@sogang.ac.kr", role: "student", desc: "예외 처리 누락" },
];

/* ---------------- Reveal wrapper ---------------- */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-out will-change-transform ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------------- Feature card ---------------- */
interface FeatureCardProps {
  index: number;
  tag: string;
  title: string;
  tagline: string;
  description: string;
  howto: string;
  reverse?: boolean;
  accent: string;
  visual: ReactNode;
}

function FeatureCard({
  index,
  tag,
  title,
  tagline,
  description,
  howto,
  reverse = false,
  accent,
  visual,
}: FeatureCardProps) {
  return (
    <Reveal>
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center py-16 lg:py-24 ${
          reverse ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        {/* Text side */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-mono text-txt-tertiary">
              {String(index).padStart(2, "0")} / FEATURE
            </span>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${accent}18`, color: accent }}
            >
              {tag}
            </span>
          </div>
          <h3 className="text-3xl lg:text-4xl font-extrabold text-txt-primary leading-tight mb-4 tracking-tight">
            {title}
          </h3>
          <p className="text-lg text-txt-secondary leading-relaxed mb-6">
            {tagline}
          </p>
          <p className="text-sm text-txt-secondary leading-loose mb-7">
            {description}
          </p>
          <div className="bg-bg-card border border-line-primary rounded-2xl p-5">
            <p className="text-[11px] font-bold text-toss-blue mb-2 tracking-wide">
              사용 방법
            </p>
            <p className="text-xs text-txt-secondary leading-relaxed whitespace-pre-line">
              {howto}
            </p>
          </div>
        </div>

        {/* Visual side */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-20"
            style={{ backgroundColor: accent }}
          />
          <div className="relative bg-bg-card border border-line-primary rounded-3xl p-6 overflow-hidden">
            {visual}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- Visuals (inline SVG / mock UI) ---------------- */
const HINTS_CYCLE = [
  { lvl: 1, line: 12, msg: "현재 조건문이 범위의 경계값을 포함하는지 검토가 필요합니다." },
  { lvl: 2, line: 12, msg: "i < n 과 i <= n 중 현재 컨텍스트에 적합한 조건은 무엇입니까?" },
  { lvl: 3, line: 12, msg: "n=5 일 때 배열의 마지막 인덱스 접근 방식을 추적해보세요." },
];

function HintVisual() {
  const [visibleCount, setVisibleCount] = useState(1);
  const [autoTick, setAutoTick] = useState(0);
  const [justClicked, setJustClicked] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setVisibleCount((c) => (c >= HINTS_CYCLE.length ? 1 : c + 1));
    }, 2400);
    return () => clearInterval(id);
  }, [autoTick]);

  const handleClick = () => {
    setVisibleCount((c) => (c >= HINTS_CYCLE.length ? 1 : c + 1));
    setAutoTick((t) => t + 1);
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 500);
  };

  const isMaxed = visibleCount >= HINTS_CYCLE.length;

  return (
    <div className="space-y-2.5 min-h-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-toss-blue animate-pulse" />
        <p className="text-[11px] font-bold text-toss-blue">AI HINT CHAT · LIVE</p>
      </div>
      {HINTS_CYCLE.slice(0, visibleCount).map((h) => (
        <div key={h.lvl} className="bg-bg-elevated rounded-xl p-3 animate-slide-up">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-toss-blue bg-toss-blue-dim px-2 py-0.5 rounded-lg">
              Level {h.lvl}
            </span>
            <span className="text-[10px] text-txt-tertiary">Line {h.line}</span>
          </div>
          <p className="text-xs text-txt-secondary leading-relaxed">{h.msg}</p>
        </div>
      ))}
      {!isMaxed && (
        <div className="flex items-center gap-1.5 px-3 pt-1">
          <span className="w-1 h-1 rounded-full bg-toss-blue animate-pulse" />
          <span className="w-1 h-1 rounded-full bg-toss-blue animate-pulse" style={{ animationDelay: "0.15s" }} />
          <span className="w-1 h-1 rounded-full bg-toss-blue animate-pulse" style={{ animationDelay: "0.3s" }} />
          <span className="text-[10px] text-txt-tertiary ml-1">
            Level {visibleCount + 1} 힌트 요청 가능
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        className={`w-full py-2 bg-toss-blue/20 border border-toss-blue/30 rounded-xl text-[11px] font-bold text-toss-blue mt-1 transition-all ${
          justClicked ? "scale-[0.97] bg-toss-blue/40" : ""
        }`}
        style={{
          boxShadow: justClicked ? "0 0 14px rgba(49, 130, 246, 0.6)" : "none",
        }}
      >
        {isMaxed ? "다시 보기" : "다음 힌트 보기"}
      </button>
    </div>
  );
}

const PATTERN_LIBRARY = [
  {
    name: "경계값 처리 오류",
    sev: "HIGH",
    color: "#F5A623",
    symptom: "for (i=0; i<n; i++) 구문에서 마지막 인덱스 누락이 검출되었습니다 (line 12)",
    cause: "범위의 양 끝점(0, n-1)에 대한 명시적 검토가 이루어지지 않은 것으로 분석됩니다",
    rx: "i=0, i=n-1, i=n+1 세 가지 경계 케이스에 대한 시뮬레이션 후 코드 재검토 권장",
  },
  {
    name: "Null 체크 누락",
    sev: "MEDIUM",
    color: "#3182F6",
    symptom: "외부 입력 obj.field에 대한 직접 접근이 검출되었습니다 (line 24, 31)",
    cause: "데이터 가용성에 대한 암묵적 전제가 코드 전반에 적용되어 있습니다",
    rx: "외부 입력 처리 구문에 if (obj) 가드 또는 옵셔널 체이닝(?.) 패턴 적용 권장",
  },
  {
    name: "중첩 반복문 남용",
    sev: "LOW",
    color: "#555555",
    symptom: "3중 중첩 반복문으로 O(n³) 시간 복잡도가 형성되었습니다 (line 40-58)",
    cause: "각 반복 계층의 책임 분리 없이 루프가 누적된 구조입니다",
    rx: "Set/Map 자료구조를 활용해 내부 루프를 O(1) 조회로 치환하는 리팩터링 권장",
  },
  {
    name: "예외 처리 누락",
    sev: "HIGH",
    color: "#F5A623",
    symptom: "외부 API/파일 호출에 try-catch 블록이 적용되지 않았습니다 (line 17)",
    cause: "예외 상황에 대한 우선순위가 후순위로 설정된 코드 작성 패턴이 관찰됩니다",
    rx: "외부 호출 구문마다 실패 시나리오를 명시적으로 정의하고 처리 로직 추가 권장",
  },
];

function PatternVisual() {
  const [counts, setCounts] = useState([4, 2, 1, 0]);
  const [flashIdx, setFlashIdx] = useState(-1);
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [autoCycleTick, setAutoCycleTick] = useState(0);

  // count flash animation
  useEffect(() => {
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * PATTERN_LIBRARY.length);
      setFlashIdx(idx);
      setCounts((cs) => cs.map((c, i) => (i === idx ? c + 1 : c)));
      const t = setTimeout(() => setFlashIdx(-1), 450);
      return () => clearTimeout(t);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  // auto-cycle expanded pattern (resets when user clicks)
  useEffect(() => {
    const id = setInterval(() => {
      setExpandedIdx((i) => (i + 1) % PATTERN_LIBRARY.length);
    }, 3200);
    return () => clearInterval(id);
  }, [autoCycleTick]);

  const total = counts.reduce((a, b) => a + b, 0);
  const expanded = PATTERN_LIBRARY[expandedIdx];

  return (
    <div className="space-y-2 min-h-[420px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-txt-tertiary">CODE PATTERNS</p>
        <p className="text-[10px] text-toss-blue font-mono">{total} ISSUES</p>
      </div>
      {PATTERN_LIBRARY.map((p, i) => {
        const isFlash = flashIdx === i;
        const isExpanded = expandedIdx === i;
        return (
          <div key={p.name}>
            <button
              type="button"
              onClick={() => {
                setExpandedIdx(i);
                setAutoCycleTick((t) => t + 1);
              }}
              className={`w-full rounded-xl p-3 flex items-center justify-between transition-all duration-500 ${
                isFlash ? "scale-[1.02]" : ""
              }`}
              style={{
                backgroundColor: isExpanded
                  ? `${p.color}22`
                  : isFlash
                    ? `${p.color}18`
                    : "#242424",
                boxShadow: isExpanded
                  ? `0 0 0 1px ${p.color}80`
                  : isFlash
                    ? `0 0 0 1px ${p.color}60`
                    : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full transition-all ${
                    isFlash || isExpanded ? "scale-150" : ""
                  }`}
                  style={{ backgroundColor: p.color }}
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-txt-primary">{p.name}</p>
                  <p className="text-[10px] text-txt-tertiary">{p.sev}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-extrabold transition-all duration-300 ${
                    isFlash ? "text-status-danger scale-125" : "text-txt-primary"
                  }`}
                >
                  x{counts[i]}
                </span>
                <span
                  className="text-[10px] text-txt-tertiary transition-transform duration-300"
                  style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}
                >
                  ▾
                </span>
              </div>
            </button>
          </div>
        );
      })}

      {/* Expanded detail panel */}
      <div
        key={`detail-${expandedIdx}`}
        className="mt-3 rounded-xl border p-3 space-y-2 animate-fade-in"
        style={{
          backgroundColor: `${expanded.color}10`,
          borderColor: `${expanded.color}40`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: expanded.color }} />
          <p className="text-[10px] font-bold tracking-wider" style={{ color: expanded.color }}>
            {expanded.name.toUpperCase()} · DETAIL
          </p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[9px] text-txt-tertiary mb-0.5 font-bold">SYMPTOM</p>
          <p className="text-[11px] text-txt-secondary leading-relaxed">{expanded.symptom}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[9px] text-toss-blue mb-0.5 font-bold">ROOT CAUSE</p>
          <p className="text-[11px] text-txt-secondary leading-relaxed">{expanded.cause}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[9px] text-status-safe mb-0.5 font-bold">PRESCRIPTION</p>
          <p className="text-[11px] text-txt-secondary leading-relaxed">{expanded.rx}</p>
        </div>
      </div>
    </div>
  );
}

function GrowthVisual() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(id);
  }, []);

  const { resolvedPath, resolvedFill, activePath, activeFill, resolvedPts, activePts } = useMemo(() => {
    const xs = [10, 103, 196, 290];
    const rY = xs.map((_, i) => {
      const base = 100 - i * 22;
      return Math.max(25, Math.min(115, base + Math.sin(tick * 0.7 + i * 1.3) * 10));
    });
    const aY = xs.map((_, i) => {
      const base = 55 + i * 15;
      return Math.max(25, Math.min(115, base + Math.cos(tick * 0.5 + i * 0.9) * 10));
    });
    const smooth = (ys: number[]) => {
      let d = `M ${xs[0]} ${ys[0]}`;
      for (let i = 0; i < xs.length - 1; i++) {
        const cx = (xs[i] + xs[i + 1]) / 2;
        d += ` Q ${cx} ${ys[i]}, ${cx} ${(ys[i] + ys[i + 1]) / 2} T ${xs[i + 1]} ${ys[i + 1]}`;
      }
      return d;
    };
    const rPath = smooth(rY);
    const aPath = smooth(aY);
    return {
      resolvedPath: rPath,
      resolvedFill: `${rPath} L ${xs[3]} 140 L ${xs[0]} 140 Z`,
      activePath: aPath,
      activeFill: `${aPath} L ${xs[3]} 140 L ${xs[0]} 140 Z`,
      resolvedPts: xs.map((x, i) => ({ x, y: rY[i] })),
      activePts: xs.map((x, i) => ({ x, y: aY[i] })),
    };
  }, [tick]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-txt-tertiary">PROGRESS · LAST 4 WEEKS</p>
        <span className="text-[10px] text-status-safe font-bold">LIVE</span>
      </div>
      <svg viewBox="0 0 300 140" className="w-full">
        <defs>
          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1CD98C" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1CD98C" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F45452" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F45452" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={resolvedFill} fill="url(#growthGrad)" style={{ transition: "d 1.6s ease" }} />
        <path
          d={resolvedPath}
          fill="none"
          stroke="#1CD98C"
          strokeWidth="2.5"
          style={{ transition: "d 1.6s ease" }}
        />
        <path d={activeFill} fill="url(#activeGrad)" style={{ transition: "d 1.6s ease" }} />
        <path
          d={activePath}
          fill="none"
          stroke="#F45452"
          strokeWidth="2.5"
          style={{ transition: "d 1.6s ease" }}
        />
        {resolvedPts.map((p, i) => (
          <circle
            key={`r${i}`}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#1CD98C"
            style={{ transition: "cy 1.6s ease" }}
          />
        ))}
        {activePts.map((p, i) => (
          <circle
            key={`a${i}`}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#F45452"
            style={{ transition: "cy 1.6s ease" }}
          />
        ))}
        {["W1", "W2", "W3", "W4"].map((w, i) => (
          <text
            key={w}
            x={10 + i * 93}
            y={135}
            fontSize="9"
            fill="#555"
            textAnchor="middle"
          >
            {w}
          </text>
        ))}
      </svg>
      <div className="flex gap-4 mt-3 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-safe" />
          <span className="text-txt-tertiary">RESOLVED</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-danger" />
          <span className="text-txt-tertiary">IN PROGRESS</span>
        </div>
      </div>
    </div>
  );
}

const LEARNING_TASKS = [
  {
    title: "이분 탐색 경계 조건 실습",
    min: 15,
    goal: "정렬 배열에서 i < n 과 i <= n 조건의 차이를 구현 단위로 검증합니다",
    code: `def search(arr, target):
  lo, hi = 0, len(arr) - 1
  while lo <= hi:  # 핵심 조건부
    mid = (lo + hi) // 2
    ...`,
  },
  {
    title: "Null-safe 패턴 적용 실습",
    min: 10,
    goal: "외부 입력 처리 시 방어적 프로그래밍 패턴을 체화합니다",
    code: `// Unsafe access
const name = user.profile.name;

// Safe access with optional chaining
const name = user?.profile?.name ?? "Anonymous";`,
  },
  {
    title: "반복문 시간 복잡도 최적화",
    min: 20,
    goal: "중첩 반복문을 Set/Map으로 치환하여 O(n²) → O(n) 개선을 수행합니다",
    code: `// Before: O(n²)
for x in arr1:
  for y in arr2:
    if x == y: ...

// After: O(n)
common = set(arr1) & set(arr2)`,
  },
];

function LearningVisual() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [autoTick, setAutoTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % LEARNING_TASKS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [autoTick]);

  const expanded = LEARNING_TASKS[activeIdx];

  return (
    <div className="space-y-2 min-h-[420px]">
      <p className="text-[11px] font-bold text-txt-tertiary mb-3">RECOMMENDED TASKS · TODAY</p>
      {LEARNING_TASKS.map((t, i) => {
        const active = activeIdx === i;
        return (
          <button
            type="button"
            key={t.title}
            onClick={() => {
              setActiveIdx(i);
              setAutoTick((x) => x + 1);
            }}
            className={`w-full rounded-xl p-3 flex items-center gap-3 transition-all duration-500 ${
              active ? "scale-[1.02]" : ""
            }`}
            style={{
              backgroundColor: active ? "rgba(49, 130, 246, 0.12)" : "#242424",
              boxShadow: active ? "0 0 0 1px rgba(49, 130, 246, 0.45)" : "none",
            }}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                active ? "bg-toss-blue text-white" : "bg-toss-blue-dim text-toss-blue"
              }`}
            >
              {i + 1}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-txt-primary">{t.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-txt-tertiary">{t.min} MIN</p>
                {active && (
                  <div className="flex items-center gap-1 animate-fade-in">
                    <span className="w-1 h-1 rounded-full bg-status-safe animate-pulse" />
                    <span className="text-[9px] text-status-safe font-bold">SELECTED</span>
                  </div>
                )}
              </div>
            </div>
            <span
              className={`text-xs transition-all ${
                active ? "text-toss-blue translate-x-1" : "text-txt-tertiary"
              }`}
            >
              →
            </span>
          </button>
        );
      })}

      {/* Expanded preview */}
      <div
        key={`learn-${activeIdx}`}
        className="mt-3 rounded-xl border border-toss-blue/40 bg-toss-blue-dimmer p-3 animate-fade-in"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-toss-blue" />
          <p className="text-[10px] font-bold text-toss-blue tracking-wider">
            TASK DETAIL
          </p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5 mb-2">
          <p className="text-[9px] text-txt-tertiary mb-0.5 font-bold">LEARNING OBJECTIVE</p>
          <p className="text-[11px] text-txt-secondary leading-relaxed">{expanded.goal}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[9px] text-status-safe mb-1 font-bold">SAMPLE CODE</p>
          <pre className="text-[10px] text-txt-secondary font-mono leading-relaxed overflow-x-auto whitespace-pre">
            {expanded.code}
          </pre>
        </div>
      </div>
    </div>
  );
}

const STUDENT_DETAILS: Record<string, { line: number; lastAction: string; pattern: string }> = {
  safe: { line: 42, lastAction: "신규 함수 정의 완료", pattern: "정상 진행 중" },
  warn: { line: 18, lastAction: "동일 라인에서 30초 정체", pattern: "조건문 분기 정체" },
  danger: { line: 12, lastAction: "3분 이상 입력 없음", pattern: "경계값 처리 정체" },
};

function MonitorVisual() {
  const [states, setStates] = useState<string[]>([
    "safe", "safe", "warn", "safe", "danger", "safe", "warn", "safe", "safe",
  ]);
  const [changedIdx, setChangedIdx] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(4);
  const [autoTick, setAutoTick] = useState(0);

  // status flip animation
  useEffect(() => {
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * 9);
      const pool = ["safe", "safe", "safe", "safe", "warn", "warn", "danger"];
      const next = pool[Math.floor(Math.random() * pool.length)];
      setStates((arr) => {
        const copy = [...arr];
        copy[idx] = next;
        return copy;
      });
      setChangedIdx(idx);
      const t = setTimeout(() => setChangedIdx(-1), 600);
      return () => clearTimeout(t);
    }, 1100);
    return () => clearInterval(id);
  }, []);

  // auto-cycle selected student
  useEffect(() => {
    const id = setInterval(() => {
      setSelectedIdx((i) => (i + 1) % 9);
    }, 2400);
    return () => clearInterval(id);
  }, [autoTick]);

  const selectedStatus = states[selectedIdx];
  const selectedColor =
    selectedStatus === "safe" ? "#1CD98C" : selectedStatus === "warn" ? "#F5A623" : "#F45452";
  const selectedDetail = STUDENT_DETAILS[selectedStatus];

  return (
    <div className="min-h-[360px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-txt-tertiary">LIVE ACTIVITY · 9 STUDENTS</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
          <span className="text-[10px] text-status-safe font-bold">LIVE</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {states.map((s, i) => {
          const color = s === "safe" ? "#1CD98C" : s === "warn" ? "#F5A623" : "#F45452";
          const isChanged = changedIdx === i;
          const isSelected = selectedIdx === i;
          return (
            <button
              type="button"
              key={i}
              onClick={() => {
                setSelectedIdx(i);
                setAutoTick((t) => t + 1);
              }}
              className={`rounded-lg p-3 text-center border transition-all duration-500 ${
                isChanged || isSelected ? "scale-[1.08]" : ""
              }`}
              style={{
                backgroundColor: isSelected ? `${color}30` : isChanged ? `${color}22` : "#242424",
                borderColor: isSelected ? color : isChanged ? color : `${color}30`,
                boxShadow: isSelected
                  ? `0 0 16px ${color}60`
                  : isChanged
                    ? `0 0 12px ${color}40`
                    : "none",
              }}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full mx-auto mb-1.5 transition-all ${
                  s === "danger" ? "animate-pulse" : ""
                }`}
                style={{ backgroundColor: color }}
              />
              <p className="text-[10px] text-txt-tertiary">Student {i + 1}</p>
              <p
                className="text-[9px] mt-0.5 font-bold transition-colors"
                style={{ color }}
              >
                {s === "danger" ? "STALLED" : s === "warn" ? "PAUSED" : "ACTIVE"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected student preview */}
      <div
        key={`mon-${selectedIdx}-${selectedStatus}`}
        className="mt-3 rounded-xl border p-3 animate-fade-in"
        style={{
          backgroundColor: `${selectedColor}10`,
          borderColor: `${selectedColor}40`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedColor }} />
          <p className="text-[10px] font-bold tracking-wider" style={{ color: selectedColor }}>
            STUDENT {selectedIdx + 1} · DETAIL
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-bg-primary rounded-lg p-2.5">
            <p className="text-[9px] text-txt-tertiary mb-0.5 font-bold">CURRENT LINE</p>
            <p className="text-[11px] text-txt-primary font-mono">Line {selectedDetail.line}</p>
          </div>
          <div className="bg-bg-primary rounded-lg p-2.5">
            <p className="text-[9px] text-txt-tertiary mb-0.5 font-bold">STATUS</p>
            <p className="text-[11px]" style={{ color: selectedColor }}>{selectedDetail.pattern}</p>
          </div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5 mt-2">
          <p className="text-[9px] text-txt-tertiary mb-0.5 font-bold">LAST ACTIVITY</p>
          <p className="text-[11px] text-txt-secondary leading-relaxed">{selectedDetail.lastAction}</p>
        </div>
      </div>
    </div>
  );
}

const HEATMAP_BASE = [
  {
    name: "경계값 처리 오류",
    color: "#F45452",
    affected: 14,
    avgPerStudent: 2.4,
    sample: "for (i=0; i<n; i++) 구문에서 i<=n 케이스 누락",
  },
  {
    name: "Null 체크 누락",
    color: "#F5A623",
    affected: 9,
    avgPerStudent: 1.6,
    sample: "obj.field 직접 접근 (옵셔널 체이닝 미적용)",
  },
  {
    name: "중첩 반복문 남용",
    color: "#3182F6",
    affected: 6,
    avgPerStudent: 1.2,
    sample: "3중 for문 구조로 O(n³) 시간 복잡도 형성",
  },
  {
    name: "비표준 식별자 사용",
    color: "#555555",
    affected: 4,
    avgPerStudent: 1.0,
    sample: "i, j 대신 i1, i2 등 의미 불명확한 식별자 사용",
  },
];

function HeatmapVisual() {
  const [pcts, setPcts] = useState([78, 54, 32, 18]);
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [autoTick, setAutoTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPcts((prev) =>
        prev.map((p) => {
          const next = p + (Math.random() - 0.5) * 22;
          return Math.max(10, Math.min(92, Math.round(next)));
        })
      );
    }, 1600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setExpandedIdx((i) => (i + 1) % HEATMAP_BASE.length);
    }, 2800);
    return () => clearInterval(id);
  }, [autoTick]);

  const expanded = HEATMAP_BASE[expandedIdx];

  return (
    <div className="min-h-[360px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-txt-tertiary">PATTERN HEATMAP</p>
        <span className="text-[10px] text-toss-blue font-mono">AUTO-REFRESH</span>
      </div>
      <div className="space-y-2">
        {HEATMAP_BASE.map((r, i) => {
          const isExpanded = expandedIdx === i;
          return (
            <button
              type="button"
              key={r.name}
              onClick={() => {
                setExpandedIdx(i);
                setAutoTick((t) => t + 1);
              }}
              className={`w-full rounded-lg p-2 transition-all ${
                isExpanded ? "bg-bg-elevated" : ""
              }`}
              style={{
                boxShadow: isExpanded ? `0 0 0 1px ${r.color}60` : "none",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-txt-secondary">{r.name}</p>
                <p
                  className="text-[10px] font-mono font-bold transition-all"
                  style={{ color: r.color }}
                >
                  {pcts[i]}%
                </p>
              </div>
              <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pcts[i]}%`,
                    backgroundColor: r.color,
                    transition: "width 1.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    boxShadow: `0 0 8px ${r.color}50`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected pattern preview */}
      <div
        key={`hm-${expandedIdx}`}
        className="mt-3 rounded-xl border p-3 animate-fade-in"
        style={{
          backgroundColor: `${expanded.color}10`,
          borderColor: `${expanded.color}40`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: expanded.color }} />
          <p className="text-[10px] font-bold tracking-wider" style={{ color: expanded.color }}>
            {expanded.name.toUpperCase()} · DETAIL
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-bg-primary rounded-lg p-2.5">
            <p className="text-[9px] text-txt-tertiary mb-0.5 font-bold">AFFECTED</p>
            <p className="text-sm font-extrabold text-txt-primary">
              {expanded.affected}<span className="text-[9px] text-txt-tertiary ml-0.5">students</span>
            </p>
          </div>
          <div className="bg-bg-primary rounded-lg p-2.5">
            <p className="text-[9px] text-txt-tertiary mb-0.5 font-bold">AVG / STUDENT</p>
            <p className="text-sm font-extrabold text-txt-primary">
              {expanded.avgPerStudent}<span className="text-[9px] text-txt-tertiary ml-0.5">times</span>
            </p>
          </div>
        </div>
        <div className="bg-bg-primary rounded-lg p-2.5">
          <p className="text-[9px] text-txt-tertiary mb-0.5 font-bold">SAMPLE SNIPPET</p>
          <p className="text-[11px] text-txt-secondary font-mono leading-relaxed">{expanded.sample}</p>
        </div>
      </div>
    </div>
  );
}

const INSIGHT_SUGGESTIONS = [
  { focus: "경계값 처리", text: "차기 강의에서 경계값 처리 개념의 재강조를 권장합니다" },
  { focus: "Null 체크", text: "Null 체크 누락 빈도가 높습니다. 5분 분량의 보강 세션을 권장합니다" },
  { focus: "루프 종료 조건", text: "무한 루프 패턴이 증가 추세입니다. 루프 검증 체크리스트 배포를 권장합니다" },
];

function InsightVisual() {
  const [idx, setIdx] = useState(0);
  const [avg, setAvg] = useState(3.2);
  const [recur, setRecur] = useState(41);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % INSIGHT_SUGGESTIONS.length);
      setAvg(+(2.4 + Math.random() * 1.6).toFixed(1));
      setRecur(Math.round(30 + Math.random() * 25));
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const suggestion = INSIGHT_SUGGESTIONS[idx];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-txt-tertiary">CLASS INSIGHTS</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-toss-blue animate-pulse" />
          <span className="text-[10px] text-toss-blue font-bold">AI ANALYZING</span>
        </div>
      </div>
      <div
        key={idx}
        className="bg-gradient-to-br from-toss-blue-dim to-transparent border border-toss-blue/20 rounded-xl p-4 mb-3 min-h-[92px] animate-fade-in"
      >
        <p className="text-[10px] text-toss-blue font-bold mb-1.5">WEEKLY AI RECOMMENDATION</p>
        <p className="text-xs text-txt-primary leading-relaxed">
          차기 강의에서{" "}
          <span className="text-toss-blue font-bold">'{suggestion.focus}'</span> 개념의 재강조를 권장합니다
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-elevated rounded-xl p-3">
          <p className="text-[10px] text-txt-tertiary">AVG ISSUES</p>
          <p
            key={`avg-${avg}`}
            className="text-xl font-extrabold text-txt-primary mt-1 animate-slide-up"
          >
            {avg}
            <span className="text-[10px] text-txt-tertiary ml-1">/student</span>
          </p>
        </div>
        <div className="bg-bg-elevated rounded-xl p-3">
          <p className="text-[10px] text-txt-tertiary">RECURRING</p>
          <p
            key={`recur-${recur}`}
            className="text-xl font-extrabold text-status-warn mt-1 animate-slide-up"
          >
            {recur}
            <span className="text-[10px] text-txt-tertiary ml-1">%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const RISK_STUDENTS = ["Student A", "Student B", "Student C"];

function labelForScore(score: number) {
  if (score >= 70) return "집중 케어 필요";
  if (score >= 50) return "보완 권장";
  return "양호";
}

function RiskVisual() {
  const [scores, setScores] = useState([82, 64, 31]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [autoTick, setAutoTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setScores((prev) =>
        prev.map((s) => {
          const next = s + Math.round((Math.random() - 0.5) * 24);
          return Math.max(8, Math.min(95, next));
        })
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setSelectedIdx((i) => (i + 1) % RISK_STUDENTS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [autoTick]);

  const selectedScore = scores[selectedIdx];
  const selectedColor =
    selectedScore >= 70 ? "#F45452" : selectedScore >= 50 ? "#F5A623" : "#1CD98C";

  // Compute factor breakdown so the bars match the score consistently
  const factors = useMemo(() => {
    const sevRatio = Math.min(100, Math.round(selectedScore * 0.9 + 5));
    const recurring = Math.min(100, Math.round(selectedScore * 0.7 + 10));
    const activity = Math.max(10, 100 - Math.round(selectedScore * 0.6));
    return [
      { label: "심각도 비율", value: sevRatio },
      { label: "반복 패턴", value: recurring },
      { label: "활동량 부족", value: activity },
    ];
  }, [selectedScore]);

  return (
    <div className="min-h-[360px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-txt-tertiary">PRIORITY CARE</p>
        <span className="text-[10px] text-toss-blue font-mono">REAL-TIME</span>
      </div>
      <div className="space-y-2">
        {RISK_STUDENTS.map((name, i) => {
          const score = scores[i];
          const color = score >= 70 ? "#F45452" : score >= 50 ? "#F5A623" : "#1CD98C";
          const circumference = 94.2;
          const dash = (score / 100) * circumference;
          const isSelected = selectedIdx === i;
          return (
            <button
              type="button"
              key={name}
              onClick={() => {
                setSelectedIdx(i);
                setAutoTick((t) => t + 1);
              }}
              className={`w-full rounded-xl p-3 flex items-center gap-3 transition-all duration-500 ${
                isSelected ? "scale-[1.01]" : ""
              }`}
              style={{
                backgroundColor: isSelected ? `${color}15` : "#242424",
                boxShadow: isSelected ? `0 0 0 1px ${color}60` : "none",
              }}
            >
              <div className="relative w-11 h-11 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#2A2A2A" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeLinecap="round"
                    style={{
                      transition: "stroke-dasharray 1.6s cubic-bezier(0.25, 0.1, 0.25, 1), stroke 0.6s ease",
                      filter: `drop-shadow(0 0 4px ${color}80)`,
                    }}
                  />
                </svg>
                <span
                  key={`score-${i}-${score}`}
                  className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold animate-fade-in"
                  style={{ color }}
                >
                  {score}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold text-txt-primary">{name}</p>
                <p
                  key={`label-${i}-${score}`}
                  className="text-[10px] font-bold animate-fade-in"
                  style={{ color }}
                >
                  {labelForScore(score)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected student factor breakdown */}
      <div
        key={`risk-${selectedIdx}`}
        className="mt-3 rounded-xl border p-3 animate-fade-in"
        style={{
          backgroundColor: `${selectedColor}10`,
          borderColor: `${selectedColor}40`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedColor }} />
          <p className="text-[10px] font-bold tracking-wider" style={{ color: selectedColor }}>
            {RISK_STUDENTS[selectedIdx].toUpperCase()} · SCORE BREAKDOWN
          </p>
        </div>
        <div className="space-y-1.5">
          {factors.map((f) => (
            <div key={f.label}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-txt-secondary">{f.label}</p>
                <p className="text-[10px] font-mono font-bold" style={{ color: selectedColor }}>
                  {f.value}
                </p>
              </div>
              <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${f.value}%`,
                    backgroundColor: selectedColor,
                    transition: "width 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Main component ---------------- */
export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useStore((s) => s.setAuth);
  const navigate = useNavigate();

  const ctaRef = useRef<HTMLDivElement>(null);
  const studentRef = useRef<HTMLDivElement>(null);
  const instructorRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await login(loginEmail, loginPassword);
      const token = res.data.access_token || res.data.token || "mock-jwt-token";
      const user = res.data.user;
      localStorage.setItem("token", token);
      if (user) {
        localStorage.setItem("mock_user", JSON.stringify(user));
        setAuth(token, user);
        navigate(user.role === "instructor" ? "/instructor" : "/student");
      } else {
        const meRes = await getMe();
        setAuth(token, meRes.data);
        navigate(meRes.data.role === "instructor" ? "/instructor" : "/student");
      }
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      await register(email, name, password, role);
      await handleLogin(email, password);
    } catch {
      setError("회원가입에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") await handleLogin(email, password);
    else {
      if (!name.trim()) {
        setError("이름을 입력해주세요");
        return;
      }
      await handleRegister();
    }
  };

  return (
    <div className="bg-bg-primary text-txt-primary overflow-x-hidden">
      {/* ========= Sticky top nav ========= */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-bg-primary/70 border-b border-line-secondary">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <p className="text-toss-blue text-sm font-extrabold tracking-tight">CodePathology</p>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => scrollTo(studentRef)}
              className="hidden sm:block text-xs font-bold text-txt-secondary hover:text-txt-primary px-3 py-1.5 rounded-lg transition tracking-wide"
            >
              Student
            </button>
            <button
              onClick={() => scrollTo(instructorRef)}
              className="hidden sm:block text-xs font-bold text-txt-secondary hover:text-txt-primary px-3 py-1.5 rounded-lg transition tracking-wide"
            >
              Instructor
            </button>
            <button
              onClick={() => scrollTo(ctaRef)}
              className="text-xs font-bold text-white bg-toss-blue hover:bg-toss-blue-light px-4 py-1.5 rounded-lg transition tracking-wide"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ========= HERO ========= */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-14 overflow-hidden">
        {/* Glow background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-toss-blue opacity-[0.08] blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-status-safe opacity-[0.04] blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-toss-blue/30 bg-toss-blue-dim mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-toss-blue animate-pulse" />
              <span className="text-[11px] font-bold text-toss-blue tracking-wide">
                AI-POWERED CODE ANALYTICS PLATFORM
              </span>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              코드 속 사고 패턴을
              <br />
              <span className="bg-gradient-to-r from-toss-blue to-status-safe bg-clip-text text-transparent">
                정밀하게 분석합니다
              </span>
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="text-lg sm:text-xl text-txt-secondary leading-relaxed max-w-2xl mx-auto mb-10">
              단순 컴파일 오류를 넘어, 학습자가 인지하지 못한 반복적 코드 습관까지
              <br className="hidden sm:block" />
              GPT-4 기반 정적 분석으로 식별하고 시각화합니다.
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => scrollTo(ctaRef)}
                className="px-7 py-3.5 bg-toss-blue hover:bg-toss-blue-light rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
              >
                Get Started
              </button>
              <button
                onClick={() => scrollTo(studentRef)}
                className="px-7 py-3.5 border border-line-primary hover:border-toss-blue rounded-xl text-sm font-bold text-txt-secondary hover:text-txt-primary transition-all"
              >
Explore Features
              </button>
            </div>
          </Reveal>

          <Reveal delay={600}>
            <div className="mt-20 flex flex-col items-center">
              <p className="text-[11px] text-txt-tertiary mb-3 tracking-widest">SCROLL</p>
              <div className="w-px h-12 bg-gradient-to-b from-toss-blue to-transparent animate-pulse" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========= WHY / Stats ========= */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center text-[11px] font-bold text-toss-blue tracking-widest mb-4">
              WHY CODEPATHOLOGY
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-center leading-tight mb-6 tracking-tight">
              오류가 아닌 습관을 분석합니다
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-center text-lg text-txt-secondary max-w-2xl mx-auto mb-20 leading-relaxed">
              컴파일러가 잡지 못하는 반복적 사고 패턴 —
              <br />
              학습자 스스로 인지하지 못한 코드 습관을 AI가 식별합니다.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                num: "01",
                title: "실시간 AI 코칭",
                desc: "학습자가 코드를 작성하는 즉시 WebSocket 기반 실시간 힌트를 전달합니다. 정답을 직접 제시하지 않고 소크라테스식 질문으로 사고 과정을 유도합니다.",
              },
              {
                num: "02",
                title: "반복 패턴 진단",
                desc: "일회성 버그가 아닌, 동일 유형의 오류가 누적되는 사고 습관을 자동으로 감지하고 카테고리별로 분류합니다.",
              },
              {
                num: "03",
                title: "강의 운영 인사이트",
                desc: "수강생 전반의 공통 약점, 학습 진척이 더딘 개별 학습자, 차기 강의에서 보강할 주제까지 — 강의자가 놓치는 영역을 가시화합니다.",
              },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i * 120}>
                <div className="bg-bg-card border border-line-primary rounded-2xl p-7 h-full hover:border-toss-blue/40 transition-all">
                  <p className="text-toss-blue text-xs font-mono mb-6">{s.num}</p>
                  <h3 className="text-xl font-extrabold text-txt-primary mb-3">
                    {s.title}
                  </h3>
                  <p className="text-sm text-txt-secondary leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========= STUDENT FEATURES ========= */}
      <section ref={studentRef} className="relative py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center text-[11px] font-bold text-toss-blue tracking-widest mb-4">
              FOR STUDENTS
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-center leading-tight mb-6 tracking-tight">
              학습자를 위한 4가지 핵심 기능
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-center text-lg text-txt-secondary max-w-2xl mx-auto mb-6 leading-relaxed">
              반복되는 실수와 미인지된 코드 습관을
              <br />
              AI가 정밀하게 진단하고 개선 방향을 제시합니다.
            </p>
          </Reveal>

          <FeatureCard
            index={1}
            tag="REAL-TIME"
            accent="#3182F6"
            title="실시간 AI 힌트 채팅"
            tagline="코드 입력과 동시에 AI가 사고 흐름을 점검합니다."
            description="WebSocket 기반 양방향 통신으로 코드 작성 중 실시간 힌트를 전달합니다. Level 1~3까지 단계적으로 공개되며, 정답 대신 소크라테스식 질문을 통해 학습자의 사고 과정을 유도합니다."
            howto={`1. 에디터에 코드를 입력하면 약 1.5초 후 AI가 컨텍스트를 분석해 힌트를 생성합니다.
2. 우측 'AI 힌트 채팅' 패널에서 실시간으로 힌트를 확인할 수 있습니다.
3. '힌트 더 보기' 버튼으로 다음 레벨의 힌트를 단계적으로 제공받습니다 (Level 1 → 2 → 3).`}
            visual={<HintVisual />}
          />

          <FeatureCard
            index={2}
            tag="ANALYSIS"
            accent="#F5A623"
            title="개인 코드 패턴 분석"
            tagline="반복 오류와 잠재적 사고 습관을 정량 분석합니다."
            description="GPT-4 기반 정적 분석 엔진이 제출된 코드를 라인 단위로 검토하고, 반복되는 사고 패턴을 추출합니다. 심각도는 LOW · MEDIUM · HIGH · CRITICAL 4단계로 분류되며 카테고리별 통계로 제공됩니다."
            howto={`1. 에디터 하단 '코드 제출' 버튼을 통해 분석을 실행합니다.
2. '내 코드 패턴' 탭에서 검출된 패턴과 심각도 분포를 확인합니다.
3. 각 패턴 카드를 확장하면 증상 · 원인 분석 · 학습 권장사항을 단계별로 제공합니다.`}
            reverse
            visual={<PatternVisual />}
          />

          <FeatureCard
            index={3}
            tag="PROGRESS"
            accent="#1CD98C"
            title="학습 성장 추이"
            tagline="개선 추세를 정량 지표로 시각화합니다."
            description="주 단위로 해결된 패턴과 미해결 패턴을 분리해 추적합니다. 빈도 상위 5개 패턴과 일자별 분석 데이터를 함께 제공해 학습자가 스스로 개선 영역을 파악할 수 있습니다."
            howto={`1. '성장 차트' 탭에서 주 단위 학습 트렌드를 확인합니다.
2. 미해결(Red) 지표가 감소하고 해결(Green) 지표가 증가하는 추이가 개선 신호입니다.
3. 반복 패턴 리스트에서 빈도가 높은 주제를 우선 보완 영역으로 식별합니다.`}
            visual={<GrowthVisual />}
          />

          <FeatureCard
            index={4}
            tag="NEXT STEP"
            accent="#A855F7"
            title="개인화 학습 추천"
            tagline="진단 결과에 기반한 맞춤형 학습 과제를 제공합니다."
            description="검출된 패턴 데이터를 기반으로 10~20분 단위의 실습 과제 2~3개를 자동 추천합니다. 모호한 학습 가이드 대신, 어떤 영역을 어떤 방식으로 보완해야 하는지 구체적으로 안내합니다."
            howto={`1. '맞춤 학습' 탭에서 당일 추천 과제 목록을 확인합니다.
2. 각 과제에는 예상 소요 시간과 학습 목표가 명시되어 있습니다.
3. 과제 선택 시 에디터에 실습 템플릿 코드가 자동으로 로드됩니다.`}
            reverse
            visual={<LearningVisual />}
          />
        </div>
      </section>

      {/* ========= INSTRUCTOR FEATURES ========= */}
      <section ref={instructorRef} className="relative py-28 px-6 bg-gradient-to-b from-transparent via-bg-card/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center text-[11px] font-bold text-toss-blue tracking-widest mb-4">
              FOR INSTRUCTORS
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-center leading-tight mb-6 tracking-tight">
              강의 운영을 위한 데이터 인텔리전스
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-center text-lg text-txt-secondary max-w-2xl mx-auto mb-6 leading-relaxed">
              수십 명의 학습자 코드를 한 사람이 모두 검토하는 것은 불가능합니다.
              <br />
              AI 대시보드가 강의 운영의 의사결정 근거를 제공합니다.
            </p>
          </Reveal>

          <FeatureCard
            index={5}
            tag="LIVE"
            accent="#1CD98C"
            title="실시간 활동 모니터링"
            tagline="강의 중 학습자별 진행 상태를 실시간으로 파악합니다."
            description="학습자별 입력 상태(진행 / 정체 / 중단)를 실시간 격자 뷰로 시각화합니다. 키 입력이 3분 이상 감지되지 않으면 '중단' 상태로 자동 전환되어, 도움이 필요한 학습자를 우선 식별할 수 있습니다."
            howto={`1. 강사 대시보드의 '실시간 활동' 탭에서 전체 학습자 격자 뷰를 확인합니다.
2. 적색 테두리는 3분 이상 입력이 없는 정체 상태의 학습자를 의미합니다.
3. 학습자 카드를 클릭하면 해당 학습자의 상세 진단 페이지로 이동합니다.`}
            visual={<MonitorVisual />}
          />

          <FeatureCard
            index={6}
            tag="HEATMAP"
            accent="#F5A623"
            title="클래스 패턴 히트맵"
            tagline="강의 전체의 공통 약점을 정량 지표로 가시화합니다."
            description="모든 학습자의 코드에서 검출된 패턴을 집계하여 빈도순으로 정렬합니다. 패턴별 발생 횟수, 영향받은 학습자 수, 심각도 분포를 종합 제공합니다."
            howto={`1. '패턴 히트맵' 탭에서 강의 전체의 상위 패턴을 빈도순으로 확인합니다.
2. 좌측의 패턴 카드를 클릭하면 우측에 상세 분석 패널이 표시됩니다.
3. 상세 분석에는 영향받은 학습자 목록, 시간별 발생 추이, 실제 코드 예시가 포함됩니다.`}
            reverse
            visual={<HeatmapVisual />}
          />

          <FeatureCard
            index={7}
            tag="AI COACH"
            accent="#3182F6"
            title="클래스 인사이트 리포트"
            tagline="차기 강의의 보강 지점을 AI가 제안합니다."
            description="해당 주차 학습자들이 가장 빈번하게 검출된 상위 5개 패턴과 함께, '차기 강의에서 해당 개념을 재강조할 것을 권장합니다' 형태의 구체적인 커리큘럼 보정 제안을 제공합니다."
            howto={`1. '클래스 인사이트' 탭에서 주차별 상위 5개 패턴과 AI 제안 사항을 확인합니다.
2. 평균 이슈 건수와 반복 패턴 비율을 기준으로 강의 난이도를 조정할 수 있습니다.
3. 제안된 주제를 클릭하면 관련 학습자와 코드 예시를 즉시 확인할 수 있습니다.`}
            visual={<InsightVisual />}
          />

          <FeatureCard
            index={8}
            tag="CARE"
            accent="#F45452"
            title="우선 케어 대상 식별"
            tagline="개입이 필요한 학습자를 데이터 기반으로 식별합니다."
            description="심각 이슈 비율, 반복 패턴 수, 활동량 데이터를 종합하여 '성장 포인트'를 산출합니다. 점수가 높을수록 우선 케어가 필요한 학습자로 분류됩니다. 성적이 아닌 학습 몰입도 기반 지표입니다."
            howto={`1. '도움이 필요한 학생' 탭에서 성장 포인트 내림차순으로 정렬된 학습자 목록을 확인합니다.
2. 각 카드에는 '집중 케어 / 보완 권장 / 양호' 상태가 표시됩니다.
3. 학습자 카드 클릭 시 개별 상세 분석 페이지로 이동하여 검출된 패턴을 즉시 확인할 수 있습니다.`}
            reverse
            visual={<RiskVisual />}
          />
        </div>
      </section>

      {/* ========= HOW IT WORKS ========= */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-center text-[11px] font-bold text-toss-blue tracking-widest mb-4">
              HOW IT WORKS
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-center leading-tight mb-16 tracking-tight">
              4단계 워크플로우
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { n: "1", t: "로그인", d: "학습자 또는 강사 역할로 접속합니다." },
              { n: "2", t: "코드 작성", d: "Monaco 기반 통합 에디터에서 코드를 작성합니다." },
              { n: "3", t: "AI 분석", d: "GPT-4와 AST 파서가 코드를 분석하고 패턴을 추출합니다." },
              { n: "4", t: "피드백 수신", d: "힌트 · 패턴 진단 · 학습 추천을 실시간으로 제공받습니다." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative">
                  <div className="bg-bg-card border border-line-primary rounded-2xl p-6 h-full">
                    <div className="w-9 h-9 rounded-xl bg-toss-blue-dim flex items-center justify-center text-toss-blue font-extrabold text-sm mb-4">
                      {s.n}
                    </div>
                    <p className="font-extrabold text-lg mb-2">{s.t}</p>
                    <p className="text-xs text-txt-secondary leading-relaxed">{s.d}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-txt-tertiary text-lg">
                      →
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========= CTA / LOGIN ========= */}
      <section ref={ctaRef} className="relative py-28 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-toss-blue opacity-[0.06] blur-[140px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <Reveal>
            <p className="text-center text-[11px] font-bold text-toss-blue tracking-widest mb-4">
              GET STARTED
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-center leading-tight mb-4 tracking-tight">
              지금 도입해 보세요
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-center text-lg text-txt-secondary max-w-xl mx-auto mb-14 leading-relaxed">
              계정을 생성하거나, 아래 데모 계정으로 즉시 체험할 수 있습니다.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Form */}
            <Reveal>
              <div className="bg-bg-card border border-line-primary rounded-2xl p-8">
                <div className="flex mb-6 bg-bg-elevated rounded-xl p-1">
                  {(["login", "register"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setError("");
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        mode === m ? "bg-toss-blue text-white" : "text-txt-tertiary"
                      }`}
                    >
                      {m === "login" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <p className="text-status-danger text-sm text-center py-2">{error}</p>
                  )}
                  {mode === "register" && (
                    <>
                      <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3.5 bg-bg-input border border-line-primary rounded-xl text-sm focus:outline-none focus:border-toss-blue transition placeholder:text-txt-disabled"
                        required
                      />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-3.5 bg-bg-input border border-line-primary rounded-xl text-sm text-txt-secondary focus:outline-none focus:border-toss-blue transition"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                      </select>
                    </>
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-bg-input border border-line-primary rounded-xl text-sm focus:outline-none focus:border-toss-blue transition placeholder:text-txt-disabled"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-bg-input border border-line-primary rounded-xl text-sm focus:outline-none focus:border-toss-blue transition placeholder:text-txt-disabled"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-toss-blue hover:bg-toss-blue-light disabled:opacity-40 rounded-xl font-bold text-sm transition-all mt-2"
                  >
                    {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
                  </button>
                </form>
              </div>
            </Reveal>

            {/* Demo */}
            <Reveal delay={150}>
              <div className="bg-bg-card border border-line-primary rounded-2xl p-8">
                <p className="text-sm font-extrabold text-txt-primary mb-1">
                  데모 계정으로 즉시 체험
                </p>
                <p className="text-xs text-txt-tertiary mb-6">
                  비밀번호 입력 없이 원클릭 접속이 가능합니다
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleLogin(acc.email, "password123")}
                      disabled={loading}
                      className={`text-left px-4 py-3 rounded-xl border transition-all hover:bg-bg-hover disabled:opacity-40 ${
                        acc.role === "instructor"
                          ? "border-toss-blue/30 bg-toss-blue-dimmer col-span-2"
                          : "border-line-primary"
                      }`}
                    >
                      <p
                        className={`text-xs font-bold ${
                          acc.role === "instructor" ? "text-toss-blue" : "text-txt-primary"
                        }`}
                      >
                        {acc.label}
                      </p>
                      <p className="text-[11px] text-txt-tertiary mt-0.5">{acc.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ========= FOOTER ========= */}
      <footer className="py-10 px-6 border-t border-line-secondary">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-toss-blue text-sm font-extrabold tracking-tight">CodePathology</p>
          <p className="text-[11px] text-txt-tertiary">
            AI Code Coaching Platform · Built with GPT-4 + FastAPI + React
          </p>
        </div>
      </footer>
    </div>
  );
}
