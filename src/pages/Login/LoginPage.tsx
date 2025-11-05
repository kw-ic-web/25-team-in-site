import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthContext";
import "./LoginPage.css";

const naverLogo = new URL("../../assets/logos/naver.png", import.meta.url).href;
const kakaoLogo = new URL("../../assets/logos/kakao.png", import.meta.url).href;

type LocationState = {
  from?: { pathname?: string };
  justRegistered?: boolean;
  registeredId?: string;
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as LocationState | undefined)?.from?.pathname ?? null;
  const [credentials, setCredentials] = useState({
    id: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const onChange =
    (key: "id" | "password") => (event: ChangeEvent<HTMLInputElement>) => {
      setCredentials((prev) => ({
        ...prev,
        [key]: event.target.value,
      }));
      setError(null);
    };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = login(credentials.id, credentials.password);
    if (!result.success) {
      setError(result.message);
      return;
    }
    const destination = from ?? "/home";
    navigate(destination, { replace: true });
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
            onClick={() => navigate("/register")}
          >
            회원가입
          </button>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-field">
            <span className="sr-only">ID</span>
            <input
              type="text"
              name="id"
              placeholder="ID를 입력해 주세요"
              required
              value={credentials.id}
              onChange={onChange("id")}
            />
          </label>
          <label className="login-field">
            <span className="sr-only">비밀번호</span>
            <input
              type="password"
              name="password"
              placeholder="비밀번호를 입력해 주세요"
              required
              value={credentials.password}
              onChange={onChange("password")}
            />
          </label>
          {error ? <p className="login-error" role="alert">{error}</p> : null}
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
            <img src={kakaoLogo} alt="" aria-hidden="true" />
            <span className="sr-only">카카오 로그인</span>
          </button>
          <button
            type="button"
            className="login-social__button login-social__button--naver"
            aria-label="네이버 로그인"
          >
            <img src={naverLogo} alt="" aria-hidden="true" />
            <span className="sr-only">네이버 로그인</span>
          </button>
          <button
            type="button"
            className="gsi-material-button"
            aria-label="구글 로그인"
          >
            <div className="gsi-material-button-state" />
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon" aria-hidden="true">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </div>
              <span className="sr-only">Sign in with Google</span>
            </div>
          </button>
        </div>

        <p className="login-register-link">
          아직 계정이 없으신가요?{" "}
          <Link to="/register" className="login-register-anchor">
            회원가입하기
          </Link>
        </p>
      </section>
    </div>
  );
}
