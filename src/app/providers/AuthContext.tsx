import { createContext, useContext, useEffect, useState } from "react";

type Auth = { token: string | null; login: (t: string) => void; logout: () => void };
const AuthCtx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(localStorage.getItem("token")); }, []);
  const login  = (t: string) => { localStorage.setItem("token", t); setToken(t); };
  const logout = () => { localStorage.removeItem("token"); setToken(null); };
  return <AuthCtx.Provider value={{ token, login, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
};
