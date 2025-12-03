import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
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
import { usePageView } from "../analytics/usePageView";

function AnalyticsLayout() {
  usePageView();
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <AnalyticsLayout />,
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },
      {
        element: <PublicLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/home", element: <HomePage /> },
              { path: "/mypage", element: <MyPage /> },
              { path: "/wrong", element: <WrongPage /> },
              { path: "/solve", element: <SolvePage /> },
            ],
          },
          { path: "/start", element: <StartPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },
]);
