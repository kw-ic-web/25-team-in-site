import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AppLayout from "../layouts/AppLayout";
import RequireAuth from "./RequireAuth";
import HomePage from "../../pages/Home/HomePage";
import LoginPage from "../../pages/Login/LoginPage";
import MyPage from "../../pages/MyPage/MyPage";
import WrongPage from "../../pages/Wrong/WrongPage";
import SolvePage from "../../pages/Solve/SolvePage";
import RegisterPage from "../../pages/Register/RegisterPage";
import StartPage from "../../pages/Start/Start";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  {
    element: <PublicLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />, // 인증이 필요한 그룹
    children: [
      {
        // AppLayout (Navbar 등)이 필요한 페이지들
        element: <AppLayout />,
        children: [
          { path: "/home", element: <HomePage /> },
          { path: "/mypage", element: <MyPage /> },
          { path: "/wrong", element: <WrongPage /> },
          { path: "/solve", element: <SolvePage /> },
        ],
      },
      {
        path: "/start",
        element: <StartPage />,
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);