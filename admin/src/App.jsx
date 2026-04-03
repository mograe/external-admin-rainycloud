import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import LogsPage from "./pages/LogsPage";
import LogDetailsPage from "./pages/LogDetailsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <LogsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/logs/:id"
        element={
          <ProtectedRoute>
            <LogDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/logs" replace />} />
    </Routes>
  );
}