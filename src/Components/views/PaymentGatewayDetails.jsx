import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    Wallet,
    Edit,
    Trash2,
    Power,
    PowerOff,
    Link as LinkIcon,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Copy,
    Check,
    Zap,
    CreditCard,
    Shield,
    TrendingUp,
    DollarSign,
    Hash,
} from "lucide-react";
import * as gatewaysService from "../../Services/paymentGatewaysService";

// ============================================
// بطاقة معلومة
// ============================================
function InfoCard({ icon: Icon, label, value, color }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-(--bg-border) bg-(--bg-card) p-3">
            <div className={`rounded-lg p-2 ${color}`}>
                <Icon size={18} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-(--text-muted)">{label}</span>
                <span className="text-sm font-bold text-(--text-primary)">
                    {value}
                </span>
            </div>
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function PaymentGatewayDetails() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isRTL = i18n.language === "ar";
    const locale = isRTL ? "ar-EG" : "en-US";

    const [gateway, setGateway] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedWebhook, setCopiedWebhook] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    usePageTitle(gateway?.name);

    // ============================================
    // جلب البوابة
    // ============================================
    const loadGateway = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await gatewaysService.getById(id);
            setGateway(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadGateway();
    }, [loadGateway]);

    // Webhook URL
    const webhookUrl = gateway
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-webhook?gateway=${gateway.code}`
        : "";

    // ✅ نسخ الكود
    const copyCode = () => {
        if (!gateway) return;
        navigator.clipboard.writeText(gateway.code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1500);
    };

    // ✅ نسخ Webhook
    const copyWebhook = () => {
        if (!webhookUrl) return;
        navigator.clipboard.writeText(webhookUrl);
        setCopiedWebhook(true);
        setTimeout(() => setCopiedWebhook(false), 1500);
    };

    // ✅ تفعيل/تعطيل
    const toggleActive = async () => {
        if (!gateway) return;
        setToggling(true);
        try {
            await gatewaysService.toggleActive(
                gateway.id,
                !gateway.is_active
            );
            setGateway((prev) => ({
                ...prev,
                is_active: !prev.is_active,
            }));
        } catch (err) {
            alert(
                t("paymentGateways.toggleFailed", {
                    error: err.message || "",
                })
            );
        } finally {
            setToggling(false);
        }
    };

    // ✅ اختبار الاتصال
    const testConnection = async () => {
        if (!gateway) return;
        setTesting(true);
        setTestResult(null);
        try {
            await gatewaysService.testConnection(gateway.id);
            setTestResult({
                success: true,
                message: t("paymentGateways.details.testSuccess"),
            });
        } catch (err) {
            setTestResult({
                success: false,
                message: t("paymentGateways.details.testFailed", {
                    error: err.message || "",
                }),
            });
        } finally {
            setTesting(false);
        }
    };

    // ✅ حذف
    const handleDelete = async () => {
        if (!gateway) return;
        if (
            !confirm(
                t("paymentGateways.confirmDelete", {
                    name: gateway.name,
                })
            )
        )
            return;
        try {
            await gatewaysService.remove(gateway.id);
            navigate("/payment-gateways");
        } catch (err) {
            alert(
                t("paymentGateways.deleteFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // Loading / Error
    // ============================================
    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("paymentGateways.details.loading")}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !gateway) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <Wallet size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {error
                        ? t("paymentGateways.details.loadError")
                        : t("paymentGateways.details.notFound")}
                </h2>
                {error && (
                    <p className="flex items-center gap-2 text-sm text-(--color-error)">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                <Link
                    to="/payment-gateways"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("paymentGateways.details.back")}
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/payment-gateways")}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight
                            size={16}
                            className={isRTL ? "" : "rotate-180"}
                        />
                    </button>

                    {gateway.logo_url ? (
                        <img
                            src={gateway.logo_url}
                            alt={gateway.name}
                            className="h-14 w-14 rounded-2xl border border-(--bg-border) bg-white object-contain p-1"
                        />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-mint)/10 text-(--color-mint)">
                            <Wallet size={26} />
                        </div>
                    )}

                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {gateway.name}
                        </h1>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    gateway.is_active
                                        ? "bg-(--color-mint)/10 text-(--color-mint)"
                                        : "bg-(--text-muted)/10 text-(--text-muted)"
                                }`}
                            >
                                {gateway.is_active ? (
                                    <CheckCircle2 size={11} />
                                ) : (
                                    <AlertCircle size={11} />
                                )}
                                {gateway.is_active
                                    ? t("paymentGateways.status.active")
                                    : t(
                                          "paymentGateways.status.inactive"
                                      )}
                            </span>

                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    gateway.mode === "production"
                                        ? "bg-(--color-error)/10 text-(--color-error)"
                                        : "bg-(--color-amber)/10 text-(--color-amber)"
                                }`}
                            >
                                {gateway.mode === "production"
                                    ? t(
                                          "paymentGateways.mode.production"
                                      )
                                    : t(
                                          "paymentGateways.mode.sandbox"
                                      )}
                            </span>

                            <button
                                type="button"
                                onClick={copyCode}
                                className="inline-flex items-center gap-1 rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs font-mono text-(--text-secondary) transition-colors hover:text-(--color-lavender)"
                            >
                                {copiedCode ? (
                                    <Check size={11} />
                                ) : (
                                    <Copy size={11} />
                                )}
                                {gateway.code}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={testConnection}
                        disabled={testing}
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) disabled:opacity-50"
                    >
                        {testing ? (
                            <Loader2
                                size={14}
                                className="animate-spin"
                            />
                        ) : (
                            <Zap size={14} />
                        )}
                        <span>
                            {testing
                                ? t("paymentGateways.details.testing")
                                : t(
                                      "paymentGateways.details.testConnection"
                                  )}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={toggleActive}
                        disabled={toggling}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                            gateway.is_active
                                ? "border-(--bg-border) text-(--text-secondary) hover:bg-(--bg-hover)"
                                : "border-(--color-mint) text-(--color-mint) hover:bg-(--color-mint)/10"
                        }`}
                    >
                        {toggling ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : gateway.is_active ? (
                            <>
                                <PowerOff size={14} />
                                <span>
                                    {t(
                                        "paymentGateways.details.deactivate"
                                    )}
                                </span>
                            </>
                        ) : (
                            <>
                                <Power size={14} />
                                <span>
                                    {t(
                                        "paymentGateways.details.activate"
                                    )}
                                </span>
                            </>
                        )}
                    </button>

                    <Link
                        to={`/payment-gateways/${gateway.id}/edit`}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Edit size={15} />
                        <span>{t("paymentGateways.details.edit")}</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-(--bg-border) text-(--color-error) transition-colors hover:bg-(--color-error) hover:text-white"
                        title={t("paymentGateways.details.delete")}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* نتيجة اختبار الاتصال */}
            {testResult && (
                <div
                    className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
                        testResult.success
                            ? "border-(--color-mint)/40 bg-(--color-mint)/5"
                            : "border-(--color-error)/40 bg-(--color-error)/5"
                    }`}
                >
                    {testResult.success ? (
                        <CheckCircle2
                            size={18}
                            className="shrink-0 text-(--color-mint)"
                        />
                    ) : (
                        <AlertCircle
                            size={18}
                            className="shrink-0 text-(--color-error)"
                        />
                    )}
                    <span className="text-(--text-primary)">
                        {testResult.message}
                    </span>
                </div>
            )}

            {/* بطاقات المعلومات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={CreditCard}
                    label={t(
                        "paymentGateways.details.stats.transactions"
                    )}
                    value={Number(
                        gateway.transactions_count || 0
                    ).toLocaleString(locale)}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={TrendingUp}
                    label={t(
                        "paymentGateways.details.stats.successRate"
                    )}
                    value={`${gateway.success_rate || 0}%`}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
                <InfoCard
                    icon={DollarSign}
                    label={t(
                        "paymentGateways.details.stats.totalVolume"
                    )}
                    value={`${Number(
                        gateway.total_volume || 0
                    ).toLocaleString(locale)} ₪`}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
                <InfoCard
                    icon={Shield}
                    label={t(
                        "paymentGateways.details.stats.totalFees"
                    )}
                    value={`${Number(
                        gateway.total_fees || 0
                    ).toLocaleString(locale)} ₪`}
                    color="text-(--color-pink) bg-(--color-pink)/10"
                />
            </div>

            {/* API Info + Configuration */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* API Info */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Zap
                            size={18}
                            className="text-(--color-lavender)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("paymentGateways.details.apiInfo")}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center justify-between border-b border-(--bg-border) py-2">
                            <span className="text-(--text-muted)">
                                {t("paymentGateways.details.api.mode")}
                            </span>
                            <span
                                className={
                                    gateway.mode === "production"
                                        ? "text-(--color-error)"
                                        : "text-(--color-amber)"
                                }
                            >
                                {gateway.mode === "production"
                                    ? t(
                                          "paymentGateways.mode.production"
                                      )
                                    : t(
                                          "paymentGateways.mode.sandbox"
                                      )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-(--bg-border) py-2">
                            <span className="text-(--text-muted)">
                                {t(
                                    "paymentGateways.details.api.status"
                                )}
                            </span>
                            <span
                                className={
                                    gateway.is_active
                                        ? "text-(--color-mint)"
                                        : "text-(--text-muted)"
                                }
                            >
                                {gateway.is_active
                                    ? t("paymentGateways.status.active")
                                    : t(
                                          "paymentGateways.status.inactive"
                                      )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-(--bg-border) py-2">
                            <span className="text-(--text-muted)">
                                {t(
                                    "paymentGateways.details.api.endpoint"
                                )}
                            </span>
                            <span className="max-w-[60%] truncate font-mono text-(--text-primary)">
                                {gateway.api_endpoint || "—"}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 border-b border-(--bg-border) py-2">
                            <span className="text-(--text-muted)">
                                {t(
                                    "paymentGateways.details.api.webhook"
                                )}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="flex-1 truncate font-mono text-[10px] text-(--text-primary)">
                                    {webhookUrl}
                                </span>
                                <button
                                    type="button"
                                    onClick={copyWebhook}
                                    className="shrink-0 rounded-full p-1 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                >
                                    {copiedWebhook ? (
                                        <Check size={12} />
                                    ) : (
                                        <Copy size={12} />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-(--text-muted)">
                                {t(
                                    "paymentGateways.details.api.lastSync"
                                )}
                            </span>
                            <span className="text-(--text-primary)">
                                {gateway.last_sync
                                    ? new Date(
                                          gateway.last_sync
                                      ).toLocaleDateString(locale)
                                    : t(
                                          "paymentGateways.details.api.never"
                                      )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Shield
                            size={18}
                            className="text-(--color-mint)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("paymentGateways.details.configuration")}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3 text-xs">
                        <div>
                            <span className="mb-1 block text-(--text-muted)">
                                {t(
                                    "paymentGateways.details.supportedCurrencies"
                                )}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {gateway.supported_currencies?.length >
                                0 ? (
                                    gateway.supported_currencies.map(
                                        (c) => (
                                            <span
                                                key={c}
                                                className="rounded-full bg-(--bg-hover) px-2 py-0.5 font-mono text-[10px] text-(--text-secondary)"
                                            >
                                                {c}
                                            </span>
                                        )
                                    )
                                ) : (
                                    <span className="text-(--text-muted)">
                                        —
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-(--bg-border) pt-2">
                            <span className="text-(--text-muted)">
                                {t("paymentGateways.details.fees")}
                            </span>
                            <span className="text-(--text-primary)">
                                {gateway.fees_percentage || 0}% +{" "}
                                {gateway.fees_fixed || 0} ₪
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-(--bg-border) pt-2">
                            <span className="text-(--text-muted)">
                                {t("paymentGateways.details.quick.code")}
                            </span>
                            <span className="font-mono text-(--text-primary)">
                                {gateway.code}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}