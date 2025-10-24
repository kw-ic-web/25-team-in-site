import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as any)?.from?.pathname || "/";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login("dummy-token");   // 성공 시 토큰 저장
    nav(from, { replace: true }); // 원래 가려던 곳 or 홈
  };

  return (
    <form onSubmit={onSubmit} style={{ background:"#fff", padding:24, borderRadius:12, boxShadow:"0 10px 30px rgba(0,0,0,.08)" }}>
      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:16 }}>로그인</h1>
      <input placeholder="이메일" style={{ display:"block", width:280, marginBottom:10, padding:10 }} />
      <input placeholder="비밀번호" type="password" style={{ display:"block", width:280, marginBottom:14, padding:10 }} />
      <button style={{ width:280, padding:10, background:"#6366f1", color:"#fff", borderRadius:8 }}>로그인</button>
    </form>
  );
}
