import { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { getCourseRisk } from "../services/api";

interface RiskItem {
  student_id: number;
  student_name: string;
  score: number;
  factors: Record<string, number>;
}

interface Props {
  courseId: number;
}

const FACTOR_LABELS: Record<string, string> = {
  danger_ratio: "심각 비율",
  error_frequency: "에러 빈도",
  submission_interval: "제출 간격",
  recurring_pathologies: "반복 패턴",
};

function getRiskConfig(score: number) {
  if (score >= 0.7) return { color: "#F45452", border: "border-status-danger/20", label: "함께 봐주세요" };
  if (score >= 0.4) return { color: "#F5A623", border: "border-status-warn/20", label: "조금만 더 챙겨주세요" };
  return { color: "#1CD98C", border: "border-line-primary", label: "잘하고 있어요" };
}

export default function RiskScore({ courseId }: Props) {
  const [data, setData] = useState<RiskItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    getCourseRisk(courseId)
      .then((res) => {
        const sorted = [...res.data].sort((a: RiskItem, b: RiskItem) => b.score - a.score);
        setData(sorted);
      })
      .catch(() => setData([]));
  }, [courseId]);

  const avgScore = data.length > 0 ? data.reduce((s, d) => s + d.score, 0) / data.length : 0;
  const highRiskCount = data.filter((d) => d.score >= 0.7).length;

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-bg-card rounded-2xl p-5">
          <p className="text-[11px] text-txt-tertiary mb-1">평균 성장 포인트</p>
          <p className="text-3xl font-extrabold text-txt-primary">
            {(avgScore * 100).toFixed(0)}<span className="text-sm text-txt-tertiary ml-0.5">%</span>
          </p>
        </div>
        <div className="bg-bg-card rounded-2xl p-5">
          <p className="text-[11px] text-txt-tertiary mb-1">도움이 필요한 학생</p>
          <p className={`text-3xl font-extrabold ${highRiskCount > 0 ? "text-status-danger" : "text-txt-primary"}`}>
            {highRiskCount}<span className="text-sm text-txt-tertiary ml-0.5">명</span>
          </p>
        </div>
        <div className="bg-bg-card rounded-2xl p-5">
          <p className="text-[11px] text-txt-tertiary mb-1">분석 대상</p>
          <p className="text-3xl font-extrabold text-txt-primary">
            {data.length}<span className="text-sm text-txt-tertiary ml-0.5">명</span>
          </p>
        </div>
      </div>

      {/* Student list + detail */}
      <div className="grid grid-cols-5 gap-4">
        {/* List */}
        <div className="col-span-3 space-y-2">
          {data.map((item, idx) => {
            const pct = Math.round(item.score * 100);
            const cfg = getRiskConfig(item.score);
            const isSelected = selectedIdx === idx;

            return (
              <div
                key={item.student_id}
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                className={`bg-bg-card rounded-2xl p-4 border ${cfg.border} cursor-pointer transition-all hover:bg-bg-hover animate-slide-up ${isSelected ? "border-toss-blue/30" : ""}`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-sm font-bold text-txt-secondary">
                    {item.student_name.replace("Student ", "S")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-txt-primary">{item.student_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-txt-tertiary">{cfg.label}</span>
                        <span className="text-lg font-extrabold" style={{ color: cfg.color }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-line-secondary grid grid-cols-2 gap-2 animate-slide-up">
                    {Object.entries(item.factors || {}).map(([key, val]) => {
                      const factorPct = Math.round((typeof val === "number" ? val : 0) * 100);
                      return (
                        <div key={key} className="bg-bg-elevated rounded-xl p-3">
                          <p className="text-[11px] text-txt-tertiary mb-1">{FACTOR_LABELS[key] || key}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-bg-primary rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-toss-blue" style={{ width: `${Math.min(factorPct * 4, 100)}%` }} />
                            </div>
                            <span className="text-xs font-bold text-txt-secondary">
                              {typeof val === "number" ? val.toFixed(3) : val}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="text-center py-20">
              <p className="text-txt-tertiary text-sm">아직 분석할 데이터가 없어요</p>
            </div>
          )}
        </div>

        {/* Radar detail */}
        <div className="col-span-2">
          {selectedIdx !== null && data[selectedIdx] && (
            <div className="bg-bg-card rounded-2xl p-6 sticky top-6 animate-fade-in">
              <p className="text-[11px] text-txt-tertiary mb-1">성장 포인트 분석</p>
              <p className="font-extrabold text-lg text-txt-primary mb-4">{data[selectedIdx].student_name}</p>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart
                  data={Object.entries(data[selectedIdx].factors || {}).map(([key, val]) => ({
                    factor: FACTOR_LABELS[key] || key,
                    value: typeof val === "number" ? val * 100 : 0,
                    fullMark: 100,
                  }))}
                >
                  <PolarGrid stroke="#2A2A2A" />
                  <PolarAngleAxis dataKey="factor" tick={{ fontSize: 10, fill: "#8b8b8b" }} />
                  <PolarRadiusAxis tick={false} domain={[0, 30]} />
                  <Radar
                    dataKey="value"
                    stroke="#3182F6"
                    fill="#3182F6"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-3xl font-extrabold" style={{ color: getRiskConfig(data[selectedIdx].score).color }}>
                  {Math.round(data[selectedIdx].score * 100)}%
                </p>
                <p className="text-[11px] text-txt-tertiary mt-1">종합 성장 포인트</p>
              </div>
            </div>
          )}
          {selectedIdx === null && (
            <div className="bg-bg-card rounded-2xl p-8 flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-txt-tertiary text-sm">학생을 선택하면</p>
                <p className="text-txt-tertiary text-sm">상세 분석이 표시됩니다</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
