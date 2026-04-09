import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell,
  AreaChart, Area, Tooltip,
} from "recharts";
import { getStudentCard, getStudentDetailAnalysis } from "../services/api";

interface DiagnosisItem {
  id: number;
  pathology_name: string;
  pathology_code: string;
  category: string;
  severity: string;
  symptom: string;
  root_cause: string;
  prescription: string;
  is_recurring: boolean;
  recurrence_count: number;
  diagnosed_at: string;
}

interface CardData {
  student: { id: number; name: string; email: string } | null;
  diagnoses: DiagnosisItem[];
  risk_score: number;
  risk_factors: Record<string, number>;
}

interface Props {
  studentId: number;
  compact?: boolean;
}

const sevCfg: Record<string, { label: string; color: string }> = {
  critical: { label: "심각", color: "#F45452" },
  high: { label: "높음", color: "#F5A623" },
  medium: { label: "보통", color: "#3182F6" },
  low: { label: "낮음", color: "#555555" },
  none: { label: "정상", color: "#1CD98C" },
};

interface DetailData {
  total_diagnoses: number;
  total_issues: number;
  severity_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  top_pathologies: { code: string; name: string; category: string; count: number }[];
  recurring_pathologies: { code: string; name: string; count: number; occurrences: { diagnosed_at: string; severity: string; symptom: string; code_snippet: string }[] }[];
  timeline: { date: string; total: number; issues: number }[];
  code_snippets: { pathology_name: string; pathology_code: string; severity: string; symptom: string; code_snippet: string; diagnosed_at: string }[];
}

export default function PathologyCard({ studentId, compact }: Props) {
  const [data, setData] = useState<CardData | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "recurring" | "code">("overview");

  useEffect(() => {
    getStudentCard(studentId).then((res) => setData(res.data));
    if (!compact) {
      getStudentDetailAnalysis(studentId).then((res) => setDetailData(res.data)).catch(() => {});
    }
  }, [studentId, compact]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-toss-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const severities: Record<string, number> = {};
  for (const d of data.diagnoses) {
    if (d.severity !== "none") {
      severities[d.severity] = (severities[d.severity] || 0) + 1;
    }
  }
  const barData = ["critical", "high", "medium", "low"].map((sev) => ({
    name: sevCfg[sev]?.label || sev,
    count: severities[sev] || 0,
    color: sevCfg[sev]?.color || "#555",
  }));
  const totalIssues = data.diagnoses.filter((d) => d.severity !== "none").length;

  if (compact) {
    return (
      <div className="flex gap-4 items-start py-2">
        <div className="flex-1 space-y-1.5">
          {data.diagnoses.slice(0, 3).map((d) => {
            const cfg = sevCfg[d.severity] || sevCfg.none;
            return (
              <div key={d.id} className="flex items-center gap-2 text-xs bg-bg-elevated rounded-lg px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="text-txt-primary font-bold">{d.pathology_name}</span>
                {d.is_recurring && (
                  <span className="text-status-danger text-[10px] font-bold">x{d.recurrence_count}</span>
                )}
              </div>
            );
          })}
          {data.diagnoses.length === 0 && (
            <p className="text-txt-tertiary text-xs">아직 분석 기록이 없어요</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-bg-card rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-toss-blue-dim flex items-center justify-center text-lg font-extrabold text-toss-blue">
              {data.student?.name?.[0] || "?"}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-txt-primary">{data.student?.name}</h2>
              <p className="text-[11px] text-txt-tertiary">{data.student?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[11px] text-txt-tertiary">총 분석</p>
              <p className="text-2xl font-extrabold text-txt-primary">{data.diagnoses.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-txt-tertiary">이슈</p>
              <p className="text-2xl font-extrabold text-toss-blue">{totalIssues}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-txt-tertiary">성장 포인트</p>
              <p className={`text-2xl font-extrabold ${data.risk_score >= 0.7 ? "text-status-danger" : data.risk_score >= 0.4 ? "text-status-warn" : "text-status-safe"}`}>
                {(data.risk_score * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Severity Bar */}
        <div className="bg-bg-card rounded-2xl p-6">
          <p className="text-sm font-bold text-txt-primary mb-4">심각도 분포</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8b8b8b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={28}>
                {barData.map((item, i) => (
                  <Cell key={i} fill={item.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity summary */}
        <div className="bg-bg-card rounded-2xl p-6">
          <p className="text-sm font-bold text-txt-primary mb-4">심각도 요약</p>
          <div className="space-y-3">
            {["critical", "high", "medium", "low"].map((sev) => {
              const count = severities[sev] || 0;
              const cfg = sevCfg[sev];
              const pct = totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0;
              return (
                <div key={sev}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="text-xs font-bold text-txt-secondary">{cfg.label}</span>
                    </div>
                    <span className="text-xs text-txt-tertiary">{count}건 ({pct}%)</span>
                  </div>
                  <div className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Analysis Tabs */}
      {detailData && (
        <>
          <div className="flex gap-1 bg-bg-card rounded-xl p-1 mb-4">
            {([
              ["overview", "분석 타임라인"],
              ["recurring", "반복 패턴 분석"],
              ["code", "코드 스니펫"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  activeSection === key
                    ? "bg-toss-blue text-white"
                    : "text-txt-tertiary hover:text-txt-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Timeline Chart */}
          {detailData.timeline.length > 0 && activeSection === "overview" && (
            <div className="bg-bg-card rounded-2xl p-6 mb-4">
              <p className="text-sm font-bold text-txt-primary mb-4">날짜별 분석 추이</p>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={detailData.timeline}>
                  <defs>
                    <linearGradient id="issuesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F45452" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F45452" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3182F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3182F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" stroke="#3182F6" fill="url(#totalGrad)" strokeWidth={2} name="전체 분석" />
                  <Area type="monotone" dataKey="issues" stroke="#F45452" fill="url(#issuesGrad)" strokeWidth={2} name="이슈" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recurring Pathologies */}
          {activeSection === "recurring" && (
            <div className="bg-bg-card rounded-2xl p-6 mb-4">
              <p className="text-sm font-bold text-txt-primary mb-4">반복되는 패턴 (2회 이상)</p>
              {detailData.recurring_pathologies.length > 0 ? (
                <div className="space-y-3">
                  {detailData.recurring_pathologies.map((rp) => (
                    <div key={rp.code} className="bg-bg-elevated rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm text-txt-primary">{rp.name}</p>
                          <p className="text-[11px] text-txt-tertiary font-mono">{rp.code}</p>
                        </div>
                        <span className="text-xl font-extrabold text-status-danger">{rp.count}<span className="text-xs text-txt-tertiary ml-0.5">회</span></span>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {rp.occurrences.map((occ, i) => {
                          const ocfg = sevCfg[occ.severity] || sevCfg.none;
                          return (
                            <div key={i} className="flex items-center gap-2 bg-bg-primary rounded-lg p-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ocfg.color }} />
                              <span className="text-[11px] font-bold text-txt-secondary">{ocfg.label}</span>
                              <span className="text-xs text-txt-tertiary flex-1 truncate">{occ.symptom}</span>
                              <span className="text-[11px] text-txt-tertiary">{occ.diagnosed_at?.slice(0, 10)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-txt-tertiary text-sm">반복되는 패턴이 없어요</p>
                </div>
              )}
            </div>
          )}

          {/* Code Snippets */}
          {activeSection === "code" && (
            <div className="bg-bg-card rounded-2xl p-6 mb-4">
              <p className="text-sm font-bold text-txt-primary mb-4">문제 코드 스니펫</p>
              {detailData.code_snippets.length > 0 ? (
                <div className="space-y-3">
                  {detailData.code_snippets.map((cs, idx) => {
                    const csCfg = sevCfg[cs.severity] || sevCfg.none;
                    return (
                      <div key={idx} className="rounded-xl border border-line-primary overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-bg-elevated">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: csCfg.color }} />
                            <span className="text-xs font-bold text-txt-primary">{cs.pathology_name}</span>
                          </div>
                          <span className="text-[11px] text-txt-tertiary">{cs.diagnosed_at?.slice(0, 10)}</span>
                        </div>
                        <pre className="px-4 py-3 text-[11px] text-txt-secondary font-mono overflow-x-auto bg-bg-primary leading-relaxed max-h-32 overflow-y-auto">
                          {cs.code_snippet}
                        </pre>
                        <div className="px-4 py-2.5 border-t border-line-secondary">
                          <p className="text-[11px] text-txt-tertiary"><span className="text-toss-blue font-bold">현상:</span> {cs.symptom}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-txt-tertiary text-sm">코드 스니펫이 없습니다</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Timeline */}
      {activeSection === "overview" && (
        <div className="bg-bg-card rounded-2xl p-6">
          <p className="text-sm font-bold text-txt-primary mb-4">패턴 타임라인</p>
          <div className="space-y-2">
            {data.diagnoses.map((d, idx) => {
              const cfg = sevCfg[d.severity] || sevCfg.none;
              const isExpanded = expandedId === d.id;
              return (
                <div
                  key={d.id}
                  className={`rounded-xl transition-all animate-slide-up ${
                    isExpanded ? "bg-bg-elevated" : "bg-bg-elevated/50 hover:bg-bg-elevated"
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div
                    className="p-3 cursor-pointer flex items-center gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-txt-primary">{d.pathology_name}</span>
                        <span className="text-[11px] text-txt-tertiary">{cfg.label}</span>
                        {d.is_recurring && d.recurrence_count >= 2 && (
                          <span className="text-[11px] font-bold text-status-danger">{d.recurrence_count}회 반복</span>
                        )}
                      </div>
                      <p className="text-[11px] text-txt-tertiary font-mono">{d.pathology_code}</p>
                    </div>
                    <span className="text-[11px] text-txt-tertiary shrink-0">
                      {d.diagnosed_at ? new Date(d.diagnosed_at).toLocaleDateString("ko") : ""}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-4 ml-6 space-y-2 animate-slide-up">
                      <div className="bg-bg-primary rounded-lg p-3 space-y-2">
                        <div>
                          <p className="text-[11px] text-txt-tertiary mb-0.5">현상</p>
                          <p className="text-xs text-txt-secondary">{d.symptom}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-txt-tertiary mb-0.5">왜 그럴까요?</p>
                          <p className="text-xs text-toss-blue">{d.root_cause}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-txt-tertiary mb-0.5">학습 추천</p>
                          <p className="text-xs text-status-safe">{d.prescription}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {data.diagnoses.length === 0 && (
              <div className="text-center py-8">
                <p className="text-txt-tertiary text-sm">아직 분석 기록이 없어요</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
