import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Truck,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Link as LinkIcon,
    Building2,
    Key,
    Eye,
    EyeOff,
    Hash,
    Image as ImageIcon,
} from "lucide-react";
import * as carriersService from "../../Services/shippingCarriersService";
import * as storageService from "../../Services/storageService";

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
export default function ShippingCarrierForm() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const isRTL = i18n.language === "ar";

    const [form, setForm] = useState({
        name: "",
        code: "",
        logo_url: "",
        tracking_url_pattern: "",
        sort_order: 0,
        api_enabled: false,
        api_key: "",
        api_secret: "",
        api_endpoint: "",
        is_active: true,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showApiSecret, setShowApiSecret] = useState(false);
    const [uploading, setUploading] = useState(false);

    // ============================================
    // تحميل عند التعديل
    // ============================================
    useEffect(() => {
        if (!isEdit) return;

        let cancelled = false;
        (async () => {
            try {
                const c = await carriersService.getById(id);
                if (cancelled) return;

                setForm({
                    name: c.name || "",
                    code: c.code || "",
                    logo_url: c.logo_url || "",
                    tracking_url_pattern:
                        c.tracking_url_pattern || "",
                    sort_order: Number(c.sort_order) || 0,
                    api_enabled: c.api_enabled ?? false,
                    api_key: "", // لا نجلب المفتاح
                    api_secret: "",
                    api_endpoint: c.api_endpoint || "",
                    is_active: c.is_active ?? true,
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

    const updateField = (name, value) =>
        setForm((prev) => ({ ...prev, [name]: value }));

    // ============================================
    // رفع الشعار
    // ============================================
    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            const { url } = await storageService.upload(
                file,
                "carriers"
            );
            updateField("logo_url", url);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    // ============================================
    // Validation
    // ============================================
    const validate = () => {
        const err = {};

        if (!form.name || form.name.trim().length < 2) {
            err.name = t("shippingCarriers.form.required.name");
        }

        if (!form.code || form.code.trim().length < 2) {
            err.code = t("shippingCarriers.form.required.code");
        } else if (!/^[a-z0-9_-]+$/i.test(form.code)) {
            err.code = t("shippingCarriers.form.required.codeFormat");
        }

        if (!isEdit && !form.tracking_url_pattern) {
            err.tracking_url_pattern = t(
                "shippingCarriers.form.required.trackingUrl"
            );
        }

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    // ============================================
    // الإرسال
    // ============================================
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!validate()) return;

        setLoading(true);
        try {
            // تحقق من الاسم والكود
            const nameUnique = await carriersService.isNameUnique(
                form.name.trim(),
                isEdit ? Number(id) : null
            );
            if (!nameUnique) {
                setError(t("shippingCarriers.form.nameUnique"));
                setLoading(false);
                return;
            }

            const codeUnique = await carriersService.isCodeUnique(
                form.code.trim().toLowerCase(),
                isEdit ? Number(id) : null
            );
            if (!codeUnique) {
                setError(t("shippingCarriers.form.codeUnique"));
                setLoading(false);
                return;
            }

            const payload = {
                name: form.name.trim(),
                code: form.code.trim().toLowerCase(),
                logo_url: form.logo_url || null,
                tracking_url_pattern:
                    form.tracking_url_pattern.trim() || null,
                sort_order: Number(form.sort_order) || 0,
                api_enabled: form.api_enabled,
                api_endpoint: form.api_endpoint.trim() || null,
                is_active: form.is_active,
            };

            // أضف المفاتيح فقط لو موجودة
            if (form.api_key) payload.api_key = form.api_key;
            if (form.api_secret) payload.api_secret = form.api_secret;

            if (isEdit) {
                await carriersService.update(id, payload);
            } else {
                await carriersService.create(payload);
            }

            setSuccess(true);
            setTimeout(() => navigate("/shipping-carriers"), 1200);
        } catch (err) {
            setError(
                err.message || t("shippingCarriers.form.genericError")
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // Loading
    // ============================================
    if (initialLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("shippingCarriers.form.loading")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {/* رأس الصفحة */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/shipping-carriers")}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) hover:bg-(--bg-hover)"
                >
                    <ArrowRight
                        size={16}
                        className={isRTL ? "" : "rotate-180"}
                    />
                </button>
                <div className="flex items-center gap-2">
                    <Truck
                        size={24}
                        className="text-(--color-amber)"
                    />
                    <h1 className="text-2xl font-bold text-(--text-primary)">
                        {isEdit
                            ? t("shippingCarriers.form.editTitle")
                            : t("shippingCarriers.form.createTitle")}
                    </h1>
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5">
                {/* المعلومات الأساسية */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("shippingCarriers.form.basicInfo")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={Building2}
                            label={t("shippingCarriers.form.name")}
                            name="name"
                            value={form.name}
                            onChange={(e) =>
                                updateField("name", e.target.value)
                            }
                            placeholder={t(
                                "shippingCarriers.form.namePlaceholder"
                            )}
                            error={errors.name}
                        />

                        <Field
                            icon={Hash}
                            label={t("shippingCarriers.form.code")}
                            name="code"
                            value={form.code}
                            onChange={(e) =>
                                updateField(
                                    "code",
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/\s/g, "")
                                )
                            }
                            placeholder={t(
                                "shippingCarriers.form.codePlaceholder"
                            )}
                            error={errors.code}
                        />

                        <Field
                            icon={LinkIcon}
                            label={t("shippingCarriers.form.trackingUrl")}
                            name="tracking_url_pattern"
                            value={form.tracking_url_pattern}
                            onChange={(e) =>
                                updateField(
                                    "tracking_url_pattern",
                                    e.target.value
                                )
                            }
                            placeholder={t(
                                "shippingCarriers.form.trackingUrlPlaceholder"
                            )}
                            error={errors.tracking_url_pattern}
                        />

                        <Field
                            icon={Hash}
                            label={t("shippingCarriers.form.sortOrder")}
                            name="sort_order"
                            type="number"
                            min="0"
                            value={form.sort_order}
                            onChange={(e) =>
                                updateField("sort_order", e.target.value)
                            }
                        />
                    </div>

                    {/* الشعار */}
                    <div className="mt-4 flex items-center gap-3">
                        {form.logo_url ? (
                            <img
                                src={form.logo_url}
                                alt="logo"
                                className="h-14 w-14 rounded-xl border border-(--bg-border) bg-white object-contain p-1"
                            />
                        ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-(--bg-border) bg-(--bg-main)">
                                <ImageIcon
                                    size={20}
                                    className="text-(--text-muted)"
                                />
                            </div>
                        )}
                        <label className="cursor-pointer rounded-full border border-(--bg-border) px-4 py-2 text-xs font-medium text-(--text-secondary) hover:bg-(--bg-hover)">
                            {uploading
                                ? t("shippingCarriers.form.loading")
                                : t("shippingCarriers.form.logoUpload")}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </div>

                {/* إعدادات API */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("shippingCarriers.form.apiSettings")}
                        </h2>
                        <button
                            type="button"
                            onClick={() =>
                                updateField(
                                    "api_enabled",
                                    !form.api_enabled
                                )
                            }
                            className={`relative h-6 w-11 rounded-full transition-colors ${
                                form.api_enabled
                                    ? "bg-(--color-lavender)"
                                    : "bg-(--bg-border)"
                            }`}
                        >
                            <span
                                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
                                style={{
                                    left: form.api_enabled ? 22 : 2,
                                }}
                            />
                        </button>
                    </div>

                    {form.api_enabled && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field
                                icon={LinkIcon}
                                label={t(
                                    "shippingCarriers.form.apiEndpoint"
                                )}
                                name="api_endpoint"
                                value={form.api_endpoint}
                                onChange={(e) =>
                                    updateField(
                                        "api_endpoint",
                                        e.target.value
                                    )
                                }
                                placeholder={t(
                                    "shippingCarriers.form.apiEndpointPlaceholder"
                                )}
                            />

                            <Field
                                icon={Key}
                                label={t("shippingCarriers.form.apiKey")}
                                name="api_key"
                                type={showApiKey ? "text" : "password"}
                                value={form.api_key}
                                onChange={(e) =>
                                    updateField("api_key", e.target.value)
                                }
                                placeholder={t(
                                    "shippingCarriers.form.apiKeyPlaceholder"
                                )}
                                endAdornment={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowApiKey((s) => !s)
                                        }
                                        className="cursor-pointer text-(--text-muted) hover:text-(--color-lavender)"
                                    >
                                        {showApiKey ? (
                                            <EyeOff size={17} />
                                        ) : (
                                            <Eye size={17} />
                                        )}
                                    </button>
                                }
                            />

                            <Field
                                icon={Key}
                                label={t(
                                    "shippingCarriers.form.apiSecret"
                                )}
                                name="api_secret"
                                type={showApiSecret ? "text" : "password"}
                                value={form.api_secret}
                                onChange={(e) =>
                                    updateField(
                                        "api_secret",
                                        e.target.value
                                    )
                                }
                                placeholder={t(
                                    "shippingCarriers.form.apiSecretPlaceholder"
                                )}
                                endAdornment={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowApiSecret((s) => !s)
                                        }
                                        className="cursor-pointer text-(--text-muted) hover:text-(--color-lavender)"
                                    >
                                        {showApiSecret ? (
                                            <EyeOff size={17} />
                                        ) : (
                                            <Eye size={17} />
                                        )}
                                    </button>
                                }
                            />
                        </div>
                    )}
                </div>

                {/* الحالة */}
                <div className="flex items-center justify-between rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3">
                    <div>
                        <span className="text-sm font-medium text-(--text-primary)">
                            {t("shippingCarriers.form.activate")}
                        </span>
                        <p className="text-xs text-(--text-muted)">
                            {t("shippingCarriers.form.activateHint")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            updateField("is_active", !form.is_active)
                        }
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                            form.is_active
                                ? "bg-(--color-lavender)"
                                : "bg-(--bg-border)"
                        }`}
                    >
                        <span
                            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
                            style={{
                                left: form.is_active ? 22 : 2,
                            }}
                        />
                    </button>
                </div>

                {/* رسائل */}
                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
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
                    <div className="flex items-center gap-2 rounded-xl border border-(--color-success)/40 bg-(--color-success)/5 p-3 text-sm">
                        <CheckCircle2
                            size={18}
                            className="shrink-0 text-(--color-success)"
                        />
                        <span className="text-(--text-primary)">
                            {isEdit
                                ? t(
                                      "shippingCarriers.form.successUpdate"
                                  )
                                : t(
                                      "shippingCarriers.form.successCreate"
                                  )}
                        </span>
                    </div>
                )}

                {/* الأزرار */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/shipping-carriers")}
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) hover:bg-(--bg-hover)"
                    >
                        {t("shippingCarriers.form.cancel")}
                    </button>
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isEdit
                            ? t("shippingCarriers.form.update")
                            : t("shippingCarriers.form.save")}
                    </button>
                </div>
            </form>
        </div>
    );
}