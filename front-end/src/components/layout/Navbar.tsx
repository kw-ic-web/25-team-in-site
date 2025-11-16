import { NavLink } from "react-router-dom";
import "./Navbar.css";

// person.png (랭킹에서 쓰던 이미지 재사용)
const personImg = new URL("../../assets/person.png", import.meta.url).href;

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
        {/* 왼쪽 로고 영역 */}
        <div className="topnav__brand">
          <span className="brand__mark">〉</span>
        </div>

        {/* 가운데 탭 영역 */}
        <nav className="topnav__tabs">
          {Tab("/home", "HOME")}
          {Tab("/mypage", "MY PAGE")}
          {Tab("/wrong", "COMMUNITY")}
        </nav>

        {/* 오른쪽 프로필 아바타 */}
        <div className="topnav__right">
          <img
            src={personImg}
            alt="사용자 프로필"
            className="topnav__avatar"
          />
        </div>
      </div>
    </header>
  );
}
