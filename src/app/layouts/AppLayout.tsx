import { Outlet } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />    {/* 여기 상단 탭 */}
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
