import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Wallet,
    Plus,
    Settings2,
    Trash2,
    Power,
    PowerOff,
    Eye,
    RefreshCw,
    AlertCircle,
    Zap,
    Shield,
    CreditCard,
    Copy,
    Check,
} from "lucide-react";
import * as gatewaysService from "../../Services/paymentGatewaysService";
import { supabase } from "../../lib/supabase";

// ============================================
// الصفحة
// ============================================
export default function PaymentGateways() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [gateways, setGateways] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [copiedId, setCopiedId] = useState(null);

    // ============================================
    // جلب البوابات
    // ============================================
    const loadGateways = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await gatewaysService.getAll();
            setGateways(data || []);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGateways();
    }, [loadGateways, refreshKey]);

    // ✅ Realtime
    useEffect(() => {
        const channel = supabase
            .channel("payment_gateways_realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "payment_gateways",
                },
                () => setRefreshKey((k) => k + 1)
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // ============================================
    // تفعيل/تعطيل
    // ============================================
    const toggleStatus = async (gateway) => {
        try {
            await gatewaysService.toggleActive(
                gateway.id,
                !gateway.is_active
            );
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("paymentGateways.toggleFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // حذف
    // ============================================
    const handleDelete = async (gateway) => {
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
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("paymentGateways.deleteFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // نسخ Webhook URL
    // ============================================
    const copyWebhook = (gateway) => {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-webhook?gateway=${gateway.code}`;
        navigator.clipboard.writeText(url);
        setCopiedId(gateway.id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    // ============================================
    // Loading
    // ============================================
    if (loading && gateways.length === 0) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("paymentGateways.loading")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* رأس الصفحة */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2.5">
                        <Wallet
                            size={24}
                            className="text-(--color-mint)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("paymentGateways.title")}
                        </h1>
                        <p className="mt-1 text-sm text-(--text-muted)">
                            {t("paymentGateways.subtitle")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setRefreshKey((k) => k + 1)}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender) disabled:opacity-50"
                    >
                        <RefreshCw
                            size={14}
                            className={loading ? "animate-spin" : ""}
                        />
                        <span>{t("paymentGateways.refresh")}</span>
                    </button>

                    <button
                        onClick={() => navigate("/payment-gateways/new")}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus size={16} />
                        {t("paymentGateways.newGateway")}
                    </button>
                </div>
            </div>

            {/* خطأ */}
            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                    <AlertCircle
                        size={18}
                        className="shrink-0 text-(--color-error)"
                    />
                    <span className="text-(--text-primary)">{error}</span>
                </div>
            )}

            {/* فارغ */}
            {!loading && gateways.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-(--bg-border) bg-(--bg-card) py-16">
                    <Wallet size={48} className="text-(--text-muted)" />
                    <div className="text-center">
                        <h3 className="font-bold text-(--text-primary)">
                            {t("paymentGateways.empty.title")}
                        </h3>
                        <p className="mt-1 text-sm text-(--text-muted)">
                            {t("paymentGateways.empty.subtitle")}
                        </p>
                    </div>
                    <button
                        onClick={() =>
                            navigate("/payment-gateways/new")
                        }
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white"
                    >
                        <Plus size={16} />
                        {t("paymentGateways.addGateway")}
                    </button>
                </div>
            )}

            {/* شبكة البوابات */}
            {gateways.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {gateways.map((gateway) => (
                        <div
                            key={gateway.id}
                            className={`group relative flex flex-col rounded-2xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-xs transition-all hover:shadow-md ${
                                !gateway.is_active && "opacity-70"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {gateway.logo_url ? (
                                        <img
                                            src={gateway.logo_url}
                                            alt={gateway.name}
                                            className="h-10 w-10 rounded-xl border border-(--bg-border) bg-white object-contain p-1"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-mint)/10 text-(--color-mint)">
                                            <CreditCard size={20} />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-(--text-primary)">
                                            {gateway.name}
                                        </h3>
                                        <span className="font-mono text-xs text-(--text-muted)">
                                            {gateway.code}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <div
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            gateway.is_active
                                                ? "bg-(--color-mint)/10 text-(--color-mint)"
                                                : "bg-(--text-muted)/10 text-(--text-muted)"
                                        }`}
                                    >
                                        {gateway.is_active
                                            ? t(
                                                  "paymentGateways.status.active"
                                              )
                                            : t(
                                                  "paymentGateways.status.inactive"
                                              )}
                                    </div>
                                    <div
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
                                    </div>
                                </div>
                            </div>

                            {/* العملات المدعومة */}
                            {gateway.supported_currencies?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {gateway.supported_currencies
                                        .slice(0, 4)
                                        .map((c) => (
                                            <span
                                                key={c}
                                                className="rounded-full bg-(--bg-hover) px-2 py-0.5 text-[10px] font-mono text-(--text-secondary)"
                                            >
                                                {c}
                                            </span>
                                        ))}
                                    {gateway.supported_currencies.length >
                                        4 && (
                                        <span className="text-[10px] text-(--text-muted)">
                                            +
                                            {gateway.supported_currencies
                                                .length - 4}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* العمولة */}
                            {gateway.fees_percentage !== undefined && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-(--text-muted)">
                                    <Shield size={11} />
                                    <span>
                                        {gateway.fees_percentage}% +{" "}
                                        {gateway.fees_fixed || 0} ₪
                                    </span>
                                </div>
                            )}

                            {/* الإجراءات */}
                            <div className="mt-4 flex items-center justify-between gap-1 border-t border-(--bg-border) pt-3">
                                <button
                                    onClick={() => copyWebhook(gateway)}
                                    className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                    title={t(
                                        "paymentGateways.details.copyWebhook"
                                    )}
                                >
                                    {copiedId === gateway.id ? (
                                        <Check size={11} />
                                    ) : (
                                        <Copy size={11} />
                                    )}
                                    <span>
                                        {t(
                                            "paymentGateways.details.quick.webhook"
                                        )}
                                    </span>
                                </button>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/payment-gateways/${gateway.id}`
                                            )
                                        }
                                        className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                        title={t(
                                            "paymentGateways.actions.view"
                                        )}
                                    >
                                        <Eye size={14} />
                                    </button>
                                    <button
                                        onClick={() =>
                                            toggleStatus(gateway)
                                        }
                                        className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                        title={
                                            gateway.is_active
                                                ? t(
                                                      "paymentGateways.actions.deactivate"
                                                  )
                                                : t(
                                                      "paymentGateways.actions.activate"
                                                  )
                                        }
                                    >
                                        {gateway.is_active ? (
                                            <PowerOff size={14} />
                                        ) : (
                                            <Power size={14} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/payment-gateways/${gateway.id}/edit`
                                            )
                                        }
                                        className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                        title={t(
                                            "paymentGateways.actions.edit"
                                        )}
                                    >
                                        <Settings2 size={14} />
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDelete(gateway)
                                        }
                                        className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-error)"
                                        title={t(
                                            "paymentGateways.actions.delete"
                                        )}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}