import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./stores/useStore";
import { ToastProvider } from "./components/Toast";
import Login from "./pages/Login";
import StudentIDE from "./pages/StudentIDE";
import InstructorDashboard from "./pages/InstructorDashboard";
import { useEffect, useState } from "react";
import { getMe } from "./services/api";

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role: string;
}) {
  const { token, user } = useStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user && user.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, user, setAuth, logout } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && !user) {
      getMe()
        .then((res) => setAuth(token, res.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentIDE />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor"
            element={
              <ProtectedRoute role="instructor">
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
