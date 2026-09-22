import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    Truck,
    Edit,
    Trash2,
    Power,
    PowerOff,
    Link as LinkIcon,
    Building2,
    Hash,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Copy,
    Check,
    Zap,
    Package,
    DollarSign,
    TrendingUp,
    Clock,
} from "lucide-react";
import * as carriersService from "../../Services/shippingCarriersService";

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
export default function ShippingCarrierDetails() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isRTL = i18n.language === "ar";
    const locale = isRTL ? "ar-EG" : "en-US";

    const [carrier, setCarrier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    usePageTitle(carrier?.name);

    // ============================================
    // جلب الشركة
    // ============================================
    const loadCarrier = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await carriersService.getById(id);
            setCarrier(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadCarrier();
    }, [loadCarrier]);

    // ✅ نسخ الكود
    const copyCode = () => {
        if (!carrier) return;
        navigator.clipboard.writeText(carrier.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // ✅ تفعيل/تعطيل
    const toggleActive = async () => {
        if (!carrier) return;
        setToggling(true);
        try {
            await carriersService.toggleActive(
                carrier.id,
                !carrier.is_active
            );
            setCarrier((prev) => ({
                ...prev,
                is_active: !prev.is_active,
            }));
        } catch (err) {
            alert(
                t("shippingCarriers.toggleFailed", {
                    error: err.message || "",
                })
            );
        } finally {
            setToggling(false);
        }
    };

    // ✅ اختبار الاتصال
    const testConnection = async () => {
        if (!carrier) return;
        setTesting(true);
        setTestResult(null);
        try {
            const result = await carriersService.testConnection(
                carrier.id
            );
            setTestResult({
                success: true,
                message: t("shippingCarriers.details.testSuccess"),
            });
        } catch (err) {
            setTestResult({
                success: false,
                message: t("shippingCarriers.details.testFailed", {
                    error: err.message || "",
                }),
            });
        } finally {
            setTesting(false);
        }
    };

    // ✅ حذف
    const handleDelete = async () => {
        if (!carrier) return;
        if (
            !confirm(
                t("shippingCarriers.confirmDelete", {
                    name: carrier.name,
                })
            )
        )
            return;
        try {
            await carriersService.remove(carrier.id);
            navigate("/shipping-carriers");
        } catch (err) {
            alert(
                t("shippingCarriers.deleteFailed", {
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
                        {t("shippingCarriers.details.loading")}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !carrier) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <Truck size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {error
                        ? t("shippingCarriers.details.loadError")
                        : t("shippingCarriers.details.notFound")}
                </h2>
                {error && (
                    <p className="flex items-center gap-2 text-sm text-(--color-error)">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                <Link
                    to="/shipping-carriers"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("shippingCarriers.details.back")}
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
                        onClick={() => navigate("/shipping-carriers")}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight
                            size={16}
                            className={isRTL ? "" : "rotate-180"}
                        />
                    </button>

                    {carrier.logo_url ? (
                        <img
                            src={carrier.logo_url}
                            alt={carrier.name}
                            className="h-14 w-14 rounded-2xl border border-(--bg-border) bg-white object-contain p-1"
                        />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-amber)/10 text-(--color-amber)">
                            <Building2 size={26} />
                        </div>
                    )}

                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {carrier.name}
                        </h1>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    carrier.is_active
                                        ? "bg-(--color-mint)/10 text-(--color-mint)"
                                        : "bg-(--text-muted)/10 text-(--text-muted)"
                                }`}
                            >
                                {carrier.is_active ? (
                                    <CheckCircle2 size={11} />
                                ) : (
                                    <AlertCircle size={11} />
                                )}
                                {carrier.is_active
                                    ? t("shippingCarriers.status.active")
                                    : t(
                                          "shippingCarriers.status.inactive"
                                      )}
                            </span>

                            <button
                                type="button"
                                onClick={copyCode}
                                className="inline-flex items-center gap-1 rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs font-mono text-(--text-secondary) transition-colors hover:text-(--color-lavender)"
                            >
                                {copied ? (
                                    <Check size={11} />
                                ) : (
                                    <Copy size={11} />
                                )}
                                {carrier.code}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {carrier.api_enabled && (
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
                                    ? t(
                                          "shippingCarriers.details.testing"
                                      )
                                    : t(
                                          "shippingCarriers.details.testConnection"
                                      )}
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={toggleActive}
                        disabled={toggling}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                            carrier.is_active
                                ? "border-(--bg-border) text-(--text-secondary) hover:bg-(--bg-hover)"
                                : "border-(--color-mint) text-(--color-mint) hover:bg-(--color-mint)/10"
                        }`}
                    >
                        {toggling ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : carrier.is_active ? (
                            <>
                                <PowerOff size={14} />
                                <span>
                                    {t(
                                        "shippingCarriers.details.deactivate"
                                    )}
                                </span>
                            </>
                        ) : (
                            <>
                                <Power size={14} />
                                <span>
                                    {t(
                                        "shippingCarriers.details.activate"
                                    )}
                                </span>
                            </>
                        )}
                    </button>

                    <Link
                        to={`/shipping-carriers/${carrier.id}/edit`}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Edit size={15} />
                        <span>{t("shippingCarriers.details.edit")}</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-(--bg-border) text-(--color-error) transition-colors hover:bg-(--color-error) hover:text-white"
                        title={t("shippingCarriers.details.delete")}
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
                    icon={Package}
                    label={t(
                        "shippingCarriers.details.stats.shipments"
                    )}
                    value={Number(carrier.shipments_count || 0).toLocaleString(
                        locale
                    )}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={TrendingUp}
                    label={t(
                        "shippingCarriers.details.stats.successRate"
                    )}
                    value={`${carrier.success_rate || 0}%`}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
                <InfoCard
                    icon={Clock}
                    label={t(
                        "shippingCarriers.details.stats.avgDelivery"
                    )}
                    value={carrier.avg_delivery || "—"}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
                <InfoCard
                    icon={DollarSign}
                    label={t(
                        "shippingCarriers.details.stats.totalCost"
                    )}
                    value={`${Number(
                        carrier.total_cost || 0
                    ).toLocaleString(locale)} ₪`}
                    color="text-(--color-pink) bg-(--color-pink)/10"
                />
            </div>

            {/* معلومات API + روابط */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* API Info */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Zap
                            size={18}
                            className="text-(--color-lavender)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("shippingCarriers.details.apiInfo")}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center justify-between border-b border-(--bg-border) py-2">
                            <span className="text-(--text-muted)">
                                {t("shippingCarriers.details.api.status")}
                            </span>
                            <span
                                className={
                                    carrier.api_enabled
                                        ? "text-(--color-mint)"
                                        : "text-(--text-muted)"
                                }
                            >
                                {carrier.api_enabled
                                    ? t(
                                          "shippingCarriers.apiStatus.enabled"
                                      )
                                    : t(
                                          "shippingCarriers.apiStatus.disabled"
                                      )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-(--bg-border) py-2">
                            <span className="text-(--text-muted)">
                                {t(
                                    "shippingCarriers.details.api.endpoint"
                                )}
                            </span>
                            <span className="max-w-[60%] truncate font-mono text-(--text-primary)">
                                {carrier.api_endpoint || "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-(--text-muted)">
                                {t(
                                    "shippingCarriers.details.api.lastSync"
                                )}
                            </span>
                            <span className="text-(--text-primary)">
                                {carrier.last_sync
                                    ? new Date(
                                          carrier.last_sync
                                      ).toLocaleDateString(locale)
                                    : t(
                                          "shippingCarriers.details.api.never"
                                      )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* معلومات سريعة */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <LinkIcon
                            size={18}
                            className="text-(--color-amber)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("shippingCarriers.details.quickInfo")}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center justify-between border-b border-(--bg-border) py-2">
                            <span className="text-(--text-muted)">
                                {t("shippingCarriers.details.quick.code")}
                            </span>
                            <span className="font-mono text-(--text-primary)">
                                {carrier.code}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 border-b border-(--bg-border) py-2">
                            <span className="text-(--text-muted)">
                                {t(
                                    "shippingCarriers.details.quick.trackingUrl"
                                )}
                            </span>
                            <span className="break-all text-(--text-primary)">
                                {carrier.tracking_url_pattern || "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-(--text-muted)">
                                {t(
                                    "shippingCarriers.details.quick.status"
                                )}
                            </span>
                            <span
                                className={
                                    carrier.is_active
                                        ? "text-(--color-mint)"
                                        : "text-(--text-muted)"
                                }
                            >
                                {carrier.is_active
                                    ? t("shippingCarriers.status.active")
                                    : t(
                                          "shippingCarriers.status.inactive"
                                      )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}