import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AppLayout from "../layouts/AppLayout";
import RequireAuth from "./RequireAuth";
import HomePage from "../../pages/Home/HomePage";
import LoginPage from "../../pages/Login/LoginPage";
import MyPage from "../../pages/MyPage/MyPage";
import WrongPage from "../../pages/Wrong/WrongPage";
import SolvePage from "../../pages/Solve/SolvePage";

export const router = createBrowserRouter([
  // 로그인 전 영역
  {
    element: <PublicLayout />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  // 로그인 후 보호 영역
  {
    element: <RequireAuth />,             // 가드
    children: [
      {
        element: <AppLayout />,           // 상단 탭 있는 레이아웃
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/mypage", element: <MyPage /> },
          { path: "/wrong", element: <WrongPage /> },
          { path: "/solve", element: <SolvePage /> },
        ],
      },
    ],
  },
  // 기본 루트 접근 시: 미로그인 → /login, 로그인 → /
  { path: "*", element: <Navigate to={"login"}  /> },
]);
