import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import type { Challenge } from "./CodingChallenge";

interface ConsoleEntry {
  id: string;
  type: "output" | "error" | "info" | "success" | "fail";
  text: string;
}

export interface ConsolePanelHandle { run: () => void; }

interface Props {
  code: string;
  language: string;
  challenge?: Challenge | null;
  onSummary?: (msg: string) => void;
}

let eid = 0;
const uid = () => String(++eid);

const ConsolePanel = forwardRef<ConsolePanelHandle, Props>(({ code, language, challenge, onSummary }, ref) => {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [runNum, setRunNum] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries]);

  const runCode = useCallback(async () => {
    setRunning(true);
    setEntries([]);
    setRunNum((n) => n + 1);
    const t0 = performance.now();

    // ── 챌린지 모드 ──
    if (challenge && language === "javascript") {
      const out: ConsoleEntry[] = [];
      const fnMatch = code.match(/function\s+(\w+)/) || code.match(/(?:const|let|var)\s+(\w+)\s*=/);
      const fnName = fnMatch?.[1];
      if (!fnName) {
        out.push({ id: uid(), type: "error", text: "함수 이름을 찾을 수 없습니다." });
        setEntries(out); setExecTime(performance.now() - t0); setRunning(false); return;
      }
      out.push({ id: uid(), type: "info", text: `▶ ${fnName}() — ${challenge.testCases.length}개 테스트` });
      out.push({ id: uid(), type: "info", text: "─".repeat(40) });
      let pass = 0;
      for (let i = 0; i < challenge.testCases.length; i++) {
        const tc = challenge.testCases[i];
        const logs: string[] = [];
        const mc = { log: (...a: unknown[]) => logs.push(a.map(String).join(" ")), error: (...a: unknown[]) => logs.push("[ERR] " + a.map(String).join(" ")), warn: (...a: unknown[]) => logs.push("[WARN] " + a.map(String).join(" ")), info: (...a: unknown[]) => logs.push(a.map(String).join(" ")) };
        try {
          const fn = new Function("console", `${code}\nreturn ${fnName}(${tc.input});`);
          const result = fn(mc);
          for (const l of logs) out.push({ id: uid(), type: "output", text: `  📝 ${l}` });
          const actual = JSON.stringify(result) ?? String(result);
          const ok = actual === tc.expected || String(result) === tc.expected;
          if (ok) pass++;
          out.push({ id: uid(), type: ok ? "success" : "fail", text: tc.hidden ? `${ok ? "✅" : "❌"} 히든 #${i + 1}` : `${ok ? "✅" : "❌"} #${i + 1}: ${fnName}(${tc.input}) → ${actual}${ok ? "" : `  (기대: ${tc.expected})`}` });
        } catch (e) {
          const errStr = String(e);
          const lineMatch = errStr.match(/<anonymous>:(\d+)/);
          const lineInfo = lineMatch ? ` (line ${lineMatch[1]})` : "";
          out.push({ id: uid(), type: "fail", text: `❌ #${i + 1}: ${errStr}${lineInfo}` });
        }
      }
      out.push({ id: uid(), type: "info", text: "─".repeat(40) });
      const all = pass === challenge.testCases.length;
      out.push({ id: uid(), type: all ? "success" : "fail", text: all ? `🎉 ${pass}/${challenge.testCases.length} 모든 테스트 통과!` : `${pass}/${challenge.testCases.length} 통과` });
      if (all) {
        const s = JSON.parse(localStorage.getItem("solved_challenges") || "[]") as string[];
        if (!s.includes(challenge.id)) { s.push(challenge.id); localStorage.setItem("solved_challenges", JSON.stringify(s)); }
      }
      setEntries(out); setExecTime(performance.now() - t0); setRunning(false);
      onSummary?.(out[out.length - 1]?.text || ""); return;
    }

    // ── 일반 모드 ──
    const out: ConsoleEntry[] = [];
    try {
      if (language === "javascript") {
        const logs: { type: "output" | "error"; text: string }[] = [];
        const mc = { log: (...a: unknown[]) => logs.push({ type: "output", text: a.map(String).join(" ") }), error: (...a: unknown[]) => logs.push({ type: "error", text: a.map(String).join(" ") }), warn: (...a: unknown[]) => logs.push({ type: "output", text: "[WARN] " + a.map(String).join(" ") }), info: (...a: unknown[]) => logs.push({ type: "output", text: a.map(String).join(" ") }) };
        try {
          const r = new Function("console", code)(mc);
          for (const l of logs) out.push({ id: uid(), ...l });
          if (r !== undefined && !logs.length) out.push({ id: uid(), type: "output", text: `→ ${String(r)}` });
          if (!logs.length && r === undefined) out.push({ id: uid(), type: "info", text: "(출력 없음 — console.log()로 출력해보세요)" });
        } catch (e) {
          const errStr = String(e);
          const lm = errStr.match(/<anonymous>:(\d+)/);
          out.push({ id: uid(), type: "error", text: lm ? `${errStr} (line ${lm[1]})` : errStr });
        }
      } else if (language === "python") {
        const ps = code.match(/print\s*\(([^)]*)\)/g);
        if (ps) for (const p of ps) out.push({ id: uid(), type: "output", text: p.replace(/print\s*\(\s*/, "").replace(/\s*\)$/, "").replace(/^["']|["']$/g, "") });
        else out.push({ id: uid(), type: "info", text: "(Python: print() 출력만 표시)" });
      } else if (language === "java") {
        const ps = code.match(/System\.out\.println\s*\(([^)]*)\)/g);
        if (ps) for (const p of ps) out.push({ id: uid(), type: "output", text: p.replace(/System\.out\.println\s*\(\s*/, "").replace(/\s*\)$/, "").replace(/^"|"$/g, "") });
        else out.push({ id: uid(), type: "info", text: "(Java: System.out.println() 출력만 표시)" });
      }
    } catch (e) { out.push({ id: uid(), type: "error", text: `${e}` }); }
    setEntries(out); setExecTime(performance.now() - t0); setRunning(false);
    onSummary?.(out[out.length - 1]?.text || "");
  }, [code, language, challenge, onSummary]);

  useImperativeHandle(ref, () => ({ run: runCode }), [runCode]);

  const lines = code.split("\n").length;
  const chars = code.length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1 bg-bg-elevated border-b border-line-secondary shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-txt-secondary">콘솔</span>
          {running && <span className="w-2 h-2 border border-toss-blue border-t-transparent rounded-full animate-spin" />}
          {execTime !== null && <span className="text-[10px] text-txt-tertiary">{execTime.toFixed(1)}ms</span>}
          {runNum > 0 && <span className="text-[10px] text-txt-tertiary">#{runNum}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-txt-tertiary">{lines}줄 · {chars}자</span>
          <button onClick={() => { setEntries([]); setExecTime(null); }} className="text-[10px] text-txt-tertiary hover:text-txt-secondary transition">지우기</button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-[12px] space-y-0.5 bg-bg-primary">
        {!entries.length && <p className="text-txt-tertiary text-[11px]">▶ 실행 또는 Cmd+Enter</p>}
        {entries.map((e) => (
          <div key={e.id} className={`leading-relaxed ${e.type === "error" || e.type === "fail" ? "text-status-danger" : e.type === "success" ? "text-status-safe" : e.type === "info" ? "text-txt-tertiary" : "text-txt-primary"}`}>{e.text}</div>
        ))}
      </div>
    </div>
  );
});
ConsolePanel.displayName = "ConsolePanel";
export default ConsolePanel;
