import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getCourseHeatmap } from "../services/api";

interface HeatmapItem { pathology_code: string; name: string; count: number; percentage: number; }
interface Props { courseId: number; }

export default function PathologyHeatmap({ courseId }: Props) {
  const [data, setData] = useState<HeatmapItem[]>([]);
  useEffect(() => { getCourseHeatmap(courseId).then((res) => setData(res.data)); }, [courseId]);

  const total = data.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div>
      {data.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-txt-primary">패턴별 발생 빈도</p>
            <p className="text-xs text-txt-tertiary">총 {total}건</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#8b8b8b" }} width={130} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                {data.map((item, i) => (
                  <Cell key={i} fill={item.percentage >= 30 ? "#F45452" : "#3182F6"} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={item.pathology_code} className="bg-bg-card rounded-xl p-4 animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-txt-tertiary font-bold w-5">{idx + 1}</span>
                <div>
                  <p className="text-sm font-bold text-txt-primary">{item.name}</p>
                  <p className="text-[11px] text-txt-tertiary font-mono">{item.pathology_code}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-txt-primary">{item.count}<span className="text-txt-tertiary text-xs ml-0.5">건</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-toss-blue transition-all duration-500" style={{ width: `${item.percentage}%` }} />
              </div>
              <span className="text-xs text-txt-tertiary w-10 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
