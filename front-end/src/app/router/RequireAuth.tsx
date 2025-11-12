import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

export default function RequireAuth() {
  const { currentUser } = useAuth();
  const loc = useLocation();
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return <Outlet />;
}
