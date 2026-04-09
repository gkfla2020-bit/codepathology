import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../stores/useStore";
import { useWebSocket } from "../hooks/useWebSocket";
import { getCourseOverview, getCourseRisk } from "../services/api";
import HeartbeatMonitor from "../components/HeartbeatMonitor";
import PathologyHeatmap from "../components/PathologyHeatmap";
import EpidemiologyReport from "../components/EpidemiologyReport";
import PathologyCard from "../components/PathologyCard";
import RiskScore from "../components/RiskScore";
import ComparativeAnalysis from "../components/ComparativeAnalysis";
import PathologyDetailView from "../components/PathologyDetailView";

type Tab = "heartbeat" | "heatmap" | "epidemiology" | "risk" | "comparative" | "pathology_detail";

const TAB_INTROS: Record<Tab, { title: string; summary: string; howto: string[] }> = {
  heartbeat: {
    title: "실시간 클래스 활동 모니터링",
    summary:
      "전체 학습자의 코드 작성 상태를 격자 뷰로 시각화합니다. WebSocket 기반으로 수 초 단위 자동 업데이트됩니다.",
    howto: [
      "카드 테두리 색상으로 상태를 구분합니다 — 녹색: 진행 / 황색: 정체 / 적색: 3분 이상 중단",
      "상단 헤더의 3개 지표는 상태별 학습자 수를 의미합니다 (Normal / Stalled / Danger)",
      "학습자 카드 클릭 시 해당 학습자의 상세 패턴 분석 페이지로 이동합니다",
    ],
  },
  heatmap: {
    title: "클래스 공통 패턴 히트맵",
    summary:
      "전체 학습자의 코드에서 검출된 패턴을 빈도순으로 집계합니다. 클래스 전반의 약점 영역을 즉시 식별할 수 있습니다.",
    howto: [
      "상단에 위치할수록 검출 빈도가 높은 패턴입니다",
      "각 카드의 막대 그래프는 심각도 분포를 나타냅니다 (Critical / High / Medium / Low)",
      "카드 하단의 'N명' 표시는 해당 패턴이 검출된 학습자 수를 의미합니다",
    ],
  },
  epidemiology: {
    title: "AI 기반 강의 보강 인사이트",
    summary:
      "주차별 클래스 데이터를 분석하여 차기 강의의 보강 지점을 자연어로 제안합니다.",
    howto: [
      "상위 5개 패턴 중 1순위 주제를 차기 강의 초반에 5분간 보강 검토할 것을 권장합니다",
      "AI 제안 문구는 공지 사항에 그대로 활용 가능한 형식으로 제공됩니다",
      "본 화면은 일 단위로 자동 새로고침됩니다",
    ],
  },
  risk: {
    title: "우선 케어 대상 학습자",
    summary:
      "심각 이슈 비율, 반복 패턴 수, 활동량을 종합하여 '성장 포인트'를 산출합니다. 점수가 높을수록 집중 관찰이 필요한 학습자입니다.",
    howto: [
      "70점 이상인 학습자를 우선 면담 대상으로 분류할 것을 권장합니다",
      "'성장 포인트'는 벌점이 아닌 잠재 성장 가능성 지표로, 개입 시 큰 폭의 개선이 기대되는 학습자를 의미합니다",
      "카드 클릭 시 개별 학습자 상세 분석으로 이동합니다",
    ],
  },
  comparative: {
    title: "학습자 비교 분석",
    summary:
      "전체 학습자를 총 이슈 수, 반복률, 카테고리 분포 등의 지표로 횡단 비교할 수 있는 분석 테이블입니다.",
    howto: [
      "기본 정렬은 총 이슈 수 내림차순입니다 (개입 우선순위가 높은 학습자가 상단에 표시됩니다)",
      "반복 패턴 수가 높은 학습자는 동일 유형의 오류가 누적되는 학습자로, 개념 이해 부족 신호로 해석될 수 있습니다",
      "행 클릭 시 해당 학습자의 상세 분석 페이지로 이동합니다",
    ],
  },
  pathology_detail: {
    title: "패턴 단위 심층 분석",
    summary:
      "특정 패턴을 선택하여 영향받은 학습자, 발생 시점, 실제 코드 예시를 6가지 핵심 지표와 함께 분석합니다.",
    howto: [
      "좌측 목록에서 분석 대상 패턴을 선택합니다",
      "우측에 6개 지표(영향 학습자 수 · 총 발생 횟수 · 평균 · 반복률 · 최초/최근 검출 시점)와 시간 추이, 학습자 목록이 표시됩니다",
      "학습자 목록의 행 클릭 시 심각도별 발생 횟수와 개별 분석 페이지 이동 버튼이 표시됩니다",
    ],
  },
};

function TabIntro({ tab }: { tab: Tab }) {
  const storageKey = `intro_dismissed_${tab}`;
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(storageKey) !== "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOpen(localStorage.getItem(storageKey) !== "1");
  }, [tab, storageKey]);

  const intro = TAB_INTROS[tab];
  if (!intro) return null;

  const dismiss = () => {
    setOpen(false);
    localStorage.setItem(storageKey, "1");
  };
  const show = () => {
    setOpen(true);
    localStorage.removeItem(storageKey);
  };

  if (!open) {
    return (
      <button
        onClick={show}
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] text-txt-tertiary hover:text-toss-blue transition"
      >
        <span className="w-4 h-4 rounded-full bg-bg-card border border-line-primary inline-flex items-center justify-center font-bold">
          i
        </span>
        <span>화면 설명 보기</span>
      </button>
    );
  }

  return (
    <div className="mb-5 bg-bg-card border border-line-primary rounded-2xl p-5 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-toss-blue-dim flex items-center justify-center text-toss-blue font-extrabold text-xs shrink-0 mt-0.5">
          i
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-txt-primary mb-1.5">{intro.title}</p>
          <p className="text-xs text-txt-secondary leading-relaxed mb-4">{intro.summary}</p>
          <div>
            <p className="text-[10px] font-bold text-toss-blue tracking-wider mb-2">
              사용 방법
            </p>
            <ul className="space-y-1.5">
              {intro.howto.map((h, i) => (
                <li key={i} className="flex gap-2 text-[11px] text-txt-secondary leading-relaxed">
                  <span className="text-toss-blue font-bold shrink-0">{i + 1}.</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-txt-tertiary hover:text-txt-primary transition shrink-0 text-lg leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-bg-hover"
          title="닫기"
        >
          ×
        </button>
      </div>
    </div>
  );
}

interface StudentStatus {
  id: number;
  name: string;
  status: "normal" | "stalled" | "danger";
  stall_min: number;
  errors: number;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "heartbeat", label: "실시간 활동" },
  { key: "heatmap", label: "패턴 히트맵" },
  { key: "epidemiology", label: "클래스 인사이트" },
  { key: "risk", label: "우선 케어 대상" },
  { key: "comparative", label: "학습자 비교" },
  { key: "pathology_detail", label: "패턴 상세 분석" },
];

export default function InstructorDashboard() {
  const { user, students, setStudents, logout } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("heartbeat");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const courseId = user?.course_id ?? 1;
  const navigate = useNavigate();

  const handleMessage = useCallback(
    (data: unknown) => {
      const msg = data as { type: string; students?: StudentStatus[] };
      if (msg.type === "heartbeat_update" && msg.students) {
        setStudents(msg.students as StudentStatus[]);
      }
    },
    [setStudents]
  );

  useWebSocket({ url: `/ws/dashboard/${courseId}`, onMessage: handleMessage, enabled: !!courseId });

  useEffect(() => {
    getCourseOverview(courseId).then((res) => setTotalStudents(res.data.student_count)).catch(() => {});
  }, [courseId]);

  const sc = {
    normal: students.filter((s) => s.status === "normal").length,
    stalled: students.filter((s) => s.status === "stalled").length,
    danger: students.filter((s) => s.status === "danger").length,
  };

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <div className="w-60 border-r border-line-secondary flex flex-col shrink-0">
        <div className="px-5 pt-6 pb-4">
          <p className="text-toss-blue text-xs font-bold tracking-wide">CodePathology</p>
          <p className="text-txt-tertiary text-[11px] mt-0.5">Instructor Dashboard</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setSelectedStudent(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-all ${
                activeTab === t.key
                  ? "bg-toss-blue-dim text-toss-blue font-bold"
                  : "text-txt-secondary hover:bg-bg-hover"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-line-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-txt-primary">{user?.name}</p>
              <p className="text-[11px] text-txt-tertiary">{user?.email}</p>
            </div>
            <button onClick={() => { logout(); navigate("/login"); }}
              className="text-txt-tertiary hover:text-status-danger text-xs transition">
Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Summary */}
        <div className="px-8 pt-6 pb-2 shrink-0">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-txt-primary">
                {TABS.find((t) => t.key === activeTab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-status-safe" />
                <span className="text-txt-secondary">{sc.normal}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-status-warn" />
                <span className="text-txt-secondary">{sc.stalled}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-status-danger" />
                <span className="text-txt-secondary">{sc.danger}</span>
              </div>
              <span className="text-txt-tertiary">|</span>
              <span className="text-txt-tertiary text-xs">Total {totalStudents}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {selectedStudent ? (
            <div className="animate-fade-in">
              <button onClick={() => setSelectedStudent(null)}
                className="text-toss-blue text-sm mb-5 hover:underline">
                ← Back to List
              </button>
              <PathologyCard studentId={selectedStudent} />
            </div>
          ) : (
            <div className="animate-fade-in">
              <TabIntro tab={activeTab} />
              {activeTab === "heartbeat" && <HeartbeatMonitor students={students} onSelectStudent={setSelectedStudent} />}
              {activeTab === "heatmap" && <PathologyHeatmap courseId={courseId} />}
              {activeTab === "epidemiology" && <EpidemiologyReport courseId={courseId} />}
              {activeTab === "risk" && <RiskScore courseId={courseId} />}
              {activeTab === "comparative" && <ComparativeAnalysis courseId={courseId} onSelectStudent={setSelectedStudent} />}
              {activeTab === "pathology_detail" && <PathologyDetailView courseId={courseId} onSelectStudent={setSelectedStudent} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
