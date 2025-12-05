import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

export default function RequireAuth() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
