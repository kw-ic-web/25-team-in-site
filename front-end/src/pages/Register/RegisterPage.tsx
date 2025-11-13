import {
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authAPI } from "../../api/auth";
import "./RegisterPage.css";

type IdCheckStatus = "idle" | "available" | "duplicate" | "empty";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [idCheckStatus, setIdCheckStatus] = useState<IdCheckStatus>("idle");
  const [idCheckMessage, setIdCheckMessage] = useState<string>("");
  const [checkedId, setCheckedId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordBlurred, setPasswordBlurred] = useState({
    password: false,
    confirm: false,
  });

  /** 입력값 변경 핸들러 */
  const onChange =
    (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      setSubmitError(null);

      // ID 바꾸면 중복확인 상태 초기화
      if (key === "id") {
        setIdCheckStatus("idle");
        setIdCheckMessage("");
        setCheckedId(null);
      }
    };

  /** 비밀번호 blur 시 피드백 활성화 */
  const onPasswordBlur =
    (field: "password" | "confirm") =>
    (_event: FocusEvent<HTMLInputElement>) => {
      setPasswordBlurred((prev) => ({ ...prev, [field]: true }));
    };

  /** 아이디 중복확인 */
  const handleCheckId = async () => {
    const trimmed = form.id.trim();
    if (!trimmed) {
      setIdCheckStatus("empty");
      setIdCheckMessage("ID를 입력한 후 중복 확인을 진행해 주세요.");
      setCheckedId(null);
      return;
    }

    try {
      const res = await authAPI.checkId(trimmed);
      if (res.data?.available) {
        setIdCheckStatus("available");
        setIdCheckMessage("사용 가능한 ID입니다.");
        setCheckedId(trimmed);
      } else {
        setIdCheckStatus("duplicate");
        setIdCheckMessage("이미 사용 중인 ID입니다.");
        setCheckedId(null);
      }
    } catch (_error) {
      setIdCheckStatus("duplicate");
      setIdCheckMessage("중복 확인 중 오류가 발생했습니다.");
    }
  };

  /** 회원가입 제출 */
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedId = form.id.trim();
    if (!trimmedId || !form.email || !form.password) {
      setSubmitError("모든 필드를 입력해 주세요.");
      return;
    }

    try {
      const res = await authAPI.register({
        user_id: trimmedId,
        email: form.email.trim(),
        password: form.password,
        language: "py",
        level: 4,
        purpose: "prob",
      });

      if (res.status === 200 || res.status === 201) {
        navigate("/start", { replace: true });
      }
    } catch (error: unknown) {
      // no-explicit-any 해결 → unknown 사용
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
        setSubmitError(msg);
      } else {
        setSubmitError("알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  // 상태 계산
  const idCheckDone =
    idCheckStatus === "available" && checkedId === form.id.trim();
  const passwordsMatch =
    form.password !== "" &&
    form.confirm !== "" &&
    form.password === form.confirm;
  const showPasswordFeedback =
    passwordBlurred.password || passwordBlurred.confirm;

  const passwordFeedbackMessage = passwordsMatch
    ? "비밀번호가 일치합니다."
    : form.password === "" || form.confirm === ""
    ? "비밀번호를 모두 입력해 주세요."
    : "비밀번호가 일치하지 않습니다.";

  const canSubmit =
    form.id.trim() !== "" &&
    form.email.trim() !== "" &&
    form.password !== "" &&
    form.confirm !== "" &&
    idCheckDone &&
    passwordsMatch;

  /** JSX */
  return (
    <div className="register-page">
      <section className="register-card" aria-labelledby="register-title">
        <header className="register-card__header">
          <h1 id="register-title">회원가입</h1>
          <p>새 계정을 만들고 서비스를 시작해 보세요.</p>
        </header>

        {/* form에 onSubmit 연결 */}
        <form className="register-form" onSubmit={onSubmit}>
          {/* ID */}
          <div className="register-field">
            <label htmlFor="register-id">ID</label>
            <div className="register-field__input-group">
              <input
                id="register-id"
                type="text"
                value={form.id}
                onChange={onChange("id")}
                placeholder="사용하실 ID를 입력해 주세요"
                required
              />
              <button
                type="button"
                className="register-id-check"
                onClick={handleCheckId}
              >
                중복확인
              </button>
            </div>
            {idCheckMessage && (
              <p
                className={`register-helper ${
                  idCheckStatus === "available"
                    ? "register-helper--success"
                    : "register-helper--error"
                }`}
              >
                {idCheckMessage}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="register-field">
            <label htmlFor="register-email">이메일</label>
            <input
              id="register-email"
              type="email"
              value={form.email}
              onChange={onChange("email")}
              placeholder="이메일을 입력해 주세요"
              required
            />
          </div>

          {/* Password */}
          <div className="register-field">
            <label htmlFor="register-password">비밀번호</label>
            <input
              id="register-password"
              type="password"
              value={form.password}
              onChange={onChange("password")}
              onBlur={onPasswordBlur("password")}
              placeholder="비밀번호를 입력해 주세요"
              required
            />
          </div>

          {/* Password Confirm */}
          <div className="register-field">
            <label htmlFor="register-confirm">비밀번호 확인</label>
            <input
              id="register-confirm"
              type="password"
              value={form.confirm}
              onChange={onChange("confirm")}
              onBlur={onPasswordBlur("confirm")}
              placeholder="비밀번호를 다시 입력해 주세요"
              required
            />
            {showPasswordFeedback && (
              <p
                className={`register-helper ${
                  passwordsMatch
                    ? "register-helper--success"
                    : "register-helper--error"
                }`}
              >
                {passwordFeedbackMessage}
              </p>
            )}
          </div>

          {/* Error */}
          {submitError && (
            <p className="register-submit-error" role="alert">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            className="register-submit"
            disabled={!canSubmit}
          >
            회원가입 완료
          </button>
        </form>

        <button
          type="button"
          className="register-back-login"
          onClick={() => navigate("/login")}
        >
          이미 계정이 있으신가요? 로그인하기
        </button>
      </section>
    </div>
  );
}
