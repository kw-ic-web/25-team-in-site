import { NavLink } from "react-router-dom";
import "./Navbar.css"; // 아래 CSS 파일

const Tab = (to: string, label: string) => (
  <NavLink
    to={to}
    className={({ isActive }: { isActive: boolean }) =>
      `topnav__tab ${isActive ? "is-active" : ""}`
    }
    end
  >
    {label}
  </NavLink>
);

export default function Navbar() {
  return (
    <header className="topnav">
      <div className="topnav__inner">
        <div className="topnav__brand">
          {/* 로고 아이콘 자리 (필요하면 이미지로 교체) */}
          <span className="brand__mark">〉</span>
        </div>

        <nav className="topnav__tabs">
          {Tab("/", "HOME")}
          {Tab("/mypage", "MY PAGE")}
          {Tab("/wrong", "COMMUNITY" /* or WRONG */)}
        </nav>

        <div className="topnav__right">
          {/* 우측 아바타/버튼 공간 */}
          <div className="avatar" aria-label="user" />
        </div>
      </div>
    </header>
  );
}
