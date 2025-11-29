import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { authAPI } from "../../api/auth";
import { toast } from "react-toastify";
import "./LoginPage.css";
import { useAuth } from "../../app/providers/AuthContext";

const naverLogo = new URL("../../assets/logos/naver.png", import.meta.url).href;
const kakaoLogo = new URL("../../assets/logos/kakao.png", import.meta.url).href;
const insiteLoginLogo = new URL(
  "../../assets/logos/insite_login_logo.png",
  import.meta.url
).href;
const loginTopIllustration = new URL(
  "../../assets/login/login1.png",
  import.meta.url
).href;
const loginStackIllustration = new URL(
  "../../assets/login/login2.png",
  import.meta.url
).href;
const loginBracketsIllustration = new URL(
  "../../assets/login/login3.png",
  import.meta.url
).href;

interface User {
  user_id: string;
  email: string;
}

type LocationState = {
  from?: { pathname?: string };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { setCurrentUser } = useAuth();

  const from =
    (location.state as LocationState | undefined)?.from?.pathname ?? "/home";

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const onChange =
    (key: "email" | "password") => (event: ChangeEvent<HTMLInputElement>) => {
      setCredentials((prev) => ({ ...prev, [key]: event.target.value }));
      setError(null);
    };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const res = await authAPI.login({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (res.status === 200 || res.status === 201) {
        // 서버 응답 그대로 사용
        const user: User = {
          user_id: res.data.user_id,
          email: res.data.email,
        };

        // 로그인 상태 저장
        setCurrentUser(user);
        localStorage.setItem("currentUser", JSON.stringify(user));

        toast.success("로그인 성공!");
        navigate(from, { replace: true });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message || "로그인 중 오류가 발생했습니다."
        );
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="login-page">
      <div
        className="login-page__decor login-page__decor--stack"
        aria-hidden="true"
      >
        <img src={loginStackIllustration} alt="" />
      </div>
      <div
        className="login-page__decor login-page__decor--bubble"
        aria-hidden="true"
      >
        <img src={loginTopIllustration} alt="" />
      </div>
      <div
        className="login-page__decor login-page__decor--brackets"
        aria-hidden="true"
      >
        <img src={loginBracketsIllustration} alt="" />
      </div>

      <section className="login-card" aria-labelledby="login-title">
        <header className="login-card__header">
          <img
            src={insiteLoginLogo}
            alt="INSITE 로고"
            className="login-card__logo"
          />
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
              placeholder="이메일을 입력해주세요"
              required
              value={credentials.email}
              onChange={onChange("email")}
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

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

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
          >
            <img src={kakaoLogo} alt="" aria-hidden="true" />
            <span className="sr-only">카카오 로그인</span>
          </button>
          <button
            type="button"
            className="login-social__button login-social__button--naver"
          >
            <img src={naverLogo} alt="" aria-hidden="true" />
            <span className="sr-only">네이버 로그인</span>
          </button>
          <button type="button" className="gsi-material-button">
            <div className="gsi-material-button-state" />
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon" aria-hidden="true">
                {/* svg 생략 */}
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
