import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

export default function RequireAuth() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
