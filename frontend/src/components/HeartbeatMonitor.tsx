import { useEffect } from "react";

interface StudentStatus { id: number; name: string; status: "normal" | "stalled" | "danger"; stall_min: number; errors: number; }
interface Props { students: StudentStatus[]; onSelectStudent: (id: number) => void; }

const cfg = {
  danger: { dot: "bg-status-danger", border: "border-status-danger/20", label: "위험" },
  stalled: { dot: "bg-status-warn", border: "border-status-warn/20", label: "정체" },
  normal: { dot: "bg-status-safe", border: "border-line-primary", label: "정상" },
};

export default function HeartbeatMonitor({ students, onSelectStudent }: Props) {
  const sorted = [...students].sort((a, b) => {
    const order = { danger: 0, stalled: 1, normal: 2 };
    return (order[a.status] ?? 2) - (order[b.status] ?? 2);
  });

  useEffect(() => {
    const d = students.filter((s) => s.status === "danger");
    if (d.length > 0 && Notification.permission === "granted") {
      new Notification("CodePathology", { body: `${d.map((s) => s.name).join(", ")} 확인 필요` });
    }
  }, [students]);

  useEffect(() => { if (Notification.permission === "default") Notification.requestPermission(); }, []);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sorted.map((s, idx) => {
          const c = cfg[s.status];
          return (
            <div key={s.id} onClick={() => onSelectStudent(s.id)}
              className={`p-4 rounded-2xl bg-bg-card border ${c.border} cursor-pointer hover:bg-bg-hover transition-all animate-slide-up`}
              style={{ animationDelay: `${idx * 30}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-sm text-txt-primary">{s.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${c.dot} ${s.status === "danger" ? "animate-pulse" : ""}`} />
                  <span className="text-[11px] text-txt-secondary">{c.label}</span>
                </div>
              </div>
              <div className="flex gap-4 text-[11px] text-txt-tertiary">
                <span>정체 <span className={`font-bold ${s.stall_min > 5 ? "text-status-warn" : "text-txt-secondary"}`}>{s.stall_min}분</span></span>
                <span>에러 <span className={`font-bold ${s.errors > 3 ? "text-status-danger" : "text-txt-secondary"}`}>{s.errors}회</span></span>
              </div>
            </div>
          );
        })}
        {students.length === 0 && (
          <div className="col-span-full text-center py-20">
            <p className="text-txt-tertiary text-sm">아직 접속한 학생이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
