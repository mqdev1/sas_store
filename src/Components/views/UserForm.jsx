import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Save,
    Users as UsersIcon,
    Mail,
    Phone,
    Shield,
    Building2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Check,
    Send,
} from "lucide-react";
import * as usersService from "../../Services/usersService";
import {
    ROLES,
    PERMISSIONS,
    getDefaultPermissions,
} from "../../data/usersData";

// ============================================
// حقل موحّد
// ============================================
function Field({
    icon: Icon,
    label,
    error,
    as: Component = "input",
    endAdornment,
    children,
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
                    className={`box-border w-full rounded-xl border p-2 ${
                        Icon ? "ps-10" : "ps-3"
                    } ${endAdornment ? "pe-10" : ""} text-sm
                        bg-(--bg-elevated) text-(--text-primary)
                        placeholder:text-(--text-muted)
                        outline-0 transition-colors
                        disabled:opacity-60
                        ${
                            error
                                ? "border-(--color-error) focus:border-(--color-error)"
                                : "border-(--bg-border) focus:border-(--color-lavender)"
                        }`}
                >
                    {children}
                </Component>
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
// الصفحة
// ============================================
export default function UserForm() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const isRTL = i18n.language === "ar";

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone: "",
        department: "tech",
        role: "staff",
        status: "active",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [permissions, setPermissions] = useState(
        getDefaultPermissions("staff")
    );
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const DEPARTMENTS = [
        "tech",
        "sales",
        "marketing",
        "finance",
        "operations",
    ];

    // ============================================
    // تحميل عند التعديل
    // ============================================
    useEffect(() => {
        if (!isEdit) return;

        let cancelled = false;
        (async () => {
            try {
                const u = await usersService.getById(id);
                if (cancelled) return;

                setForm({
                    first_name: u.first_name || "",
                    last_name: u.last_name || "",
                    username: u.username || "",
                    email: u.email || "",
                    phone: u.phone || "",
                    department: u.department || "tech",
                    role: u.role || "staff",
                    status: u.status || "active",
                    password: "",
                });
                setPermissions(u.permissions || []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setInitialLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    const updateField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    // ✅ عند تغيير الدور
    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setForm((f) => ({ ...f, role: newRole }));
        setPermissions(getDefaultPermissions(newRole));
    };

    const togglePermission = (key) => {
        setPermissions((prev) =>
            prev.includes(key)
                ? prev.filter((p) => p !== key)
                : [...prev, key]
        );
    };

    const permissionsByGroup = useMemo(() => {
        const groups = {};
        PERMISSIONS.forEach((p) => {
            if (!groups[p.group]) groups[p.group] = [];
            groups[p.group].push(p);
        });
        return groups;
    }, []);

    // ============================================
    // الإرسال
    // ============================================
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!form.first_name.trim())
            return setError(t("users.form.required.firstName"));
        if (!form.last_name.trim())
            return setError(t("users.form.required.lastName"));
        if (!form.email.trim())
            return setError(t("users.form.required.email"));
        if (!/^\S+@\S+\.\S+$/.test(form.email))
            return setError(t("users.form.required.emailInvalid"));
        if (!isEdit && !form.username.trim())
            return setError(t("users.form.required.username"));

        setLoading(true);
        try {
            if (isEdit) {
                await usersService.update(id, {
                    first_name: form.first_name.trim(),
                    last_name: form.last_name.trim(),
                    username: form.username.trim(),
                    phone: form.phone.trim(),
                    department: form.department,
                    role: form.role,
                    status: form.status,
                    permissions,
                });
            } else {
                await usersService.inviteUser({
                    email: form.email.trim(),
                    first_name: form.first_name.trim(),
                    last_name: form.last_name.trim(),
                    username: form.username.trim(),
                    role: form.role,
                    department: form.department,
                    permissions,
                });
            }

            setSuccess(true);
            setTimeout(() => navigate("/users"), 1200);
        } catch (err) {
            setError(err.message || t("users.form.genericError"));
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("users.form.loading")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <UsersIcon
                            size={22}
                            className="text-(--color-lavender)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {isEdit
                                ? t("users.form.editTitle")
                                : t("users.form.createTitle")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {isEdit
                                ? t("users.form.editSubtitle")
                                : t("users.form.createSubtitle")}
                        </p>
                    </div>
                </div>

                <Link
                    to="/users"
                    className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                >
                    <ArrowRight
                        size={15}
                        className={isRTL ? "" : "rotate-180"}
                    />
                    <span>{t("users.form.back")}</span>
                </Link>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                {/* المعلومات الأساسية */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("users.form.basicInfo")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={UsersIcon}
                            label={t("users.form.firstName")}
                            name="first_name"
                            value={form.first_name}
                            onChange={updateField("first_name")}
                            disabled={loading}
                        />

                        <Field
                            icon={UsersIcon}
                            label={t("users.form.lastName")}
                            name="last_name"
                            value={form.last_name}
                            onChange={updateField("last_name")}
                            disabled={loading}
                        />

                        <Field
                            icon={Mail}
                            label={t("users.form.email")}
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={updateField("email")}
                            disabled={loading || isEdit}
                        />

                        <Field
                            icon={UsersIcon}
                            label={t("users.form.username")}
                            name="username"
                            value={form.username}
                            onChange={updateField("username")}
                            disabled={loading}
                        />

                        <Field
                            icon={Phone}
                            label={t("users.form.phone")}
                            name="phone"
                            value={form.phone}
                            onChange={updateField("phone")}
                            disabled={loading}
                        />

                        <Field
                            icon={Building2}
                            label={t("users.form.department")}
                            name="department"
                            as="select"
                            value={form.department}
                            onChange={updateField("department")}
                            disabled={loading}
                        >
                            {DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>
                                    {t(`users.form.departments.${d}`)}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={Shield}
                            label={t("users.form.role")}
                            name="role"
                            as="select"
                            value={form.role}
                            onChange={handleRoleChange}
                            disabled={loading}
                        >
                            {ROLES.map((r) => (
                                <option key={r.key} value={r.key}>
                                    {t(`users.roles.${r.key}`, {
                                        defaultValue: r.label,
                                    })}
                                </option>
                            ))}
                        </Field>

                        {isEdit && (
                            <Field
                                icon={UsersIcon}
                                label={t("users.form.status")}
                                name="status"
                                as="select"
                                value={form.status}
                                onChange={updateField("status")}
                                disabled={loading}
                            >
                                <option value="active">
                                    {t("users.status.active")}
                                </option>
                                <option value="inactive">
                                    {t("users.status.inactive")}
                                </option>
                            </Field>
                        )}
                    </div>

                    {/* ملاحظة للدعوة */}
                    {!isEdit && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-(--color-lavender)/30 bg-(--color-lavender)/5 p-3 text-xs">
                            <Send
                                size={14}
                                className="shrink-0 text-(--color-lavender) mt-0.5"
                            />
                            <span
                                className="text-(--text-primary)"
                                dangerouslySetInnerHTML={{
                                    __html: t("users.form.inviteNote", {
                                        email:
                                            form.email ||
                                            t("users.form.email"),
                                    }),
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* الصلاحيات */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield
                                size={18}
                                className="text-(--color-lavender)"
                            />
                            <h2 className="text-base font-semibold text-(--text-primary)">
                                {t("users.form.permissions")}
                            </h2>
                        </div>
                        <span className="rounded-full bg-(--bg-hover) px-3 py-1 text-xs font-medium text-(--text-secondary)">
                            {t("users.form.permissionsCount", {
                                granted: permissions.length,
                                total: PERMISSIONS.length,
                            })}
                        </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {Object.entries(permissionsByGroup).map(
                            ([group, perms]) => (
                                <div
                                    key={group}
                                    className="rounded-lg border border-(--bg-border) bg-(--bg-main)/40 p-3"
                                >
                                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-(--text-muted)">
                                        {group}
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {perms.map((p) => {
                                            const checked =
                                                permissions.includes(p.key);
                                            return (
                                                <label
                                                    key={p.key}
                                                    className="flex cursor-pointer items-center gap-2 select-none"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            togglePermission(
                                                                p.key
                                                            )
                                                        }
                                                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                                            checked
                                                                ? "border-(--color-lavender) bg-(--color-lavender) text-white"
                                                                : "border-(--bg-border) hover:border-(--color-lavender)"
                                                        }`}
                                                    >
                                                        {checked && (
                                                            <Check size={10} />
                                                        )}
                                                    </button>
                                                    <span className="text-xs text-(--text-primary)">
                                                        {p.label}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                        <AlertCircle
                            size={18}
                            className="shrink-0 text-(--color-error)"
                        />
                        <span className="text-(--text-primary)">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 rounded-xl border border-(--color-success)/40 bg-(--color-success)/5 p-3 text-sm">
                        <CheckCircle2
                            size={18}
                            className="shrink-0 text-(--color-success)"
                        />
                        <span className="text-(--text-primary)">
                            {isEdit
                                ? t("users.form.successUpdate")
                                : t("users.form.successCreate")}
                        </span>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link
                        to="/users"
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                    >
                        {t("users.form.cancel")}
                    </Link>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : isEdit ? (
                            <Save size={16} />
                        ) : (
                            <Send size={16} />
                        )}
                        {isEdit
                            ? t("users.form.save")
                            : t("users.form.sendInvite")}
                    </button>
                </div>
            </form>
        </>
    );
}