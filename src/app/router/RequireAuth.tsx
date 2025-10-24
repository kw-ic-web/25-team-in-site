import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

export default function RequireAuth() {
  const { token } = useAuth();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <Outlet />; // 통과 시 내부 라우트 렌더
}
