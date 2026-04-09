import axios from "axios";
import {
  MOCK_USERS, getMockStudentCard, getMockStudentDiagnoses, getMockStudentDetail,
  getMockCourseHeatmap, getMockEpidemiology, getMockCourseRisk, getMockComparative,
  getMockPathologyDetail, getMockCourseOverview, getMockDiagnosis,
} from "./mockData";

// Use mock when backend is unavailable
const USE_MOCK = true;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function mockResponse<T>(data: T) {
  return Promise.resolve({ data } as { data: T });
}

// Auth
export const login = (email: string, _password: string) => {
  if (USE_MOCK) {
    const allUsers = [MOCK_USERS.instructor, ...MOCK_USERS.students];
    const user = allUsers.find((u) => u.email === email) || allUsers[0];
    return mockResponse({ token: "mock-jwt-token", user });
  }
  return api.post("/auth/login", { email, password: _password });
};

export const register = (email: string, name: string, password: string, role: string) => {
  if (USE_MOCK) {
    return mockResponse({ token: "mock-jwt-token", user: { id: 99, email, name, role, course_id: 1 } });
  }
  return api.post("/auth/register", { email, name, password, role });
};

export const getMe = () => {
  if (USE_MOCK) {
    const stored = localStorage.getItem("mock_user");
    if (stored) return mockResponse(JSON.parse(stored));
    return mockResponse(MOCK_USERS.instructor);
  }
  return api.get("/auth/me");
};

// Submissions
export const submitCode = (code: string, language: string) => {
  if (USE_MOCK) {
    return new Promise<{ data: { diagnosis: ReturnType<typeof getMockDiagnosis> } }>((resolve) => {
      setTimeout(() => resolve({ data: { diagnosis: getMockDiagnosis(code, language) } }), 800);
    });
  }
  return api.post("/submissions", { code, language });
};

export const getSubmission = (id: number) => api.get(`/submissions/${id}`);

// Diagnoses
export const getStudentDiagnoses = (studentId: number, page = 1) => {
  if (USE_MOCK) return mockResponse(getMockStudentDiagnoses(studentId, page));
  return api.get(`/diagnoses/student/${studentId}`, { params: { page } });
};

export const getCourseHeatmap = (courseId: number) => {
  if (USE_MOCK) return mockResponse(getMockCourseHeatmap(courseId));
  return api.get(`/diagnoses/course/${courseId}/heatmap`);
};

export const getEpidemiology = (courseId: number) => {
  if (USE_MOCK) return mockResponse(getMockEpidemiology(courseId));
  return api.get(`/diagnoses/course/${courseId}/epidemiology`);
};

// Dashboard
export const getCourseOverview = (courseId: number) => {
  if (USE_MOCK) return mockResponse(getMockCourseOverview(courseId));
  return api.get(`/dashboard/course/${courseId}/overview`);
};

export const getStudentCard = (studentId: number) => {
  if (USE_MOCK) return mockResponse(getMockStudentCard(studentId));
  return api.get(`/dashboard/student/${studentId}/card`);
};

export const getCourseRisk = (courseId: number) => {
  if (USE_MOCK) return mockResponse(getMockCourseRisk(courseId));
  return api.get(`/dashboard/risk/course/${courseId}`);
};

// Detail Analysis
export const getStudentDetailAnalysis = (studentId: number) => {
  if (USE_MOCK) return mockResponse(getMockStudentDetail(studentId));
  return api.get(`/diagnoses/student/${studentId}/detail`);
};

export const getComparativeAnalysis = (courseId: number) => {
  if (USE_MOCK) return mockResponse(getMockComparative(courseId));
  return api.get(`/diagnoses/course/${courseId}/comparative`);
};

export const getPathologyDetail = (courseId: number, pathologyCode: string) => {
  if (USE_MOCK) return mockResponse(getMockPathologyDetail(courseId, pathologyCode));
  return api.get(`/diagnoses/course/${courseId}/pathology/${pathologyCode}`);
};

// Curriculum
export const uploadCurriculum = (courseId: number, documents: unknown[]) =>
  api.post(`/dashboard/courses/${courseId}/curriculum`, documents);

export default api;
