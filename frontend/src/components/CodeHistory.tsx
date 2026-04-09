import { useState, useEffect } from "react";

interface Snapshot {
  id: string;
  code: string;
  language: string;
  label: string;
  timestamp: number;
}

interface Props {
  onRestore: (code: string) => void;
}

const STORAGE_KEY = "code_history";

export function saveSnapshot(code: string, language: string, label: string) {
  const history: Snapshot[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  history.unshift({ id: Date.now().toString(), code, language, label, timestamp: Date.now() });
  if (history.length > 30) history.length = 30;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export default function CodeHistory({ onRestore }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSnapshots(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  }, []);

  const selected = snapshots.find((s) => s.id === selectedId);

  const deleteSnapshot = (id: string) => {
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selectedId === id) setSelectedId(null);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="py-2 space-y-2">
      {snapshots.length === 0 ? (
        <p className="text-txt-tertiary text-[11px] text-center py-4">코드를 제출하면 자동으로 히스토리가 저장됩니다</p>
      ) : (
        <>
          {snapshots.map((snap) => (
            <div
              key={snap.id}
              className={`rounded-lg px-3 py-2 cursor-pointer transition-all ${
                selectedId === snap.id ? "bg-toss-blue-dim border border-toss-blue/30" : "bg-bg-elevated/50 hover:bg-bg-elevated"
              }`}
              onClick={() => setSelectedId(selectedId === snap.id ? null : snap.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-txt-tertiary">{formatTime(snap.timestamp)}</span>
                  <span className="text-xs font-bold text-txt-primary">{snap.label}</span>
                  <span className="text-[10px] text-txt-tertiary bg-bg-elevated px-1.5 py-0.5 rounded">{snap.language}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRestore(snap.code); }}
                    className="text-[10px] text-toss-blue hover:text-toss-blue-light transition px-1.5"
                  >
                    복원
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSnapshot(snap.id); }}
                    className="text-[10px] text-txt-tertiary hover:text-status-danger transition px-1"
                  >
                    ×
                  </button>
                </div>
              </div>
              {selectedId === snap.id && (
                <pre className="mt-2 text-[10px] font-mono text-txt-secondary bg-bg-primary rounded-lg p-2 max-h-20 overflow-y-auto animate-slide-up">
                  {snap.code.slice(0, 500)}{snap.code.length > 500 ? "..." : ""}
                </pre>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
