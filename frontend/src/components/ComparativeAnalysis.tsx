import { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend,
} from "recharts";
import { getComparativeAnalysis } from "../services/api";

interface StudentData {
  student_id: number;
  student_name: string;
  email: string;
  total_diagnoses: number;
  total_issues: number;
  severity_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  recurring_count: number;
  unique_pathologies: number;
  risk_score: number;
  top_pathology: string;
}

interface Props {
  courseId: number;
  onSelectStudent: (id: number) => void;
}

const SEV_COLORS: Record<string, string> = {
  critical: "#F45452",
  high: "#F5A623",
  medium: "#3182F6",
  low: "#555555",
};

export default function ComparativeAnalysis({ courseId, onSelectStudent }: Props) {
  const [data, setData] = useState<StudentData[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"issues" | "risk" | "recurring">("issues");

  useEffect(() => {
    getComparativeAnalysis(courseId).then((res) => setData(res.data));
  }, [courseId]);

  const sorted = [...data].sort((a, b) => {
    if (sortBy === "risk") return b.risk_score - a.risk_score;
    if (sortBy === "recurring") return b.recurring_count - a.recurring_count;
    return b.total_issues - a.total_issues;
  });

  const stackedData = sorted.map((s) => ({
    name: s.student_name.replace("Student ", "S"),
    critical: s.severity_distribution.critical || 0,
    high: s.severity_distribution.high || 0,
    medium: s.severity_distribution.medium || 0,
    low: s.severity_distribution.low || 0,
  }));

  const radarData = selectedIdx !== null && sorted[selectedIdx]
    ? Object.entries(sorted[selectedIdx].category_distribution).map(([name, value]) => ({
        category: name.length > 6 ? name.slice(0, 6) + ".." : name,
        count: value,
      }))
    : [];

  const avgIssues = data.length > 0 ? data.reduce((s, d) => s + d.total_issues, 0) / data.length : 0;
  const avgRisk = data.length > 0 ? data.reduce((s, d) => s + d.risk_score, 0) / data.length : 0;
  const avgRecurring = data.length > 0 ? data.reduce((s, d) => s + d.recurring_count, 0) / data.length : 0;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-toss-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div />
        <div className="flex gap-1 bg-bg-card rounded-xl p-1">
          {([["issues", "이슈 순"], ["risk", "위험도 순"], ["recurring", "반복 순"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                sortBy === key ? "bg-toss-blue text-white" : "text-txt-tertiary hover:text-txt-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-bg-card rounded-2xl p-5">
          <p className="text-[11px] text-txt-tertiary mb-1">분석 대상</p>
          <p className="text-3xl font-extrabold text-txt-primary">{data.length}<span className="text-sm text-txt-tertiary ml-0.5">명</span></p>
        </div>
        <div className="bg-bg-card rounded-2xl p-5">
          <p className="text-[11px] text-txt-tertiary mb-1">평균 이슈</p>
          <p className="text-3xl font-extrabold text-toss-blue">{avgIssues.toFixed(1)}<span className="text-sm text-txt-tertiary ml-0.5">건</span></p>
        </div>
        <div className="bg-bg-card rounded-2xl p-5">
          <p className="text-[11px] text-txt-tertiary mb-1">평균 성장 포인트</p>
          <p className={`text-3xl font-extrabold ${avgRisk >= 0.5 ? "text-status-warn" : "text-status-safe"}`}>
            {(avgRisk * 100).toFixed(0)}<span className="text-sm text-txt-tertiary ml-0.5">%</span>
          </p>
        </div>
        <div className="bg-bg-card rounded-2xl p-5">
          <p className="text-[11px] text-txt-tertiary mb-1">평균 반복 패턴</p>
          <p className="text-3xl font-extrabold text-txt-primary">{avgRecurring.toFixed(1)}<span className="text-sm text-txt-tertiary ml-0.5">건</span></p>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="bg-bg-card rounded-2xl p-6 mb-5">
        <p className="text-sm font-bold text-txt-primary mb-4">학생별 심각도 분포</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stackedData}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8b8b8b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="critical" stackId="a" fill="#F45452" name="심각" />
            <Bar dataKey="high" stackId="a" fill="#F5A623" name="높음" />
            <Bar dataKey="medium" stackId="a" fill="#3182F6" name="보통" />
            <Bar dataKey="low" stackId="a" fill="#555555" name="낮음" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Student Grid + Detail */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-2">
          {sorted.map((s, idx) => {
            const isSelected = selectedIdx === idx;
            const riskColor = s.risk_score >= 0.7 ? "text-status-danger" : s.risk_score >= 0.4 ? "text-status-warn" : "text-status-safe";
            return (
              <div
                key={s.student_id}
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                className={`bg-bg-card rounded-2xl p-4 border cursor-pointer transition-all hover:bg-bg-hover animate-slide-up ${
                  isSelected ? "border-toss-blue/30" : "border-line-primary"
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-toss-blue-dim flex items-center justify-center text-sm font-bold text-toss-blue">
                    {s.student_name.replace("Student ", "S")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-txt-primary">{s.student_name}</p>
                      {s.recurring_count > 0 && (
                        <span className="text-[11px] font-bold text-status-danger">반복 {s.recurring_count}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-txt-tertiary">{s.email}</p>
                  </div>

                  <div className="flex items-center gap-5 text-center">
                    <div>
                      <p className="text-[11px] text-txt-tertiary">이슈</p>
                      <p className="text-sm font-extrabold text-txt-primary">{s.total_issues}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-txt-tertiary">고유 패턴</p>
                      <p className="text-sm font-extrabold text-toss-blue">{s.unique_pathologies}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-txt-tertiary">성장 포인트</p>
                      <p className={`text-sm font-extrabold ${riskColor}`}>{(s.risk_score * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectStudent(s.student_id); }}
                    className="text-[11px] text-toss-blue hover:text-toss-blue-light bg-toss-blue-dim px-3 py-1.5 rounded-lg font-bold"
                  >
                    상세
                  </button>
                </div>

                <div className="flex gap-0.5 mt-3 h-1 rounded-full overflow-hidden bg-bg-elevated">
                  {(["critical", "high", "medium", "low"] as const).map((sev) => {
                    const count = s.severity_distribution[sev] || 0;
                    const pct = s.total_issues > 0 ? (count / s.total_issues) * 100 : 0;
                    return pct > 0 ? (
                      <div key={sev} className="h-full" style={{ width: `${pct}%`, backgroundColor: SEV_COLORS[sev] }} />
                    ) : null;
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="col-span-2">
          {selectedIdx !== null && sorted[selectedIdx] && (
            <div className="bg-bg-card rounded-2xl p-6 sticky top-6 animate-fade-in">
              <p className="text-[11px] text-txt-tertiary mb-1">카테고리 분석</p>
              <p className="font-extrabold text-lg text-txt-primary mb-4">{sorted[selectedIdx].student_name}</p>

              {radarData.length >= 3 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2A2A2A" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "#8b8b8b" }} />
                    <PolarRadiusAxis tick={false} />
                    <Radar dataKey="count" stroke="#3182F6" fill="#3182F6" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="space-y-2 mb-4">
                  {Object.entries(sorted[selectedIdx].category_distribution).map(([cat, count]) => (
                    <div key={cat} className="bg-bg-elevated rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-txt-primary font-bold">{cat}</span>
                        <span className="text-xs text-toss-blue font-bold">{count}건</span>
                      </div>
                      <div className="w-full h-1 bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-toss-blue rounded-full" style={{ width: `${(count / sorted[selectedIdx].total_issues) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 bg-bg-elevated rounded-xl p-4">
                <p className="text-[11px] text-txt-tertiary">가장 많은 패턴</p>
                <p className="text-sm font-bold text-toss-blue mt-1">{sorted[selectedIdx].top_pathology}</p>
                <p className="text-[11px] text-txt-tertiary mt-0.5">
                  총 {sorted[selectedIdx].total_issues}건 중 반복 {sorted[selectedIdx].recurring_count}건
                </p>
              </div>
            </div>
          )}
          {selectedIdx === null && (
            <div className="bg-bg-card rounded-2xl p-8 flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-txt-tertiary text-sm">학생을 선택하면</p>
                <p className="text-txt-tertiary text-sm">카테고리 분석이 표시됩니다</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
