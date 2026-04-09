import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  AreaChart, Area,
} from "recharts";
import { getPathologyDetail, getCourseHeatmap } from "../services/api";

interface PathologyDetailData {
  pathology_code: string;
  pathology_name: string;
  category: string;
  root_cause: string;
  prescription: string;
  affected_count: number;
  total_occurrences: number;
  recurrence_rate: number;
  avg_per_student: number;
  first_seen: string;
  last_seen: string;
  severity_distribution: Record<string, number>;
  timeline: { date: string; count: number }[];
  affected_students: {
    student_id: number;
    student_name: string;
    occurrence_count: number;
    severities: string[];
    first_seen: string;
    last_seen: string;
  }[];
  code_examples: {
    student_id: number;
    student_name: string;
    code: string;
    symptom: string;
    severity: string;
    diagnosed_at: string;
  }[];
}

interface HeatmapItem {
  pathology_code: string;
  name: string;
  category: string;
  count: number;
  percentage: number;
  affected_count: number;
  severity_breakdown: Record<string, number>;
}

interface Props {
  courseId: number;
  onSelectStudent: (id: number) => void;
}

const SEV_CFG: Record<string, { color: string; label: string }> = {
  critical: { color: "#F45452", label: "심각" },
  high: { color: "#F5A623", label: "높음" },
  medium: { color: "#3182F6", label: "보통" },
  low: { color: "#555555", label: "낮음" },
};

const SEV_ORDER = ["critical", "high", "medium", "low"] as const;

function formatDate(iso: string): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString("ko", { month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

function daysBetween(fromIso: string, toIso: string): number {
  if (!fromIso || !toIso) return 0;
  const f = new Date(fromIso).getTime();
  const t = new Date(toIso).getTime();
  if (isNaN(f) || isNaN(t)) return 0;
  return Math.max(1, Math.round((t - f) / (1000 * 60 * 60 * 24)) + 1);
}

export default function PathologyDetailView({ courseId, onSelectStudent }: Props) {
  const [pathologies, setPathologies] = useState<HeatmapItem[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<PathologyDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [studentSort, setStudentSort] = useState<"count" | "recent">("count");
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  useEffect(() => {
    getCourseHeatmap(courseId).then((res) => setPathologies(res.data));
  }, [courseId]);

  useEffect(() => {
    if (selectedCode) {
      setLoading(true);
      setExpandedStudentId(null);
      getPathologyDetail(courseId, selectedCode)
        .then((res) => setDetail(res.data))
        .finally(() => setLoading(false));
    }
  }, [courseId, selectedCode]);

  const sevBarData = useMemo(
    () =>
      detail
        ? SEV_ORDER
            .filter((s) => (detail.severity_distribution[s] || 0) > 0)
            .map((s) => ({
              name: SEV_CFG[s].label,
              value: detail.severity_distribution[s] || 0,
              color: SEV_CFG[s].color,
            }))
        : [],
    [detail]
  );

  const sortedStudents = useMemo(() => {
    if (!detail) return [];
    const arr = [...detail.affected_students];
    if (studentSort === "count") {
      arr.sort((a, b) => b.occurrence_count - a.occurrence_count);
    } else {
      arr.sort((a, b) => (b.last_seen || "").localeCompare(a.last_seen || ""));
    }
    return arr;
  }, [detail, studentSort]);

  const observationDays = detail ? daysBetween(detail.first_seen, detail.last_seen) : 0;

  return (
    <div>
      <div className="grid grid-cols-5 gap-4">
        {/* Left: Pattern list with enriched cards */}
        <div className="col-span-2 space-y-2">
          {pathologies.map((p, idx) => {
            const isSelected = selectedCode === p.pathology_code;
            const total = Object.values(p.severity_breakdown || {}).reduce((a, b) => a + b, 0) || 1;
            return (
              <div
                key={p.pathology_code}
                onClick={() => setSelectedCode(p.pathology_code)}
                className={`bg-bg-card rounded-xl p-4 border cursor-pointer transition-all hover:bg-bg-hover animate-slide-up ${
                  isSelected ? "border-toss-blue/40 bg-bg-hover" : "border-line-primary"
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-sm font-extrabold w-6 shrink-0 ${p.percentage >= 30 ? "text-status-danger" : "text-toss-blue"}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm text-txt-primary truncate">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-txt-tertiary font-mono truncate">{p.pathology_code}</p>
                      {p.category && (
                        <span className="text-[10px] text-txt-tertiary bg-bg-elevated px-1.5 py-0.5 rounded-full shrink-0">
                          {p.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-txt-primary">{p.count}<span className="text-[10px] text-txt-tertiary ml-0.5">건</span></p>
                    <p className="text-[10px] text-txt-tertiary">{p.percentage}%</p>
                  </div>
                </div>

                {/* Severity mini stack bar */}
                <div className="flex h-1 rounded-full overflow-hidden bg-bg-elevated">
                  {SEV_ORDER.map((sev) => {
                    const count = p.severity_breakdown?.[sev] || 0;
                    const pct = (count / total) * 100;
                    return pct > 0 ? (
                      <div key={sev} className="h-full" style={{ width: `${pct}%`, backgroundColor: SEV_CFG[sev].color }} />
                    ) : null;
                  })}
                </div>

                <div className="flex items-center gap-3 mt-2 text-[10px] text-txt-tertiary">
                  <span>👥 {p.affected_count}명</span>
                  {(p.severity_breakdown?.critical || 0) > 0 && (
                    <span className="text-status-danger font-bold">심각 {p.severity_breakdown.critical}</span>
                  )}
                </div>
              </div>
            );
          })}
          {pathologies.length === 0 && (
            <div className="text-center py-20">
              <p className="text-txt-tertiary text-sm">발견된 패턴이 없어요</p>
            </div>
          )}
        </div>

        {/* Right: Rich detail panel */}
        <div className="col-span-3">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-toss-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && detail && (
            <div className="space-y-4 animate-fade-in">
              {/* 1. Header */}
              <div className="bg-bg-card rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <p className="text-[11px] text-txt-tertiary font-mono">{detail.pathology_code}</p>
                    <h3 className="text-xl font-extrabold text-txt-primary">{detail.pathology_name}</h3>
                    {detail.category && (
                      <span className="inline-block mt-1 text-[11px] text-toss-blue bg-toss-blue-dim px-2 py-0.5 rounded-full">
                        {detail.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Six key metrics grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="text-[10px] text-txt-tertiary mb-1">같은 패턴의 학생</p>
                    <p className="text-xl font-extrabold text-status-danger">
                      {detail.affected_count}<span className="text-[11px] text-txt-tertiary ml-0.5">명</span>
                    </p>
                  </div>
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="text-[10px] text-txt-tertiary mb-1">총 발생</p>
                    <p className="text-xl font-extrabold text-toss-blue">
                      {detail.total_occurrences}<span className="text-[11px] text-txt-tertiary ml-0.5">건</span>
                    </p>
                  </div>
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="text-[10px] text-txt-tertiary mb-1">평균 발생/학생</p>
                    <p className="text-xl font-extrabold text-txt-primary">
                      {detail.avg_per_student.toFixed(1)}<span className="text-[11px] text-txt-tertiary ml-0.5">회</span>
                    </p>
                  </div>
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="text-[10px] text-txt-tertiary mb-1">반복률 (2회 이상)</p>
                    <p className={`text-xl font-extrabold ${detail.recurrence_rate >= 0.5 ? "text-status-warn" : "text-txt-primary"}`}>
                      {Math.round(detail.recurrence_rate * 100)}<span className="text-[11px] text-txt-tertiary ml-0.5">%</span>
                    </p>
                  </div>
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="text-[10px] text-txt-tertiary mb-1">최초 발견</p>
                    <p className="text-sm font-bold text-txt-primary mt-1.5">{formatDate(detail.first_seen)}</p>
                  </div>
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="text-[10px] text-txt-tertiary mb-1">최근 발견</p>
                    <p className="text-sm font-bold text-txt-primary mt-1.5">{formatDate(detail.last_seen)}</p>
                  </div>
                </div>

                {/* 3. Root cause & prescription */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-elevated rounded-xl p-4">
                    <p className="text-[11px] text-toss-blue font-bold mb-1">왜 그럴까요?</p>
                    <p className="text-xs text-txt-secondary leading-relaxed">{detail.root_cause || "분석 정보가 부족해요"}</p>
                  </div>
                  <div className="bg-bg-elevated rounded-xl p-4">
                    <p className="text-[11px] text-status-safe font-bold mb-1">학습 추천</p>
                    <p className="text-xs text-txt-secondary leading-relaxed">{detail.prescription || "추천 가능한 학습이 아직 없어요"}</p>
                  </div>
                </div>
              </div>

              {/* 4 & 5. Severity distribution + Timeline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-txt-primary">심각도 분포</p>
                    <p className="text-[11px] text-txt-tertiary">총 {detail.total_occurrences}건</p>
                  </div>
                  {sevBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={sevBarData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8b8b8b" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
                          {sevBarData.map((item, i) => (
                            <Cell key={i} fill={item.color} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-txt-tertiary text-sm text-center py-8">데이터 없음</p>
                  )}
                </div>

                <div className="bg-bg-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-txt-primary">시간별 발생 추이</p>
                    <p className="text-[11px] text-txt-tertiary">{observationDays}일간</p>
                  </div>
                  {detail.timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={detail.timeline}>
                        <defs>
                          <linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3182F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3182F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#555" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => (v ? v.slice(5) : "")}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }}
                          labelFormatter={(v) => `📅 ${v}`}
                          formatter={(v) => [`${v}건`, "발생"]}
                        />
                        <Area type="monotone" dataKey="count" stroke="#3182F6" fill="url(#tlGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-txt-tertiary text-sm text-center py-8">데이터 없음</p>
                  )}
                </div>
              </div>

              {/* 6. Student list (sortable, expandable) */}
              <div className="bg-bg-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-txt-primary">같은 패턴의 학생 ({detail.affected_count}명)</p>
                  <div className="flex gap-1 bg-bg-elevated rounded-lg p-0.5">
                    <button
                      onClick={() => setStudentSort("count")}
                      className={`px-3 py-1 text-[11px] font-bold rounded transition ${
                        studentSort === "count" ? "bg-toss-blue text-white" : "text-txt-tertiary"
                      }`}
                    >
                      발생 많은 순
                    </button>
                    <button
                      onClick={() => setStudentSort("recent")}
                      className={`px-3 py-1 text-[11px] font-bold rounded transition ${
                        studentSort === "recent" ? "bg-toss-blue text-white" : "text-txt-tertiary"
                      }`}
                    >
                      최근 순
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {sortedStudents.map((s) => {
                    const isExpanded = expandedStudentId === s.student_id;
                    const sevCounts: Record<string, number> = {};
                    for (const sev of s.severities) sevCounts[sev] = (sevCounts[sev] || 0) + 1;
                    const topSev = SEV_ORDER.find((sev) => (sevCounts[sev] || 0) > 0) || "low";

                    return (
                      <div key={s.student_id} className="bg-bg-elevated rounded-xl overflow-hidden">
                        <div
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-bg-hover transition"
                          onClick={() => setExpandedStudentId(isExpanded ? null : s.student_id)}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{ backgroundColor: `${SEV_CFG[topSev].color}20`, color: SEV_CFG[topSev].color }}>
                            {s.student_name.replace("Student ", "S")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-txt-primary truncate">{s.student_name}</p>
                              {s.occurrence_count >= 2 && (
                                <span className="text-[10px] font-bold text-status-warn">반복 x{s.occurrence_count}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-txt-tertiary">
                              {formatDate(s.first_seen)} → {formatDate(s.last_seen)} · {s.occurrence_count}회
                            </p>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {s.severities.slice(0, 6).map((sev, i) => (
                              <span
                                key={i}
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: SEV_CFG[sev]?.color || "#555" }}
                              />
                            ))}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-line-secondary animate-slide-up">
                            <div className="grid grid-cols-4 gap-2 mt-3">
                              {SEV_ORDER.map((sev) => (
                                <div key={sev} className="bg-bg-primary rounded-lg p-2 text-center">
                                  <p className="text-[10px] text-txt-tertiary">{SEV_CFG[sev].label}</p>
                                  <p className="text-sm font-bold mt-0.5" style={{ color: SEV_CFG[sev].color }}>
                                    {sevCounts[sev] || 0}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectStudent(s.student_id);
                              }}
                              className="w-full mt-3 py-2 bg-toss-blue hover:bg-toss-blue-light rounded-lg text-[11px] font-bold text-white transition"
                            >
                              이 학생 카드 보기 →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7. Code examples */}
              {detail.code_examples.length > 0 && (
                <div className="bg-bg-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-txt-primary">실제 코드 예시</p>
                    <p className="text-[11px] text-txt-tertiary">{detail.code_examples.length}개</p>
                  </div>
                  <div className="space-y-3">
                    {detail.code_examples.map((ex, idx) => {
                      const cfg = SEV_CFG[ex.severity] || SEV_CFG.low;
                      return (
                        <div key={idx} className="rounded-xl border border-line-primary overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-bg-elevated">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                              <button
                                onClick={() => onSelectStudent(ex.student_id)}
                                className="text-xs font-bold text-txt-primary hover:text-toss-blue transition"
                              >
                                {ex.student_name}
                              </button>
                              <span className="text-[10px] text-txt-tertiary bg-bg-primary px-1.5 py-0.5 rounded-full">
                                {cfg.label}
                              </span>
                            </div>
                            <span className="text-[11px] text-txt-tertiary">{formatDate(ex.diagnosed_at)}</span>
                          </div>
                          <pre className="px-4 py-3 text-[11px] text-txt-secondary font-mono overflow-x-auto bg-bg-primary leading-relaxed max-h-40 overflow-y-auto">
                            {ex.code}
                          </pre>
                          <div className="px-4 py-2.5 border-t border-line-secondary">
                            <p className="text-[11px] text-txt-tertiary">
                              <span className="text-toss-blue font-bold">현상:</span> {ex.symptom}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !detail && (
            <div className="bg-bg-card rounded-2xl p-8 flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-txt-tertiary text-sm">왼쪽에서 패턴을 선택하면</p>
                <p className="text-txt-tertiary text-sm">상세 분석을 보여드릴게요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
