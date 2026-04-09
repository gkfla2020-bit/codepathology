import { useState, useEffect } from "react";
import { useStore } from "../stores/useStore";

interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  completed: boolean;
  starterCode: string;
}

const TASK_TEMPLATES: Omit<Task, "id" | "completed">[] = [
  {
    title: "배열 경계 체크 연습",
    description: "주어진 배열에서 안전하게 요소에 접근하는 함수를 작성하세요. ArrayIndexOutOfBoundsException을 방지해야 합니다.",
    difficulty: "easy",
    category: "safety",
    starterCode: `public static int safeGet(int[] arr, int index) {\n  // TODO: 안전하게 배열 요소를 반환하세요\n  // 범위를 벗어나면 -1을 반환\n  return arr[index];\n}`,
  },
  {
    title: "Null 안전 문자열 처리",
    description: "null이 될 수 있는 문자열을 안전하게 처리하는 메서드를 구현하세요.",
    difficulty: "easy",
    category: "safety",
    starterCode: `public static String safeTrim(String input) {\n  // TODO: null 체크 후 trim 반환\n  // null이면 빈 문자열 반환\n  return input.trim();\n}`,
  },
  {
    title: "반복문 종료 조건 수정",
    description: "아래 코드에서 Off-by-One 오류를 찾아 수정하세요.",
    difficulty: "medium",
    category: "logic",
    starterCode: `public static int sum(int[] arr) {\n  int total = 0;\n  for (int i = 0; i <= arr.length; i++) {\n    total += arr[i];\n  }\n  return total;\n}`,
  },
  {
    title: "리소스 자동 해제 패턴",
    description: "try-with-resources를 사용하여 파일을 안전하게 읽는 코드를 작성하세요.",
    difficulty: "medium",
    category: "safety",
    starterCode: `public static String readFile(String path) {\n  // TODO: try-with-resources 사용\n  FileReader reader = new FileReader(path);\n  // ...\n  return content;\n}`,
  },
  {
    title: "무한 루프 방지 패턴",
    description: "while 루프에 안전한 종료 조건과 최대 반복 횟수 제한을 추가하세요.",
    difficulty: "hard",
    category: "logic",
    starterCode: `public static void processQueue(Queue<Task> queue) {\n  // TODO: 안전한 종료 조건 추가\n  while (true) {\n    Task task = queue.poll();\n    process(task);\n  }\n}`,
  },
  {
    title: "매직 넘버 리팩토링",
    description: "코드에서 매직 넘버를 의미 있는 상수로 추출하세요.",
    difficulty: "easy",
    category: "style",
    starterCode: `public static double calculateTax(double price) {\n  if (price > 50000) {\n    return price * 0.1;\n  } else {\n    return price * 0.05;\n  }\n}`,
  },
];

const diffColors = {
  easy: { bg: "bg-status-safe/10", text: "text-status-safe", label: "쉬움" },
  medium: { bg: "bg-toss-blue/10", text: "text-toss-blue", label: "보통" },
  hard: { bg: "bg-status-danger/10", text: "text-status-danger", label: "어려움" },
};

interface Props {
  onLoadCode?: (code: string) => void;
}

export default function LearningTasks({ onLoadCode }: Props) {
  const hints = useStore((s) => s.hints);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Generate tasks based on diagnosed patterns
    const diagCategories = new Set(
      hints.filter((h) => h.type === "diagnosis" && h.diagnosis).map((h) => h.diagnosis!.category)
    );

    let relevant = TASK_TEMPLATES;
    if (diagCategories.size > 0) {
      relevant = TASK_TEMPLATES.filter((t) => diagCategories.has(t.category));
      if (relevant.length < 3) relevant = TASK_TEMPLATES.slice(0, 4);
    }

    const completedIds = JSON.parse(localStorage.getItem("completed_tasks") || "[]") as string[];
    setTasks(
      relevant.map((t, i) => ({
        ...t,
        id: `task-${i}-${t.category}`,
        completed: completedIds.includes(`task-${i}-${t.category}`),
      }))
    );
  }, [hints]);

  const toggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    const completedIds = JSON.parse(localStorage.getItem("completed_tasks") || "[]") as string[];
    const task = tasks.find((t) => t.id === id);
    if (task?.completed) {
      localStorage.setItem("completed_tasks", JSON.stringify(completedIds.filter((c) => c !== id)));
    } else {
      localStorage.setItem("completed_tasks", JSON.stringify([...completedIds, id]));
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="py-2 space-y-2">
      {tasks.length > 0 && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-txt-tertiary">
            {completedCount}/{tasks.length} 완료
          </span>
          <div className="flex-1 mx-3 h-1 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-status-safe rounded-full transition-all"
              style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      {tasks.map((task) => {
        const dc = diffColors[task.difficulty];
        const isExpanded = expandedId === task.id;
        return (
          <div
            key={task.id}
            className={`rounded-xl transition-all ${task.completed ? "opacity-60" : ""} ${
              isExpanded ? "bg-bg-elevated" : "bg-bg-elevated/50 hover:bg-bg-elevated"
            }`}
          >
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : task.id)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                  task.completed ? "bg-status-safe border-status-safe" : "border-line-primary hover:border-toss-blue"
                }`}
              >
                {task.completed && <span className="text-white text-[10px]">✓</span>}
              </button>
              <span className={`text-xs font-bold flex-1 ${task.completed ? "line-through text-txt-tertiary" : "text-txt-primary"}`}>
                {task.title}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dc.bg} ${dc.text}`}>
                {dc.label}
              </span>
            </div>
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 animate-slide-up">
                <p className="text-[11px] text-txt-secondary leading-relaxed">{task.description}</p>
                <pre className="text-[11px] font-mono bg-bg-primary rounded-lg p-2 text-txt-secondary overflow-x-auto max-h-24 overflow-y-auto">
                  {task.starterCode}
                </pre>
                {onLoadCode && (
                  <button
                    onClick={() => onLoadCode(task.starterCode)}
                    className="text-[11px] font-bold text-toss-blue hover:text-toss-blue-light transition"
                  >
                    에디터에 불러오기 →
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {tasks.length === 0 && (
        <p className="text-txt-tertiary text-[11px] text-center py-4">코드를 제출하면 맞춤 학습이 생성됩니다</p>
      )}
    </div>
  );
}
