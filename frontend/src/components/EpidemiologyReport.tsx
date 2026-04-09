import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { getEpidemiology } from "../services/api";

interface EpiData { top_pathologies: { code: string; name: string; category: string; count: number }[]; recommendation: string; }
interface Props { courseId: number; }

export default function EpidemiologyReport({ courseId }: Props) {
  const [data, setData] = useState<EpiData | null>(null);
  useEffect(() => { getEpidemiology(courseId).then((res) => setData(res.data)); }, [courseId]);

  if (!data) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-toss-blue border-t-transparent rounded-full animate-spin" /></div>;

  const total = data.top_pathologies.reduce((s, p) => s + p.count, 0) || 1;
  const radarData = data.top_pathologies.map((p) => ({ name: p.name.length > 6 ? p.name.slice(0, 6) + ".." : p.name, value: p.count }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-bg-card rounded-2xl p-6">
          <p className="text-sm font-bold text-txt-primary mb-4">패턴별 발생 빈도</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.top_pathologies}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" fill="#3182F6" radius={[6, 6, 0, 0]} barSize={32} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-bg-card rounded-2xl p-6">
          <p className="text-sm font-bold text-txt-primary mb-4">패턴 분포</p>
          {radarData.length >= 3 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2A2A2A" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#8b8b8b" }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: "#555" }} />
                <Radar dataKey="value" stroke="#3182F6" fill="#3182F6" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-txt-tertiary text-sm">3개 이상 데이터 필요</div>}
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl p-6 mb-5">
        <p className="text-sm font-bold text-txt-primary mb-3">자주 보이는 패턴</p>
        <div className="space-y-3">
          {data.top_pathologies.map((p, i) => {
            const pct = Math.round((p.count / total) * 100);
            return (
              <div key={p.code} className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="text-toss-blue font-bold text-sm w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-txt-primary">{p.name}</p>
                    <span className="text-[11px] text-txt-tertiary">{p.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-toss-blue rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-txt-tertiary w-6 text-right">{pct}%</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-txt-primary">{p.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-toss-blue-dimmer rounded-2xl p-5 border border-toss-blue/10">
        <p className="text-sm font-bold text-toss-blue mb-1">AI 수업 추천</p>
        <p className="text-sm text-txt-secondary leading-relaxed">{data.recommendation}</p>
      </div>
    </div>
  );
}
