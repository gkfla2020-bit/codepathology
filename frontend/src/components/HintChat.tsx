import { useCallback, useRef, useEffect } from "react";
import { useStore } from "../stores/useStore";
import { useWebSocket } from "../hooks/useWebSocket";

interface Props {
  studentId: number | null;
}

const sevCfg: Record<string, { color: string; label: string }> = {
  critical: { color: "#F45452", label: "CRITICAL" },
  high: { color: "#F5A623", label: "HIGH" },
  medium: { color: "#3182F6", label: "MEDIUM" },
  low: { color: "#555555", label: "LOW" },
  none: { color: "#1CD98C", label: "NONE" },
};

export default function HintChat({ studentId }: Props) {
  const { hints, addHint } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [hints]);

  const handleMessage = useCallback(
    (data: unknown) => {
      const msg = data as {
        type: string; message?: string; hint_level?: number; related_line?: number;
        pathology_name?: string; pathology_code?: string; category?: string;
        severity?: string; symptom?: string; root_cause?: string;
        prescription?: string; meta_insight?: string;
      };
      if (msg.type === "hint") {
        addHint({
          id: Date.now().toString(),
          type: "hint",
          message: msg.message || "",
          hint_level: msg.hint_level,
          related_line: msg.related_line,
          timestamp: Date.now(),
        });
      } else if (msg.type === "diagnosis") {
        addHint({
          id: Date.now().toString(),
          type: "diagnosis",
          message: msg.pathology_name || "",
          diagnosis: {
            pathology_name: msg.pathology_name || "",
            pathology_code: msg.pathology_code || "",
            category: msg.category || "",
            severity: msg.severity || "",
            symptom: msg.symptom || "",
            root_cause: msg.root_cause || "",
            prescription: msg.prescription || "",
            meta_insight: msg.meta_insight || "",
            is_recurring: false,
            recurrence_count: 1,
          },
          timestamp: Date.now(),
        });
      }
    },
    [addHint]
  );

  const { send } = useWebSocket({
    url: `/ws/hints/${studentId}`,
    onMessage: handleMessage,
    enabled: !!studentId,
  });

  const requestMoreHint = () => {
    const lastHint = hints.filter((h) => h.type === "hint").pop();
    send({
      type: "request_hint",
      hint_level: (lastHint?.hint_level || 0) + 1,
    });
  };

  return (
    <div className="flex flex-col h-full bg-bg-card border-l border-line-secondary">
      {/* Header */}
      <div className="p-4 border-b border-line-secondary">
        <p className="font-bold text-sm text-toss-blue">AI 힌트 채팅</p>
        <p className="text-[11px] text-txt-tertiary">소크라테스식 학습 가이드</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {hints.length === 0 && (
          <div className="text-center py-8">
            <p className="text-txt-tertiary text-xs">코드를 작성하면</p>
            <p className="text-txt-tertiary text-xs">AI가 힌트를 보내줍니다</p>
          </div>
        )}
        {hints.map((h) => (
          <div key={h.id} className="animate-slide-up">
            {h.type === "hint" && (
              <div className="bg-bg-elevated rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-toss-blue bg-toss-blue-dim px-2 py-0.5 rounded-lg">
                    Level {h.hint_level}
                  </span>
                  {h.related_line && (
                    <span className="text-[11px] text-txt-tertiary">
                      Line {h.related_line}
                    </span>
                  )}
                </div>
                <p className="text-xs text-txt-secondary leading-relaxed">{h.message}</p>
              </div>
            )}

            {h.type === "diagnosis" && h.diagnosis && (() => {
              const cfg = sevCfg[h.diagnosis.severity] || sevCfg.none;
              return (
                <div className="rounded-xl p-3 bg-bg-elevated border border-line-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-[11px] font-bold text-txt-tertiary">{cfg.label}</span>
                    <span className="font-bold text-xs text-txt-primary">{h.diagnosis.pathology_name}</span>
                    {h.diagnosis.is_recurring && (
                      <span className="text-[11px] text-status-danger font-bold">x{h.diagnosis.recurrence_count}</span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="bg-bg-primary rounded-lg p-2">
                      <p className="text-[10px] text-txt-tertiary mb-0.5">현상</p>
                      <p className="text-txt-secondary">{h.diagnosis.symptom}</p>
                    </div>
                    <div className="bg-bg-primary rounded-lg p-2">
                      <p className="text-[10px] text-txt-tertiary mb-0.5">왜 그럴까요?</p>
                      <p className="text-toss-blue">{h.diagnosis.root_cause}</p>
                    </div>
                    <div className="bg-bg-primary rounded-lg p-2">
                      <p className="text-[10px] text-txt-tertiary mb-0.5">학습 추천</p>
                      <p className="text-status-safe">{h.diagnosis.prescription}</p>
                    </div>
                    {h.diagnosis.meta_insight && (
                      <p className="text-[11px] text-txt-tertiary italic px-1 pt-1">
                        {h.diagnosis.meta_insight}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {h.type === "system" && (
              <div className="bg-bg-elevated rounded-xl p-3">
                <p className="text-xs text-txt-tertiary">{h.message}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-line-secondary">
        <button
          onClick={requestMoreHint}
          className="w-full py-2.5 bg-toss-blue hover:bg-toss-blue-light rounded-xl text-xs font-bold text-white transition-all"
        >
          힌트 더 보기
        </button>
      </div>
    </div>
  );
}
