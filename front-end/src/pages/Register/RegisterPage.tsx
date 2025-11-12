import {
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthContext";
import "./RegisterPage.css";

type IdCheckStatus = "idle" | "available" | "duplicate" | "empty";

export default function RegisterPage() {
  const { register, isIdAvailable } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: "",
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

  const onChange =
    (key: "id" | "password" | "confirm") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      setSubmitError(null);
      if (key === "id") {
        setIdCheckStatus("idle");
        setIdCheckMessage("");
        setCheckedId(null);
      }
    };

  const onPasswordBlur =
    (field: "password" | "confirm") =>
    (_event: FocusEvent<HTMLInputElement>) => {
      setPasswordBlurred((prev) => ({ ...prev, [field]: true }));
    };

  const handleCheckId = () => {
    const trimmed = form.id.trim();
    if (!trimmed) {
      setIdCheckStatus("empty");
      setIdCheckMessage("ID를 입력한 후 중복 확인을 진행해 주세요.");
      setCheckedId(null);
      return;
    }
    if (!isIdAvailable(trimmed)) {
      setIdCheckStatus("duplicate");
      setIdCheckMessage("이미 사용 중인 ID입니다.");
      setCheckedId(null);
      return;
    }
    setIdCheckStatus("available");
    setIdCheckMessage("사용 가능한 ID입니다.");
    setCheckedId(trimmed);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = register(form.id, form.password);
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    navigate("/start", { replace: true });
  };

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
    form.password !== "" &&
    form.confirm !== "" &&
    idCheckDone &&
    passwordsMatch;

  return (
    <div className="register-page">
      <div
        className="register-page__decor register-page__decor--stack"
        aria-hidden="true"
      />
      <div
        className="register-page__decor register-page__decor--bubble"
        aria-hidden="true"
      >
        <span className="register-page__bubble-dot" />
        <span className="register-page__bubble-dot" />
        <span className="register-page__bubble-dot" />
      </div>
      <div
        className="register-page__decor register-page__decor--brackets"
        aria-hidden="true"
      />
      <section className="register-card" aria-labelledby="register-title">
        <header className="register-card__header">
          <h1 id="register-title">회원가입</h1>
          <p>새 계정을 만들고 AI 학습 플랫폼을 시작해 보세요.</p>
        </header>

        <form className="register-form" onSubmit={onSubmit}>
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
            {idCheckMessage ? (
              <p
                className={`register-helper ${
                  idCheckStatus === "available"
                    ? "register-helper--success"
                    : "register-helper--error"
                }`}
              >
                {idCheckMessage}
              </p>
            ) : null}
          </div>

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
            {showPasswordFeedback ? (
              <p
                className={`register-helper ${
                  passwordsMatch
                    ? "register-helper--success"
                    : "register-helper--error"
                }`}
              >
                {passwordFeedbackMessage}
              </p>
            ) : null}
          </div>

          {submitError ? (
            <p className="register-submit-error" role="alert">
              {submitError}
            </p>
          ) : null}

          <button type="submit" className="register-submit" disabled={!canSubmit}>
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