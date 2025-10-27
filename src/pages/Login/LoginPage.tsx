import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthContext";
import "./LoginPage.css";

type LocationState = {
  from?: { pathname?: string };
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as LocationState | undefined)?.from?.pathname ?? "/";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login("dummy-token");
    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
      <div
        className="login-page__decor login-page__decor--stack"
        aria-hidden="true"
      />
      <div
        className="login-page__decor login-page__decor--bubble"
        aria-hidden="true"
      >
        <span className="login-page__bubble-dot" />
        <span className="login-page__bubble-dot" />
        <span className="login-page__bubble-dot" />
      </div>
      <div
        className="login-page__decor login-page__decor--brackets"
        aria-hidden="true"
      />
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-card__header">
          <h1 id="login-title">코딩도우미</h1>
          <p>AI 기반 코딩 학습 플랫폼</p>
        </header>

        <div className="login-card__tabs" role="tablist" aria-label="계정 작업">
          <button
            type="button"
            className="login-card__tab login-card__tab--active"
            aria-selected="true"
          >
            로그인
          </button>
          <button
            type="button"
            className="login-card__tab"
            aria-selected="false"
          >
            회원가입
          </button>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-field">
            <span className="sr-only">이메일</span>
            <input
              type="email"
              name="email"
              placeholder="이메일을 입력해 주세요"
              required
            />
          </label>
          <label className="login-field">
            <span className="sr-only">비밀번호</span>
            <input
              type="password"
              name="password"
              placeholder="비밀번호를 입력해 주세요"
              required
            />
          </label>
          <button type="submit" className="login-submit">
            로그인
          </button>
        </form>

        <div className="login-divider">
          <span>또는</span>
        </div>

        <div className="login-social">
          <button
            type="button"
            className="login-social__button login-social__button--kakao"
            aria-label="카카오 로그인"
          >
            K
          </button>
          <button
            type="button"
            className="login-social__button login-social__button--naver"
            aria-label="네이버 로그인"
          >
            N
          </button>
          <button
            type="button"
            className="login-social__button login-social__button--google"
            aria-label="구글 로그인"
          >
            G
          </button>
          
        </div>
      </section>
    </div>
  );
}
