import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Save,
    Users,
    Mail,
    Phone,
    MapPin,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import * as clientsService from "../../Services/clientsService";

// ============================================
// قائمة الدول
// ============================================
const COUNTRIES = [
    "فلسطين",
    "الأردن",
    "مصر",
    "السعودية",
    "الإمارات",
    "هولندا",
    "ألمانيا",
    "فرنسا",
    "إسبانيا",
    "تركيا",
    "أمريكا",
];

// ============================================
// حقل موحّد
// ============================================
function Field({
    icon: Icon,
    label,
    error,
    as: Component = "input",
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
                    className={`box-border w-full rounded-xl border p-2 ps-10 text-sm
                        bg-(--bg-elevated) text-(--text-primary)
                        placeholder:text-(--text-muted)
                        outline-0 transition-colors
                        disabled:opacity-60
                        ${
                            error
                                ? "border-(--color-error) focus:border-(--color-error)"
                                : "border-(--bg-border) focus:border-(--color-lavender)"
                        }`}
                />
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
export default function ClientForm() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const isRTL = i18n.language === "ar";

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        country: COUNTRIES[0],
        city: "",
        address: "",
        status: "active",
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // ============================================
    // تحميل بيانات العميل
    // ============================================
    useEffect(() => {
        if (!isEdit) return;

        let cancelled = false;
        (async () => {
            try {
                const c = await clientsService.getById(id);
                if (cancelled) return;

                setForm({
                    name: c.name || "",
                    email: c.email || "",
                    phone: c.phone || "",
                    country: c.country || COUNTRIES[0],
                    city: c.city || "",
                    address: c.address || "",
                    status:
                        c.status === "نشط"
                            ? "active"
                            : c.status === "غير نشط"
                            ? "inactive"
                            : c.status || "active",
                });
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

    // ============================================
    // الإرسال
    // ============================================
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        // ✅ Validation
        if (!form.name.trim())
            return setError(t("clients.form.required.name"));
        if (!form.email.trim())
            return setError(t("clients.form.required.email"));
        if (!/^\S+@\S+\.\S+$/.test(form.email))
            return setError(t("clients.form.required.emailInvalid"));
        if (!form.phone.trim())
            return setError(t("clients.form.required.phone"));

        setLoading(true);
        try {
            // ✅ التحقق من uniqueness
            const unique = await clientsService.isEmailUnique(
                form.email.trim(),
                isEdit ? Number(id) : null
            );
            if (!unique) {
                setError(t("clients.form.required.emailUnique"));
                setLoading(false);
                return;
            }

            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                country: form.country,
                city: form.city.trim(),
                address: form.address.trim(),
                status: form.status,
            };

            if (isEdit) {
                await clientsService.update(id, payload);
            } else {
                await clientsService.create(payload);
            }

            setSuccess(true);
            setTimeout(() => navigate("/clients"), 1200);
        } catch (err) {
            setError(err.message || t("clients.form.genericError"));
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
                        {t("clients.form.loading")}
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
                        <Users
                            size={22}
                            className="text-(--color-lavender)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {isEdit
                                ? t("clients.form.editTitle")
                                : t("clients.newClient")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {isEdit
                                ? t("clients.form.editSubtitle")
                                : t("clients.form.createSubtitle")}
                        </p>
                    </div>
                </div>

                <Link
                    to="/clients"
                    className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                >
                    <ArrowRight
                        size={15}
                        className={isRTL ? "" : "rotate-180"}
                    />
                    <span>{t("clients.form.back")}</span>
                </Link>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("clients.form.basicInfo")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={Users}
                            label={t("clients.form.name")}
                            name="name"
                            placeholder={t(
                                "clients.form.namePlaceholder"
                            )}
                            value={form.name}
                            onChange={updateField("name")}
                            disabled={loading}
                        />

                        <Field
                            icon={Mail}
                            label={t("clients.form.email")}
                            name="email"
                            type="email"
                            placeholder={t(
                                "clients.form.emailPlaceholder"
                            )}
                            value={form.email}
                            onChange={updateField("email")}
                            disabled={loading}
                        />

                        <Field
                            icon={Phone}
                            label={t("clients.form.phone")}
                            name="phone"
                            placeholder={t(
                                "clients.form.phonePlaceholder"
                            )}
                            value={form.phone}
                            onChange={updateField("phone")}
                            disabled={loading}
                        />

                        <Field
                            icon={MapPin}
                            label={t("clients.form.country")}
                            name="country"
                            as="select"
                            value={form.country}
                            onChange={updateField("country")}
                            disabled={loading}
                        >
                            {COUNTRIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={MapPin}
                            label={t("clients.form.city")}
                            name="city"
                            placeholder={t(
                                "clients.form.cityPlaceholder"
                            )}
                            value={form.city}
                            onChange={updateField("city")}
                            disabled={loading}
                        />

                        <Field
                            icon={MapPin}
                            label={t("clients.form.address")}
                            name="address"
                            placeholder={t(
                                "clients.form.addressPlaceholder"
                            )}
                            value={form.address}
                            onChange={updateField("address")}
                            disabled={loading}
                        />

                        <Field
                            icon={Users}
                            label={t("clients.form.status")}
                            name="status"
                            as="select"
                            value={form.status}
                            onChange={updateField("status")}
                            disabled={loading}
                        >
                            <option value="active">
                                {t("clients.form.statusActive")}
                            </option>
                            <option value="inactive">
                                {t("clients.form.statusInactive")}
                            </option>
                        </Field>
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
                                ? t("clients.form.successUpdate")
                                : t("clients.form.successCreate")}
                        </span>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link
                        to="/clients"
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                    >
                        {t("clients.form.cancel")}
                    </Link>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isEdit
                            ? t("clients.form.update")
                            : t("clients.form.save")}
                    </button>
                </div>
            </form>
        </>
    );
}