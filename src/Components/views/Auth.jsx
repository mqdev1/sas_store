import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../lib/i18n";
import {
    LayoutDashboard,
    User,
    Lock,
    Mail,
    Eye,
    EyeOff,
    Loader2,
    LogIn,
    UserPlus,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { loginUser, registerUser, clearError } from "../../Store/AuthSlice";
import * as authService from "../../Services/AuthService";

// ============================================
// Field
// ============================================
function Field({ icon: Icon, endAdornment, label, error, ...inputProps }) {
    return (
        <div className="flex w-full flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={inputProps.name}
                    className="ps-1 text-xs font-medium text-(--text-secondary)"
                >
                    {label}
                </label>
            )}

            <div className="relative flex w-full items-center">
                <Icon
                    size={17}
                    className="pointer-events-none absolute inset-s-3 text-(--text-muted)"
                />
                <input
                    {...inputProps}
                    id={inputProps.name}
                    className={`box-border w-full rounded-xl border p-2 ps-10 pe-10 text-sm
                        bg-(--bg-elevated)
                        text-(--text-primary)
                        placeholder:text-(--text-muted)
                        outline-0 transition-colors
                        disabled:opacity-60
                        ${error
                            ? "border-(--color-error) focus:border-(--color-error)"
                            : "border-(--bg-border) focus:border-(--color-lavender)"
                        }`}
                />
                {endAdornment && (
                    <div className="absolute inset-e-3 flex items-center">
                        {endAdornment}
                    </div>
                )}
            </div>

            {error && (
                <span className="ps-1 text-xs text-(--color-error)">
                    {error}
                </span>
            )}
        </div>
    );
}

// ============================================
// StatusBanner
// ============================================
function StatusBanner({ type = "error", children }) {
    const isSuccess = type === "success";
    return (
        <div
            role={isSuccess ? "status" : "alert"}
            aria-live="polite"
            className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${isSuccess
                ? "border-(--color-success)/40 bg-(--color-success)/5"
                : "border-(--color-error)/40 bg-(--color-error)/5"
                }`}
        >
            {isSuccess ? (
                <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-(--color-success)"
                />
            ) : (
                <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-(--color-error)"
                />
            )}
            <div className="flex-1 text-(--text-primary)">{children}</div>
        </div>
    );
}

// ============================================
// PrimaryButton
// ============================================
function PrimaryButton({ loading, icon: Icon, children, ...props }) {
    return (
        <button
            {...props}
            disabled={loading || props.disabled}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full p-3 text-sm font-bold
                bg-(--color-lavender) text-white
                shadow-sm transition-all hover:opacity-90 active:scale-[0.98]
                disabled:cursor-not-allowed disabled:opacity-60"
        >
            {loading ? (
                <Loader2 size={18} className="animate-spin" />
            ) : (
                Icon && <Icon size={18} />
            )}
            {children}
        </button>
    );
}

// ============================================
// LoginForm
// ============================================
function LoginForm() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const { user, session, loading, error: reduxError } = useSelector(
        (s) => s.auth
    );

    const [form, setForm] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [localError, setLocalError] = useState("");

    const updateField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    useEffect(() => {
        if (user && session) {
            let from = location.state?.from?.pathname || "/";

            // ✅ لو from = "/auth" (مسار غير موجود) → استخدم "/"
            if (from === "/auth" || from === "/login") {
                from = "/";
            }

            console.log("🟢 [LoginForm] navigating to:", from);
            navigate(from, { replace: true });
        }
    }, [user, session, navigate, location]);

    useEffect(() => {
        return () => dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        const saved = localStorage.getItem("remember_email");
        if (saved) setForm((f) => ({ ...f, email: saved }));
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setLocalError("");
        dispatch(clearError());

        if (!form.email || !form.password) {
            setLocalError(t("auth.errors.emailPasswordRequired"));
            return;
        }

        const result = await dispatch(
            loginUser({ email: form.email, password: form.password })
        );

        if (loginUser.fulfilled.match(result)) {
            if (rememberMe) {
                localStorage.setItem("remember_email", form.email);
            } else {
                localStorage.removeItem("remember_email");
            }
        }
    };

    const error = localError || reduxError;

    return (
        <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            <Field
                icon={Mail}
                type="email"
                name="email"
                label={t("auth.email")}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                autoFocus
                value={form.email}
                onChange={updateField("email")}
                disabled={loading}
            />

            <Field
                icon={Lock}
                type={showPassword ? "text" : "password"}
                name="password"
                label={t("auth.password")}
                placeholder={t("auth.passwordPlaceholder")}
                autoComplete="current-password"
                value={form.password}
                onChange={updateField("password")}
                disabled={loading}
                endAdornment={
                    <button
                        type="button"
                        className="cursor-pointer text-(--text-muted) hover:text-(--color-lavender)"
                        onClick={() => setShowPassword((s) => !s)}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                }
            />

            <div className="-mt-1 flex items-center justify-between text-sm">
                <label className="flex cursor-pointer select-none items-center gap-2 text-(--text-secondary)">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe((r) => !r)}
                        className="h-4 w-4 cursor-pointer rounded accent-(--color-lavender)"
                    />
                    {t("auth.rememberMe")}
                </label>
                <button
                    type="button"
                    onClick={() => alert(t("auth.forgotPassword"))}
                    className="cursor-pointer text-(--color-lavender) hover:underline"
                >
                    {t("auth.forgotPassword")}
                </button>
            </div>

            {error && <StatusBanner type="error">{error}</StatusBanner>}

            <PrimaryButton type="submit" loading={loading} icon={LogIn}>
                {t("auth.loginButton")}
            </PrimaryButton>
        </form>
    );
}

// ============================================
// RegisterForm
// ============================================
function RegisterForm() {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const { loading, error: reduxError } = useSelector((s) => s.auth);

    const emptyForm = {
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        password: "",
        confirm: "",
    };

    const [form, setForm] = useState(emptyForm);
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState("");
    const [success, setSuccess] = useState(false);

    const updateField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    useEffect(() => {
        return () => dispatch(clearError());
    }, [dispatch]);

    const submit = async (e) => {
        e.preventDefault();
        setLocalError("");
        setSuccess(false);
        dispatch(clearError());

        if (
            !form.firstName ||
            !form.lastName ||
            !form.email ||
            !form.username ||
            !form.password
        ) {
            setLocalError(t("auth.errors.allFieldsRequired"));
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(form.email)) {
            setLocalError(t("auth.errors.invalidEmail"));
            return;
        }

        if (form.username.length < 3) {
            setLocalError(t("auth.errors.usernameMin"));
            return;
        }

        if (form.password.length < 6) {
            setLocalError(t("auth.errors.passwordMin"));
            return;
        }

        if (form.password !== form.confirm) {
            setLocalError(t("auth.errors.passwordMismatch"));
            return;
        }

        const result = await dispatch(registerUser(form));

        if (registerUser.fulfilled.match(result)) {
            if (result.payload?.session) {
                try {
                    await authService.logoutRequest();
                } catch (err) {
                    console.warn("Logout after register failed:", err);
                }
            }
            setSuccess(true);
            setForm(emptyForm);
        }
    };

    const error = localError || reduxError;

    return (
        <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            <div className="grid grid-cols-2 gap-3">
                <Field
                    icon={User}
                    type="text"
                    name="firstName"
                    placeholder={t("auth.firstName")}
                    value={form.firstName}
                    onChange={updateField("firstName")}
                    disabled={loading || success}
                />
                <Field
                    icon={User}
                    type="text"
                    name="lastName"
                    placeholder={t("auth.lastName")}
                    value={form.lastName}
                    onChange={updateField("lastName")}
                    disabled={loading || success}
                />
            </div>

            <Field
                icon={Mail}
                type="email"
                name="email"
                placeholder={t("auth.email")}
                value={form.email}
                onChange={updateField("email")}
                disabled={loading || success}
            />

            <Field
                icon={User}
                type="text"
                name="username"
                placeholder={t("auth.username")}
                value={form.username}
                onChange={updateField("username")}
                disabled={loading || success}
            />

            <Field
                icon={Lock}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t("auth.password")}
                value={form.password}
                onChange={updateField("password")}
                disabled={loading || success}
                endAdornment={
                    <button
                        type="button"
                        className="cursor-pointer text-(--text-muted) hover:text-(--color-lavender)"
                        onClick={() => setShowPassword((s) => !s)}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                }
            />

            <Field
                icon={Lock}
                type={showPassword ? "text" : "password"}
                name="confirm"
                placeholder={t("auth.confirmPassword")}
                value={form.confirm}
                onChange={updateField("confirm")}
                disabled={loading || success}
            />

            {error && <StatusBanner type="error">{error}</StatusBanner>}

            {success && (
                <StatusBanner type="success">
                    <b className="block">{t("auth.successRegister")}</b>
                    <span className="mt-1 block text-xs text-(--text-muted)">
                        {t("auth.successRegisterMsg")}
                    </span>
                </StatusBanner>
            )}

            <PrimaryButton
                type="submit"
                loading={loading}
                icon={UserPlus}
                disabled={success}
            >
                {success ? t("auth.registeredButton") : t("auth.registerButton")}
            </PrimaryButton>
        </form>
    );
}

// ============================================
// Auth
// ============================================
export default function Auth() {
    const [activeTab, setActiveTab] = useState("login");
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const tabs = [
        { key: "login", label: t("auth.login") },
        { key: "register", label: t("auth.register") },
    ];

    const handleTabChange = (key) => {
        dispatch(clearError());
        setActiveTab(key);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-(--bg-main) p-4">
            <div className="w-full max-w-md">
                <div className="mb-6 flex flex-col items-center gap-2">
                    <div className="rounded-2xl border border-(--bg-border) bg-(--bg-card) p-3 shadow-xs">
                        <LayoutDashboard
                            className="text-(--color-lavender)"
                            size={28}
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-(--text-primary)">
                        {t("auth.brandTitle")}
                    </h1>
                    <p className="text-sm text-(--text-muted)">
                        {t("auth.brandSubtitle")}
                    </p>
                </div>

                <div className="rounded-2xl border border-(--bg-border) bg-(--bg-card) p-6 shadow-sm md:p-8">
                    <div
                        role="tablist"
                        className="mb-6 flex gap-1 rounded-full border border-(--bg-border) bg-(--bg-main) p-1"
                    >
                        {tabs.map(({ key, label }) => {
                            const isActive = activeTab === key;
                            return (
                                <button
                                    key={key}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => handleTabChange(key)}
                                    className={`flex-1 cursor-pointer rounded-full px-3 py-2 text-sm transition-all ${isActive
                                        ? "bg-(--color-lavender) font-bold text-white shadow-sm"
                                        : "text-(--text-secondary) hover:text-(--color-lavender)"
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {activeTab === "login" ? <LoginForm /> : <RegisterForm />}
                </div>

                <p className="mt-4 text-center text-xs leading-relaxed text-(--text-muted)">
                    {t("auth.securedBy")}
                </p>
            </div>
        </div>
    );
}