import { create } from "zustand";

interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
  course_id: number | null;
}

interface HintMessage {
  id: string;
  type: "hint" | "diagnosis" | "system";
  message: string;
  hint_level?: number;
  related_line?: number;
  diagnosis?: DiagnosisData;
  timestamp: number;
}

interface DiagnosisData {
  pathology_name: string;
  pathology_code: string;
  category: string;
  severity: string;
  symptom: string;
  root_cause: string;
  prescription: string;
  meta_insight: string;
  is_recurring: boolean;
  recurrence_count: number;
}

interface StudentStatus {
  id: number;
  name: string;
  status: "normal" | "stalled" | "danger";
  stall_min: number;
  errors: number;
}

interface AppState {
  // Auth
  token: string | null;
  user: UserInfo | null;
  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;

  // Student IDE
  code: string;
  language: string;
  heartbeatStatus: "normal" | "stalled" | "danger";
  hints: HintMessage[];
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  setHeartbeatStatus: (status: "normal" | "stalled" | "danger") => void;
  addHint: (hint: HintMessage) => void;

  // Instructor Dashboard
  students: StudentStatus[];
  setStudents: (students: StudentStatus[]) => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  token: localStorage.getItem("token"),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  // Student IDE
  code: "",
  language: "java",
  heartbeatStatus: "normal",
  hints: [],
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setHeartbeatStatus: (heartbeatStatus) => set({ heartbeatStatus }),
  addHint: (hint) => set((s) => ({ hints: [...s.hints, hint] })),

  // Instructor
  students: [],
  setStudents: (students) => set({ students }),
}));
