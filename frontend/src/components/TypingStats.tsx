import { useState, useEffect, useRef } from "react";
import { useStore } from "../stores/useStore";

interface StatEntry {
  timestamp: number;
  chars: number;
  deletes: number;
  lineCount: number;
}

const STORAGE_KEY = "typing_stats";

/** 외부에서 호출: 타이핑 이벤트 기록 */
export function recordTypingStat(chars: number, deletes: number, lineCount: number) {
  const stats: StatEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  stats.push({ timestamp: Date.now(), chars, deletes, lineCount });
  // 최근 200개만 유지
  if (stats.length > 200) stats.splice(0, stats.length - 200);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export default function TypingStats() {
  const code = useStore((s) => s.code);
  const [stats, setStats] = useState<StatEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const load = () => setStats(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    load();
    intervalRef.current = setInterval(load, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // 최근 1분 통계
  const now = Date.now();
  const recent = stats.filter((s) => now - s.timestamp < 60_000);
  const totalChars = recent.reduce((a, s) => a + s.chars, 0);
  const totalDeletes = recent.reduce((a, s) => a + s.deletes, 0);
  const cpm = totalChars * (60_000 / Math.max(60_000, now - (recent[0]?.timestamp || now)));
  const deleteRatio = totalChars + totalDeletes > 0 ? totalDeletes / (totalChars + totalDeletes) : 0;
  const lineCount = code.split("\n").length;

  // 최근 10개 데이터로 미니 차트
  const last10 = stats.slice(-10);
  const maxChars = Math.max(1, ...last10.map((s) => s.chars));

  return (
    <div className="py-2 space-y-3">
      {/* 실시간 지표 */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "타이핑 속도", value: `${Math.round(cpm)}`, unit: "자/분" },
          { label: "삭제 비율", value: `${Math.round(deleteRatio * 100)}`, unit: "%" },
          { label: "코드 줄 수", value: `${lineCount}`, unit: "줄" },
          { label: "세션 입력", value: `${stats.reduce((a, s) => a + s.chars, 0)}`, unit: "자" },
        ].map((m) => (
          <div key={m.label} className="bg-bg-elevated rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-txt-tertiary mb-0.5">{m.label}</p>
            <p className="text-lg font-extrabold text-txt-primary leading-none">
              {m.value}<span className="text-[10px] text-txt-tertiary ml-0.5">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 미니 바 차트 */}
      <div>
        <p className="text-[10px] text-txt-tertiary mb-1.5">최근 활동</p>
        <div className="flex items-end gap-1 h-12">
          {last10.length === 0 && (
            <p className="text-[10px] text-txt-tertiary">코드를 작성하면 활동 그래프가 표시됩니다</p>
          )}
          {last10.map((s, i) => {
            const h = Math.max(4, (s.chars / maxChars) * 48);
            const hasDelete = s.deletes > s.chars * 0.3;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t transition-all ${hasDelete ? "bg-status-warn/60" : "bg-toss-blue/60"}`}
                style={{ height: `${h}px` }}
                title={`${s.chars}자 입력 / ${s.deletes}자 삭제`}
              />
            );
          })}
        </div>
      </div>

      {/* 삭제 비율 경고 */}
      {deleteRatio > 0.4 && (
        <div className="bg-status-warn/10 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-status-warn text-xs">⚠</span>
          <span className="text-[11px] text-status-warn">삭제 비율이 높아요. 코드를 작성하기 전에 구조를 먼저 생각해보는 건 어떨까요?</span>
        </div>
      )}
    </div>
  );
}
