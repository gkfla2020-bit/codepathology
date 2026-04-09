import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../stores/useStore";
import MonacoEditor from "../components/MonacoEditor";
import ConsolePanel from "../components/ConsolePanel";
import { saveSnapshot } from "../components/CodeHistory";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useResizable } from "../hooks/useResizable";
import CodingChallenge, { ChallengePanel, CHALLENGES, type Challenge } from "../components/CodingChallenge";
import ShortcutHelp from "../components/ShortcutHelp";
import { useToast } from "../components/Toast";
import { submitCode } from "../services/api";

const LANGUAGES = [
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
];
const AUTOSAVE_KEY = "codepathology_autosave";
const SETTINGS_KEY = "codepathology_settings";

export default function StudentIDE() {
  const { user, language, setLanguage, code, heartbeatStatus, addHint, logout } = useStore();
  const { toast } = useToast();
  const savedSettings = useMemo(() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); } catch { return {}; } }, []);

  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">(savedSettings.theme || "vs-dark");
  const [fontSize, setFontSize] = useState<number>(savedSettings.fontSize || 14);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(CHALLENGES[0]);
  const [showChallengeList, setShowChallengeList] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const [lastRunSuccess, setLastRunSuccess] = useState<boolean | null>(null);
  const [problemCollapsed, setProblemCollapsed] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastConsoleMsg, setLastConsoleMsg] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const consoleRef = useRef<{ run: () => void }>(null);
  const navigate = useNavigate();
  const { size: consoleHeight, onMouseDown: onConsoleDrag } = useResizable(180, 80, 400);

  // Escape 키로 모달 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowChallengeList(false); setShowShortcuts(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // 설정 저장
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: editorTheme, fontSize })); }, [editorTheme, fontSize]);

  // 자동 저장 (5초)
  useEffect(() => {
    const i = setInterval(() => { if (code.trim()) localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ code, language, challengeId: activeChallenge?.id, ts: Date.now() })); }, 5000);
    return () => clearInterval(i);
  }, [code, language]);

  // 첫 로드
  useEffect(() => {
    const s = localStorage.getItem(AUTOSAVE_KEY);
    if (s) { try { const { code: c, language: l, challengeId } = JSON.parse(s); if (c) { useStore.getState().setCode(c); useStore.getState().setLanguage(l || "javascript"); if (challengeId) { const ch = CHALLENGES.find(x => x.id === challengeId); if (ch) setActiveChallenge(ch); } return; } } catch {} }
    if (CHALLENGES[0]) { useStore.getState().setCode(CHALLENGES[0].starterCode); useStore.getState().setLanguage(CHALLENGES[0].language); }
  }, []);

  // 피드백 리셋
  useEffect(() => { if (lastRunSuccess !== null) { const t = setTimeout(() => setLastRunSuccess(null), 2000); return () => clearTimeout(t); } }, [lastRunSuccess]);
  // 축하 애니메이션 리셋
  useEffect(() => { if (showConfetti) { const t = setTimeout(() => setShowConfetti(false), 3000); return () => clearTimeout(t); } }, [showConfetti]);

  const handleRun = useCallback(() => {
    setRunning(true);
    consoleRef.current?.run();
    setRunCount((c) => c + 1);
    setConsoleCollapsed(false);
    if (code.trim()) {
      saveSnapshot(code, language, "실행");
      submitCode(code, language).then((res) => {
        const d = res.data.diagnosis;
        const ok = d.severity === "none";
        setLastRunSuccess(ok);
        addHint({ id: Date.now().toString(), type: "diagnosis", message: d.pathology_name, diagnosis: d, timestamp: Date.now() });
      }).catch(() => setLastRunSuccess(false)).finally(() => setRunning(false));
    } else { setRunning(false); }
  }, [code, language, addHint]);

  const shortcuts = useMemo(() => ({
    "mod+enter": () => handleRun(),
    "mod+s": () => { saveSnapshot(code, language, "수동 저장"); toast("저장됨", "info"); },
    "mod+b": () => setProblemCollapsed((v) => !v),
    "mod+j": () => setConsoleCollapsed((v) => !v),
  }), [code, language, handleRun, toast]);
  useKeyboardShortcuts(shortcuts);

  const sCfg = { normal: { dot: "bg-status-safe", l: "정상" }, stalled: { dot: "bg-status-warn", l: "정체" }, danger: { dot: "bg-status-danger animate-pulse", l: "위험" } }[heartbeatStatus];

  const startChallenge = useCallback((ch: Challenge) => {
    setActiveChallenge(ch); useStore.getState().setCode(ch.starterCode); useStore.getState().setLanguage(ch.language);
    setShowChallengeList(false); setProblemCollapsed(false); setLastRunSuccess(null); setLastConsoleMsg("");
    localStorage.removeItem(AUTOSAVE_KEY); toast(`챌린지: ${ch.title}`, "info");
  }, [toast]);

  // 챌린지 통과 감지 → 축하 애니메이션
  const onChallengePass = useCallback(() => {
    setShowConfetti(true);
    toast("🎉 통과! 대단해요!", "success");
  }, [toast]);

  const editorBorder = lastRunSuccess === true ? "border-l-2 border-l-status-safe" : lastRunSuccess === false ? "border-l-2 border-l-status-danger" : "";
  const challengeIdx = activeChallenge ? CHALLENGES.findIndex(c => c.id === activeChallenge.id) : -1;

  return (
    <div className="h-screen flex flex-col bg-bg-primary relative">
      {/* 축하 애니메이션 */}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
          <div className="absolute text-4xl animate-ping" style={{ top: "30%", left: "20%" }}>✨</div>
          <div className="absolute text-4xl animate-ping" style={{ top: "25%", right: "25%" }}>🌟</div>
          <div className="absolute text-3xl animate-bounce" style={{ bottom: "35%", left: "40%" }}>🏆</div>
        </div>
      )}

      {/* Top bar */}
      <div className="h-11 flex items-center justify-between px-3 bg-bg-card border-b border-line-secondary shrink-0">
        {/* 왼쪽: 로고 + 문제 정보 */}
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-toss-blue">CP</span>
          <div className="w-px h-4 bg-line-secondary" />
          {activeChallenge && (
            <span className="text-[10px] text-txt-secondary bg-bg-elevated px-2 py-0.5 rounded">
              #{challengeIdx + 1}/{CHALLENGES.length} {activeChallenge.title}
            </span>
          )}
          {!activeChallenge && <span className="text-[10px] text-txt-tertiary">자유 코딩 모드</span>}
        </div>

        {/* 오른쪽: 컨트롤 */}
        <div className="flex items-center gap-1">
          {/* 언어 */}
          <div className="flex items-center bg-bg-elevated rounded-lg p-0.5">
            {LANGUAGES.map((l) => (
              <button key={l.value} onClick={() => setLanguage(l.value)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${language === l.value ? "bg-toss-blue text-white" : "text-txt-tertiary"}`}>
                {l.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-line-secondary mx-0.5" />

          {/* 에디터 설정 그룹 */}
          <button onClick={() => setEditorTheme(editorTheme === "vs-dark" ? "light" : "vs-dark")}
            className="text-[10px] px-1.5 py-1 bg-bg-elevated rounded-lg text-txt-tertiary hover:text-txt-secondary transition">
            {editorTheme === "vs-dark" ? "☀️" : "🌙"}
          </button>
          <div className="flex items-center bg-bg-elevated rounded-lg text-[10px]">
            <button onClick={() => setFontSize((s: number) => Math.max(10, s - 1))} className="text-txt-tertiary hover:text-txt-secondary px-1 py-0.5">−</button>
            <span className="text-txt-tertiary w-4 text-center text-[9px]">{fontSize}</span>
            <button onClick={() => setFontSize((s: number) => Math.min(24, s + 1))} className="text-txt-tertiary hover:text-txt-secondary px-1 py-0.5">+</button>
          </div>

          <div className="w-px h-4 bg-line-secondary mx-0.5" />

          {/* 패널 토글 그룹 */}
          <div className="flex items-center bg-bg-elevated rounded-lg p-0.5 gap-0.5">
            {activeChallenge && (
              <button onClick={() => setProblemCollapsed(v => !v)} title="문제 (⌘B)"
                className={`px-1.5 py-0.5 text-[10px] rounded transition ${!problemCollapsed ? "bg-toss-blue-dim text-toss-blue" : "text-txt-tertiary"}`}>📋</button>
            )}
            <button onClick={() => setConsoleCollapsed(v => !v)} title="콘솔 (⌘J)"
              className={`px-1.5 py-0.5 text-[10px] rounded transition ${!consoleCollapsed ? "bg-toss-blue-dim text-toss-blue" : "text-txt-tertiary"}`}>💻</button>
          </div>

          {/* 챌린지 + 도움말 */}
          <button onClick={() => setShowChallengeList(true)} title="문제 목록"
            className="text-[10px] px-1.5 py-1 bg-bg-elevated rounded-lg text-txt-tertiary hover:text-toss-blue transition">🏆</button>
          <button onClick={() => setShowShortcuts(true)} title="단축키"
            className="text-[10px] px-1.5 py-1 bg-bg-elevated rounded-lg text-txt-tertiary hover:text-txt-secondary transition">⌨️</button>

          {/* 상태 */}
          <div className="flex items-center gap-1 px-2 py-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />
            <span className="text-[9px] text-txt-tertiary">{sCfg.l}</span>
          </div>

          {/* 실행 */}
          <button onClick={handleRun} disabled={!code.trim() || running} title={!code.trim() ? "코드를 입력하세요" : running ? "실행 중..." : "코드 실행 (⌘+Enter)"}
            className="px-3 py-1 bg-status-safe hover:bg-green-500 disabled:opacity-30 rounded-lg text-[11px] font-bold text-white transition flex items-center gap-1">
            {running ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "▶"}
            실행
          </button>

          <button onClick={() => { logout(); navigate("/login"); }} className="text-txt-tertiary hover:text-status-danger transition text-[10px] ml-1">나가기</button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* 왼쪽: 문제 패널 */}
        {activeChallenge && !problemCollapsed && (
          <ChallengePanel
            challenge={activeChallenge} code={code} onClose={() => setActiveChallenge(null)} runCount={runCount}
            onReset={() => { useStore.getState().setCode(activeChallenge.starterCode); localStorage.removeItem(AUTOSAVE_KEY); toast("초기화됨", "info"); }}
            onPrev={() => { if (challengeIdx > 0) startChallenge(CHALLENGES[challengeIdx - 1]); }}
            onNext={() => { const n = CHALLENGES[challengeIdx + 1]; if (n) startChallenge(n); else toast("모든 챌린지 완료! 🎉", "success"); }}
            onPass={onChallengePass}
          />
        )}

        {/* 가운데: 에디터 + 콘솔 */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all ${editorBorder}`}>
          <div className="flex-1 min-h-0">
            <MonacoEditor studentId={user?.id ?? null} theme={editorTheme} fontSize={fontSize} />
          </div>
          {!consoleCollapsed ? (
            <>
              <div onMouseDown={onConsoleDrag} className="h-2 bg-line-secondary hover:bg-toss-blue cursor-row-resize shrink-0 transition-colors flex items-center justify-center">
                <div className="w-8 h-0.5 bg-txt-tertiary/30 rounded-full" />
              </div>
              <div style={{ height: consoleHeight }} className="shrink-0">
                <ConsolePanel ref={consoleRef} code={code} language={language} challenge={activeChallenge} onSummary={setLastConsoleMsg} />
              </div>
            </>
          ) : (
            <div className="h-7 bg-bg-elevated border-t border-line-secondary flex items-center justify-between px-3 shrink-0 cursor-pointer" onClick={() => setConsoleCollapsed(false)}>
              <span className="text-[10px] text-txt-tertiary">콘솔</span>
              {lastConsoleMsg && <span className="text-[10px] text-txt-tertiary truncate max-w-[300px]">{lastConsoleMsg}</span>}
            </div>
          )}
        </div>
      </div>

      {/* 챌린지 목록 모달 */}
      {showChallengeList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowChallengeList(false)}>
          <div className="bg-bg-card rounded-2xl p-6 w-[440px] max-h-[75vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-txt-primary">🏆 코딩 챌린지 ({CHALLENGES.length}문제)</h2>
              <button onClick={() => setShowChallengeList(false)} className="text-txt-tertiary hover:text-txt-primary text-lg">×</button>
            </div>
            <CodingChallenge onStartChallenge={startChallenge} currentId={activeChallenge?.id} />
          </div>
        </div>
      )}

      <ShortcutHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
