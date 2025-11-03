import { Outlet } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";

export default function RootLayout() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
