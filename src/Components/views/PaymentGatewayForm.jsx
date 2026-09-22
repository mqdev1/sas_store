import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Wallet,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Link as LinkIcon,
    Key,
    Eye,
    EyeOff,
    Hash,
    Image as ImageIcon,
    Copy,
    Check,
    Shield,
    CreditCard,
} from "lucide-react";
import * as gatewaysService from "../../Services/paymentGatewaysService";
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
// العملات الشائعة
// ============================================
const AVAILABLE_CURRENCIES = [
    "ILS",
    "USD",
    "EUR",
    "GBP",
    "SAR",
    "AED",
    "JOD",
    "EGP",
];

// ============================================
// الصفحة
// ============================================
export default function PaymentGatewayForm() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const isRTL = i18n.language === "ar";

    const [form, setForm] = useState({
        name: "",
        code: "",
        logo_url: "",
        mode: "sandbox",
        api_key: "",
        api_secret: "",
        api_endpoint: "",
        supported_currencies: ["ILS"],
        fees_percentage: 0,
        fees_fixed: 0,
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
    const [copiedWebhook, setCopiedWebhook] = useState(false);

    // Webhook URL (يتولد من code)
    const webhookUrl = form.code
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-webhook?gateway=${form.code}`
        : "";

    // ============================================
    // تحميل عند التعديل
    // ============================================
    useEffect(() => {
        if (!isEdit) return;

        let cancelled = false;
        (async () => {
            try {
                const g = await gatewaysService.getById(id);
                if (cancelled) return;

                setForm({
                    name: g.name || "",
                    code: g.code || "",
                    logo_url: g.logo_url || "",
                    mode: g.mode || "sandbox",
                    api_key: "",
                    api_secret: "",
                    api_endpoint: g.api_endpoint || "",
                    supported_currencies:
                        g.supported_currencies || ["ILS"],
                    fees_percentage: Number(g.fees_percentage) || 0,
                    fees_fixed: Number(g.fees_fixed) || 0,
                    is_active: g.is_active ?? true,
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

    // ✅ تبديل العملة
    const toggleCurrency = (currency) => {
        setForm((prev) => ({
            ...prev,
            supported_currencies: prev.supported_currencies.includes(
                currency
            )
                ? prev.supported_currencies.filter((c) => c !== currency)
                : [...prev.supported_currencies, currency],
        }));
    };

    // ============================================
    // رفع الشعار
    // ============================================
    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            const { url } = await storageService.upload(file, "gateways");
            updateField("logo_url", url);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    // ============================================
    // نسخ Webhook
    // ============================================
    const copyWebhook = () => {
        if (!webhookUrl) return;
        navigator.clipboard.writeText(webhookUrl);
        setCopiedWebhook(true);
        setTimeout(() => setCopiedWebhook(false), 1500);
    };

    // ============================================
    // Validation
    // ============================================
    const validate = () => {
        const err = {};

        if (!form.name || form.name.trim().length < 2) {
            err.name = t("paymentGateways.form.required.name");
        }

        if (!form.code || form.code.trim().length < 2) {
            err.code = t("paymentGateways.form.required.code");
        } else if (!/^[a-z0-9_-]+$/i.test(form.code)) {
            err.code = t("paymentGateways.form.required.codeFormat");
        }

        if (!form.api_endpoint || !form.api_endpoint.trim()) {
            err.api_endpoint = t(
                "paymentGateways.form.required.apiEndpoint"
            );
        }

        if (form.supported_currencies.length === 0) {
            err.supported_currencies = t(
                "paymentGateways.form.required.currencies"
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
            const nameUnique = await gatewaysService.isNameUnique(
                form.name.trim(),
                isEdit ? Number(id) : null
            );
            if (!nameUnique) {
                setError(t("paymentGateways.form.nameUnique"));
                setLoading(false);
                return;
            }

            const codeUnique = await gatewaysService.isCodeUnique(
                form.code.trim().toLowerCase(),
                isEdit ? Number(id) : null
            );
            if (!codeUnique) {
                setError(t("paymentGateways.form.codeUnique"));
                setLoading(false);
                return;
            }

            const payload = {
                name: form.name.trim(),
                code: form.code.trim().toLowerCase(),
                logo_url: form.logo_url || null,
                mode: form.mode,
                api_endpoint: form.api_endpoint.trim() || null,
                supported_currencies: form.supported_currencies,
                fees_percentage: Number(form.fees_percentage) || 0,
                fees_fixed: Number(form.fees_fixed) || 0,
                is_active: form.is_active,
            };

            if (form.api_key) payload.api_key = form.api_key;
            if (form.api_secret) payload.api_secret = form.api_secret;

            if (isEdit) {
                await gatewaysService.update(id, payload);
            } else {
                await gatewaysService.create(payload);
            }

            setSuccess(true);
            setTimeout(() => navigate("/payment-gateways"), 1200);
        } catch (err) {
            setError(
                err.message || t("paymentGateways.form.genericError")
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
                        {t("paymentGateways.form.loading")}
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
                    onClick={() => navigate("/payment-gateways")}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) hover:bg-(--bg-hover)"
                >
                    <ArrowRight
                        size={16}
                        className={isRTL ? "" : "rotate-180"}
                    />
                </button>
                <div className="flex items-center gap-2">
                    <Wallet
                        size={24}
                        className="text-(--color-mint)"
                    />
                    <h1 className="text-2xl font-bold text-(--text-primary)">
                        {isEdit
                            ? t("paymentGateways.form.editTitle")
                            : t("paymentGateways.form.createTitle")}
                    </h1>
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5">
                {/* المعلومات الأساسية */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("paymentGateways.form.basicInfo")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={CreditCard}
                            label={t("paymentGateways.form.name")}
                            name="name"
                            value={form.name}
                            onChange={(e) =>
                                updateField("name", e.target.value)
                            }
                            placeholder={t(
                                "paymentGateways.form.namePlaceholder"
                            )}
                            error={errors.name}
                        />

                        <Field
                            icon={Hash}
                            label={t("paymentGateways.form.code")}
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
                                "paymentGateways.form.codePlaceholder"
                            )}
                            error={errors.code}
                        />

                        <Field
                            icon={Shield}
                            label={t("paymentGateways.form.mode")}
                            name="mode"
                            as="select"
                            value={form.mode}
                            onChange={(e) =>
                                updateField("mode", e.target.value)
                            }
                        >
                            <option value="sandbox">
                                {t("paymentGateways.mode.sandbox")}
                            </option>
                            <option value="production">
                                {t("paymentGateways.mode.production")}
                            </option>
                        </Field>

                        <Field
                            icon={LinkIcon}
                            label={t(
                                "paymentGateways.form.apiEndpoint"
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
                                "paymentGateways.form.apiEndpointPlaceholder"
                            )}
                            error={errors.api_endpoint}
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
                                ? t("paymentGateways.form.loading")
                                : t("paymentGateways.form.logoUpload")}
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
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("paymentGateways.form.apiSettings")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={Key}
                            label={t("paymentGateways.form.apiKey")}
                            name="api_key"
                            type={showApiKey ? "text" : "password"}
                            value={form.api_key}
                            onChange={(e) =>
                                updateField("api_key", e.target.value)
                            }
                            placeholder={t(
                                "paymentGateways.form.apiKeyPlaceholder"
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
                            label={t("paymentGateways.form.apiSecret")}
                            name="api_secret"
                            type={showApiSecret ? "text" : "password"}
                            value={form.api_secret}
                            onChange={(e) =>
                                updateField("api_secret", e.target.value)
                            }
                            placeholder={t(
                                "paymentGateways.form.apiSecretPlaceholder"
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

                    {/* Webhook URL */}
                    {webhookUrl && (
                        <div className="mt-4">
                            <label className="mb-1.5 block ps-1 text-xs font-medium text-(--text-secondary)">
                                {t("paymentGateways.form.webhookUrl")}
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-2.5">
                                <LinkIcon
                                    size={15}
                                    className="shrink-0 text-(--color-lavender)"
                                />
                                <span className="flex-1 truncate font-mono text-xs text-(--text-primary)">
                                    {webhookUrl}
                                </span>
                                <button
                                    type="button"
                                    onClick={copyWebhook}
                                    className="shrink-0 rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                >
                                    {copiedWebhook ? (
                                        <Check size={14} />
                                    ) : (
                                        <Copy size={14} />
                                    )}
                                </button>
                            </div>
                            <p className="mt-1 ps-1 text-[10px] text-(--text-muted)">
                                {t(
                                    "paymentGateways.form.webhookUrlHint"
                                )}
                            </p>
                        </div>
                    )}
                </div>

                {/* العملات والعمولة */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("paymentGateways.form.settings")}
                    </h2>

                    {/* العملات */}
                    <div className="mb-4">
                        <label className="mb-2 block ps-1 text-xs font-medium text-(--text-secondary)">
                            {t(
                                "paymentGateways.form.supportedCurrencies"
                            )}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_CURRENCIES.map((c) => {
                                const checked =
                                    form.supported_currencies.includes(c);
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => toggleCurrency(c)}
                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                            checked
                                                ? "border-(--color-lavender) bg-(--color-lavender)/10 text-(--color-lavender)"
                                                : "border-(--bg-border) text-(--text-secondary) hover:bg-(--bg-hover)"
                                        }`}
                                    >
                                        {c}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.supported_currencies && (
                            <span className="mt-1 block ps-1 text-xs text-(--color-error)">
                                {errors.supported_currencies}
                            </span>
                        )}
                    </div>

                    {/* العمولة */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={Shield}
                            label={t(
                                "paymentGateways.form.feesPercentage"
                            )}
                            name="fees_percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={form.fees_percentage}
                            onChange={(e) =>
                                updateField(
                                    "fees_percentage",
                                    e.target.value
                                )
                            }
                        />

                        <Field
                            icon={CreditCard}
                            label={t("paymentGateways.form.feesFixed")}
                            name="fees_fixed"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.fees_fixed}
                            onChange={(e) =>
                                updateField("fees_fixed", e.target.value)
                            }
                        />
                    </div>
                </div>

                {/* الحالة */}
                <div className="flex items-center justify-between rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3">
                    <div>
                        <span className="text-sm font-medium text-(--text-primary)">
                            {t("paymentGateways.form.activate")}
                        </span>
                        <p className="text-xs text-(--text-muted)">
                            {t("paymentGateways.form.activateHint")}
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
                                      "paymentGateways.form.successUpdate"
                                  )
                                : t(
                                      "paymentGateways.form.successCreate"
                                  )}
                        </span>
                    </div>
                )}

                {/* الأزرار */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/payment-gateways")}
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) hover:bg-(--bg-hover)"
                    >
                        {t("paymentGateways.form.cancel")}
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
                            ? t("paymentGateways.form.update")
                            : t("paymentGateways.form.save")}
                    </button>
                </div>
            </form>
        </div>
    );
}