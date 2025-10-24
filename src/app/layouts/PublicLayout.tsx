import { Outlet } from "react-router-dom";
export default function PublicLayout() {
  return (
    <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:"#f3f4f6" }}>
      <Outlet />
    </div>
  );
}
