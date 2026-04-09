import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { getStudentDiagnoses } from "../services/api";

interface Props {
  studentId: number;
}

export default function StudentGrowthChart({ studentId }: Props) {
  const [chartData, setChartData] = useState<
    { week: string; active: number; resolved: number }[]
  >([]);

  useEffect(() => {
    getStudentDiagnoses(studentId).then((res) => {
      const items = res.data.items || [];
      const weekMap: Record<string, { active: number; resolved: number }> = {};

      for (const d of items) {
        const date = new Date(d.diagnosed_at);
        const week = `W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
        if (!weekMap[week]) weekMap[week] = { active: 0, resolved: 0 };
        if (d.severity === "none") {
          weekMap[week].resolved++;
        } else {
          weekMap[week].active++;
        }
      }

      setChartData(
        Object.entries(weekMap).map(([week, vals]) => ({ week, ...vals }))
      );
    });
  }, [studentId]);

  return (
    <div className="py-2">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F45452" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F45452" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1CD98C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1CD98C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="active" stroke="#F45452" strokeWidth={2} fill="url(#activeGrad)" name="진행 중인 패턴" />
            <Area type="monotone" dataKey="resolved" stroke="#1CD98C" strokeWidth={2} fill="url(#resolvedGrad)" name="해결됨" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[120px]">
          <p className="text-txt-tertiary text-[11px]">분석 데이터가 쌓이면 성장 차트를 보여드릴게요</p>
        </div>
      )}
    </div>
  );
}
