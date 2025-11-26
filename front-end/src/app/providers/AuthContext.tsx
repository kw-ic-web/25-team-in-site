import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { userStore, type StoredUser } from "../services/userStore";

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

export type RegisterResult =
  | { success: true; message?: string }
  | { success: false; message: string };

type AuthContextValue = {
  currentUser: string | null;
  login: (id: string, password: string) => LoginResult;
  logout: () => void;
  register: (id: string, password: string) => RegisterResult;
  isIdAvailable: (id: string) => boolean;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

const initialUsers = () => userStore.loadUsers();
const initialCurrentUser = () => userStore.loadCurrentUser();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<StoredUser[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<string | null>(
    initialCurrentUser,
  );

  useEffect(() => {
    setUsers(userStore.loadUsers());
    setCurrentUser(userStore.loadCurrentUser());
  }, []);

  const isIdAvailable = useCallback(
    (id: string) => !users.some((user) => user.id === id.trim()),
    [users],
  );

  const login = useCallback(
    (id: string, password: string): LoginResult => {
      const trimmedId = id.trim();
      if (!trimmedId) {
        return { success: false, message: "ID를 입력해 주세요." };
      }
      const target = users.find((user) => user.id === trimmedId);
      if (!target) {
        return { success: false, message: "존재하지 않는 ID입니다." };
      }
      if (target.password !== password) {
        return { success: false, message: "비밀번호가 일치하지 않습니다." };
      }
      setCurrentUser(trimmedId);
      userStore.saveCurrentUser(trimmedId);
      return { success: true };
    },
    [users],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    userStore.clearCurrentUser();
  }, []);

  const register = useCallback(
    (id: string, password: string): RegisterResult => {
      const trimmedId = id.trim();
      if (!trimmedId) {
        return { success: false, message: "ID를 입력해 주세요." };
      }
      if (!password) {
        return { success: false, message: "비밀번호를 입력해 주세요." };
      }
      if (!isIdAvailable(trimmedId)) {
        return { success: false, message: "이미 사용 중인 ID입니다." };
      }

      const nextUsers = [...users, { id: trimmedId, password }];
      setUsers(nextUsers);
      userStore.saveUsers(nextUsers);

      return { success: true, message: "회원가입이 완료되었습니다." };
    },
    [isIdAvailable, users],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      login,
      logout,
      register,
      isIdAvailable,
    }),
    [currentUser, login, logout, register, isIdAvailable],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
};
