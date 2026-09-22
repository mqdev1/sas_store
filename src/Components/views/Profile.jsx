import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Edit,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Lock,
    Eye,
    EyeOff,
    Shield,
    Camera,
    Clock,
    LogOut,
    KeyRound,
    Bell,
    Activity as ActivityIcon,
    Award,
} from "lucide-react";

// Services
import * as authService from "../../Services/AuthService";
import * as usersService from "../../Services/usersService";
import * as storageService from "../../Services/storageService";
import { logoutUser } from "../../Store/AuthSlice";

// ============================================
// حقل إدخال موحّد
// ============================================
function Field({
    icon: Icon,
    label,
    error,
    as: Component = "input",
    endAdornment,
    ...inputProps
}) {
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
                {Icon && (
                    <Icon
                        size={17}
                        className="pointer-events-none absolute inset-s-3 text-(--text-muted)"
                    />
                )}
                <Component
                    {...inputProps}
                    id={inputProps.name}
                    className={`box-border w-full rounded-xl border p-2 ps-10 ${endAdornment ? "pe-10" : ""
                        } text-sm
                        bg-(--bg-elevated) text-(--text-primary)
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
// بطاقة إحصائية مصغّرة
// ============================================
function MiniStat({ icon: Icon, label, value, color, loading }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-(--bg-border) bg-(--bg-card) p-3">
            <div className={`rounded-lg p-2 ${color}`}>
                <Icon size={16} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-(--text-muted)">{label}</span>
                {loading ? (
                    <div className="mt-1 h-4 w-16 animate-pulse rounded bg-(--bg-hover)" />
                ) : (
                    <span className="text-sm font-bold text-(--text-primary)">
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================
// التبويبات
// ============================================
const TABS = [
    { key: "overview", icon: User },
    { key: "edit", icon: Edit },
    { key: "security", icon: Shield },
    { key: "activity", icon: ActivityIcon },
];

// ============================================
// الصفحة
// ============================================
export default function Profile() {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isRTL = i18n.language === "ar";
    const locale = isRTL ? "ar-EG" : "en-US";

    // ✅ المستخدم من Redux
    const authUser = useSelector((s) => s.auth.user);
    const authLoading = useSelector((s) => s.auth.loading);

    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // ✅ كلمة المرور
    const [pwd, setPwd] = useState({ current: "", new: "", confirm: "" });
    const [showPwd, setShowPwd] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState("");
    const [pwdSuccess, setPwdSuccess] = useState(false);

    // ============================================
    // تحميل الملف الشخصي
    // ============================================
    const loadProfile = useCallback(async () => {
        if (!authUser?.id) return;

        setLoading(true);
        setError("");

        try {
            const data = await usersService.getById(authUser.id);
            setProfile(data);
            setForm(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authUser?.id]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // ✅ تحديث الحقول
    const update = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    // ✅ تحقق التغييرات
    const isDirty = useMemo(() => {
        if (!profile || !form) return false;
        return JSON.stringify(profile) !== JSON.stringify(form);
    }, [profile, form]);

    // ============================================
    // حفظ البيانات
    // ============================================
    const handleSave = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!form.first_name?.trim())
            return setError(t("profile.required.firstName"));
        if (!form.last_name?.trim())
            return setError(t("profile.required.lastName"));
        if (!form.email?.trim())
            return setError(t("profile.required.email"));
        if (!/^\S+@\S+\.\S+$/.test(form.email))
            return setError(t("profile.required.emailInvalid"));

        setSaving(true);
        try {
            const updated = await usersService.update(authUser.id, {
                first_name: form.first_name,
                last_name: form.last_name,
                username: form.username,
                email: form.email,
                phone: form.phone,
                address: form.address,
                bio: form.bio,
            });

            setProfile(updated);
            setForm(updated);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2500);
        } catch (err) {
            setError(err.message || t("profile.errors.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // رفع الصورة الشخصية
    // ============================================
    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        setError("");

        try {
            const { url } = await storageService.upload(
                file,
                `avatars/${authUser.id}`
            );

            const updated = await usersService.update(authUser.id, {
                avatar_url: url,
            });

            setProfile(updated);
            setForm(updated);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploadingAvatar(false);
            e.target.value = "";
        }
    };

    // ============================================
    // تغيير كلمة المرور
    // ============================================
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwdError("");
        setPwdSuccess(false);

        if (!pwd.new || pwd.new.length < 6)
            return setPwdError(t("profile.required.passwordMin"));
        if (pwd.new !== pwd.confirm)
            return setPwdError(t("profile.required.passwordMismatch"));

        setPwdLoading(true);
        try {
            await authService.changePassword(pwd.new);
            setPwdSuccess(true);
            setPwd({ current: "", new: "", confirm: "" });
            setTimeout(() => setPwdSuccess(false), 2500);
        } catch (err) {
            setPwdError(
                err.message || t("profile.errors.passwordChangeFailed")
            );
        } finally {
            setPwdLoading(false);
        }
    };

    // ✅ إلغاء التعديلات
    const resetForm = () => {
        setForm(profile);
        setError("");
    };

    // ============================================
    // تسجيل خروج
    // ============================================
    const logout = async () => {
        if (!confirm(t("profile.logoutConfirm"))) return;
        await dispatch(logoutUser());
        navigate("/auth", { replace: true });
    };

    // ============================================
    // Loading state
    // ============================================
    if (loading || authLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-(--bg-border) border-t-(--color-lavender)" />
                    <p className="text-sm text-(--text-muted)">
                        {t("profile.loading")}
                    </p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <AlertCircle size={48} className="text-(--text-muted)" />
                    <p className="text-sm text-(--text-muted)">
                        {t("profile.loadError")}
                    </p>
                    <button
                        onClick={loadProfile}
                        className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                    >
                        {t("profile.retry")}
                    </button>
                </div>
            </div>
        );
    }

    // ✅ اشتقاق الاسم الكامل
    const fullName =
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
        profile.username ||
        t("profile.user");

    const avatarInitials =
        `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""
            }`.toUpperCase() || "?";

    const profileColor = profile.color || "#6366F1";

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <User
                            size={22}
                            className="text-(--color-lavender)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("profile.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("profile.subtitle")}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--color-error) transition-colors hover:bg-(--color-error) hover:text-white"
                >
                    <LogOut size={14} />
                    <span>{t("profile.logout")}</span>
                </button>
            </div>

            {/* بطاقة الهوية */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-(--bg-border) bg-(--bg-card) shadow-xs">
                <div
                    className="h-28"
                    style={{
                        background: `linear-gradient(135deg, ${profileColor} 0%, #8B5CF6 100%)`,
                    }}
                />

                <div className="relative px-4 pb-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="flex items-end gap-4">
                            {/* الأفاتار */}
                            <div className="relative -mt-12">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={fullName}
                                        className="mt-10 h-24 w-24 rounded-2xl border-4 border-(--bg-card) object-cover shadow-sm"
                                    />
                                ) : (
                                    <div
                                        className="mt-10 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-(--bg-card) text-4xl font-bold text-white shadow-sm"
                                        style={{
                                            background: profileColor,
                                        }}
                                    >
                                        {avatarInitials}
                                    </div>
                                )}

                                <label
                                    className={`absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-(--bg-card) bg-(--color-lavender) text-white transition-opacity hover:opacity-90 ${uploadingAvatar
                                            ? "opacity-60"
                                            : ""
                                        }`}
                                    title={t("profile.changeAvatar")}
                                >
                                    {uploadingAvatar ? (
                                        <Loader2
                                            size={13}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Camera size={13} />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                        disabled={uploadingAvatar}
                                    />
                                </label>
                            </div>

                            {/* الاسم والدور */}
                            <div className="pb-1">
                                <h2 className="text-xl font-bold text-(--text-primary)">
                                    {fullName}
                                </h2>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                    {profile.role && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-(--color-lavender)/10 px-2 py-0.5 text-xs font-medium text-(--color-lavender)">
                                            <Award size={11} />
                                            {profile.role}
                                        </span>
                                    )}
                                    {profile.username && (
                                        <span className="inline-flex items-center gap-1 text-xs text-(--text-muted)">
                                            @{profile.username}
                                        </span>
                                    )}
                                    {profile.address && (
                                        <span className="inline-flex items-center gap-1 text-xs text-(--text-muted)">
                                            <MapPin size={11} />
                                            {profile.address}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* التبويبات */}
            <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-(--bg-border) bg-(--bg-card) p-1">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active
                                    ? "bg-(--color-lavender) text-white shadow-sm"
                                    : "text-(--text-secondary) hover:bg-(--bg-hover)"
                                }`}
                        >
                            <Icon size={14} />
                            <span className="hidden sm:inline">
                                {t(`profile.tabs.${tab.key}`)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* المحتوى */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    {/* ════════ نظرة عامة ════════ */}
                    {activeTab === "overview" && (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                                <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                                    {t("profile.overview.personalInfo")}
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field
                                        icon={User}
                                        label={t(
                                            "profile.overview.fullName"
                                        )}
                                        value={fullName}
                                        disabled
                                    />
                                    <Field
                                        icon={User}
                                        label={t(
                                            "profile.overview.username"
                                        )}
                                        value={profile.username || "—"}
                                        disabled
                                    />
                                    <Field
                                        icon={Mail}
                                        label={t("profile.overview.email")}
                                        value={profile.email || "—"}
                                        disabled
                                    />
                                    <Field
                                        icon={Phone}
                                        label={t("profile.overview.phone")}
                                        value={profile.phone || "—"}
                                        disabled
                                    />
                                    <Field
                                        icon={MapPin}
                                        label={t(
                                            "profile.overview.address"
                                        )}
                                        value={profile.address || "—"}
                                        disabled
                                    />
                                    <Field
                                        icon={Calendar}
                                        label={t(
                                            "profile.overview.joinedAt"
                                        )}
                                        value={
                                            profile.created_at
                                                ? new Date(
                                                    profile.created_at
                                                ).toLocaleDateString(
                                                    locale
                                                )
                                                : "—"
                                        }
                                        disabled
                                    />
                                </div>
                            </div>

                            {profile.bio && (
                                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                                    <h2 className="mb-3 text-base font-semibold text-(--text-primary)">
                                        {t("profile.overview.bio")}
                                    </h2>
                                    <p className="text-sm leading-relaxed text-(--text-secondary)">
                                        {profile.bio}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════════ تعديل البيانات ════════ */}
                    {activeTab === "edit" && (
                        <form
                            onSubmit={handleSave}
                            className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4"
                            noValidate
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-(--text-primary)">
                                    {t("profile.edit.title")}
                                </h2>
                                {isDirty && (
                                    <span className="text-xs font-medium text-(--color-amber)">
                                        {t("profile.edit.unsaved")}
                                    </span>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    icon={User}
                                    label={t("profile.edit.firstName")}
                                    name="first_name"
                                    value={form.first_name || ""}
                                    onChange={update("first_name")}
                                    disabled={saving}
                                />
                                <Field
                                    icon={User}
                                    label={t("profile.edit.lastName")}
                                    name="last_name"
                                    value={form.last_name || ""}
                                    onChange={update("last_name")}
                                    disabled={saving}
                                />
                                <Field
                                    icon={User}
                                    label={t("profile.edit.username")}
                                    name="username"
                                    value={form.username || ""}
                                    onChange={update("username")}
                                    disabled={saving}
                                />
                                <Field
                                    icon={Mail}
                                    label={t("profile.edit.email")}
                                    name="email"
                                    type="email"
                                    value={form.email || ""}
                                    onChange={update("email")}
                                    disabled
                                />
                                <Field
                                    icon={Phone}
                                    label={t("profile.edit.phone")}
                                    name="phone"
                                    value={form.phone || ""}
                                    onChange={update("phone")}
                                    disabled={saving}
                                />
                                <Field
                                    icon={MapPin}
                                    label={t("profile.edit.address")}
                                    name="address"
                                    value={form.address || ""}
                                    onChange={update("address")}
                                    disabled={saving}
                                />
                            </div>

                            <div className="mt-4">
                                <label className="mb-1.5 block ps-1 text-xs font-medium text-(--text-secondary)">
                                    {t("profile.edit.bio")}
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.bio || ""}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            bio: e.target.value,
                                        }))
                                    }
                                    disabled={saving}
                                    className="w-full rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 transition-colors focus:border-(--color-lavender)"
                                />
                            </div>

                            {error && (
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                                    <AlertCircle
                                        size={18}
                                        className="shrink-0 text-(--color-error)"
                                    />
                                    <span className="text-(--text-primary)">
                                        {error}
                                    </span>
                                </div>
                            )}

                            {success && (
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-(--color-success)/40 bg-(--color-success)/5 p-3 text-sm">
                                    <CheckCircle2
                                        size={18}
                                        className="shrink-0 text-(--color-success)"
                                    />
                                    <span className="text-(--text-primary)">
                                        {t(
                                            "profile.edit.successMessage"
                                        )}
                                    </span>
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={!isDirty || saving}
                                    className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t("profile.edit.cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!isDirty || saving}
                                    className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {t("profile.edit.save")}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ════════ الأمان ════════ */}
                    {activeTab === "security" && (
                        <form
                            onSubmit={handlePasswordChange}
                            className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4"
                            noValidate
                        >
                            <div className="mb-4 flex items-center gap-2">
                                <KeyRound
                                    size={18}
                                    className="text-(--color-lavender)"
                                />
                                <h2 className="text-base font-semibold text-(--text-primary)">
                                    {t("profile.security.changePassword")}
                                </h2>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Field
                                    icon={Lock}
                                    label={t(
                                        "profile.security.newPassword"
                                    )}
                                    name="new"
                                    type={showPwd ? "text" : "password"}
                                    value={pwd.new}
                                    onChange={(e) =>
                                        setPwd((p) => ({
                                            ...p,
                                            new: e.target.value,
                                        }))
                                    }
                                    disabled={pwdLoading}
                                    endAdornment={
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPwd((s) => !s)
                                            }
                                            className="cursor-pointer text-(--text-muted) hover:text-(--color-lavender)"
                                        >
                                            {showPwd ? (
                                                <EyeOff size={17} />
                                            ) : (
                                                <Eye size={17} />
                                            )}
                                        </button>
                                    }
                                />

                                <Field
                                    icon={Lock}
                                    label={t(
                                        "profile.security.confirmPassword"
                                    )}
                                    name="confirm"
                                    type={showPwd ? "text" : "password"}
                                    value={pwd.confirm}
                                    onChange={(e) =>
                                        setPwd((p) => ({
                                            ...p,
                                            confirm: e.target.value,
                                        }))
                                    }
                                    disabled={pwdLoading}
                                />
                            </div>

                            {pwdError && (
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                                    <AlertCircle
                                        size={18}
                                        className="shrink-0 text-(--color-error)"
                                    />
                                    <span className="text-(--text-primary)">
                                        {pwdError}
                                    </span>
                                </div>
                            )}

                            {pwdSuccess && (
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-(--color-success)/40 bg-(--color-success)/5 p-3 text-sm">
                                    <CheckCircle2
                                        size={18}
                                        className="shrink-0 text-(--color-success)"
                                    />
                                    <span className="text-(--text-primary)">
                                        {t(
                                            "profile.security.successMessage"
                                        )}
                                    </span>
                                </div>
                            )}

                            <div className="mt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={pwdLoading}
                                    className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                                >
                                    {pwdLoading ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Shield size={16} />
                                    )}
                                    {t("profile.security.updatePassword")}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ════════ النشاط ════════ */}
                    {activeTab === "activity" && (
                        <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                            <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                                {t("profile.activity.title")}
                            </h2>
                            <p className="py-8 text-center text-sm text-(--text-muted)">
                                {t("profile.activity.empty")}
                            </p>
                        </div>
                    )}
                </div>

                {/* الشريط الجانبي */}
                <div className="flex flex-col gap-4">
                    {/* آخر دخول */}
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                        <h2 className="mb-3 text-base font-semibold text-(--text-primary)">
                            {t("profile.lastLogin")}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
                            <Clock
                                size={14}
                                className="text-(--color-lavender)"
                            />
                            <span>
                                {authUser?.last_sign_in_at
                                    ? new Date(
                                        authUser.last_sign_in_at
                                    ).toLocaleString(locale)
                                    : t("profile.now")}
                            </span>
                        </div>
                    </div>

                    {/* إجراءات سريعة */}
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                        <h2 className="mb-3 text-base font-semibold text-(--text-primary)">
                            {t("profile.quickActions")}
                        </h2>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("edit")}
                                className="flex items-center gap-2 rounded-lg border border-(--bg-border) p-2.5 text-sm text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                            >
                                <Edit size={14} />
                                <span>{t("profile.editData")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("security")}
                                className="flex items-center gap-2 rounded-lg border border-(--bg-border) p-2.5 text-sm text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                            >
                                <KeyRound size={14} />
                                <span>{t("profile.changePassword")}</span>
                            </button>
                            <Link
                                to="/settings"
                                className="flex items-center gap-2 rounded-lg border border-(--bg-border) p-2.5 text-sm text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                            >
                                <Bell size={14} />
                                <span>{t("profile.settings")}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}