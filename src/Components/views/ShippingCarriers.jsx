import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Truck,
    Plus,
    Settings2,
    Trash2,
    Power,
    PowerOff,
    Eye,
    RefreshCw,
    AlertCircle,
    Link as LinkIcon,
    Building2,
} from "lucide-react";
import * as carriersService from "../../Services/shippingCarriersService";
import { supabase } from "../../lib/supabase";

// ============================================
// الصفحة
// ============================================
export default function ShippingCarriers() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [carriers, setCarriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // ============================================
    // جلب الشركات
    // ============================================
    const loadCarriers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await carriersService.getAll();
            setCarriers(data || []);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCarriers();
    }, [loadCarriers, refreshKey]);

    // ✅ Realtime
    useEffect(() => {
        const channel = supabase
            .channel("shipping_carriers_realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "shipping_carriers",
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
    const toggleStatus = async (carrier) => {
        try {
            await carriersService.toggleActive(
                carrier.id,
                !carrier.is_active
            );
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("shippingCarriers.toggleFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // حذف
    // ============================================
    const handleDelete = async (carrier) => {
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
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("shippingCarriers.deleteFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // Loading
    // ============================================
    if (loading && carriers.length === 0) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("shippingCarriers.loading")}
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
                        <Truck
                            size={24}
                            className="text-(--color-amber)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("shippingCarriers.title")}
                        </h1>
                        <p className="mt-1 text-sm text-(--text-muted)">
                            {t("shippingCarriers.subtitle")}
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
                        <span>{t("shippingCarriers.refresh")}</span>
                    </button>

                    <button
                        onClick={() => navigate("/shipping-carriers/new")}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus size={16} />
                        {t("shippingCarriers.newCarrier")}
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
            {!loading && carriers.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-(--bg-border) bg-(--bg-card) py-16">
                    <Truck size={48} className="text-(--text-muted)" />
                    <div className="text-center">
                        <h3 className="font-bold text-(--text-primary)">
                            {t("shippingCarriers.empty.title")}
                        </h3>
                        <p className="mt-1 text-sm text-(--text-muted)">
                            {t("shippingCarriers.empty.subtitle")}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/shipping-carriers/new")}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white"
                    >
                        <Plus size={16} />
                        {t("shippingCarriers.addCarrier")}
                    </button>
                </div>
            )}

            {/* شبكة الشركات */}
            {carriers.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {carriers.map((carrier) => (
                        <div
                            key={carrier.id}
                            className={`group relative flex flex-col rounded-2xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-xs transition-all hover:shadow-md ${
                                !carrier.is_active && "opacity-70"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {carrier.logo_url ? (
                                        <img
                                            src={carrier.logo_url}
                                            alt={carrier.name}
                                            className="h-10 w-10 rounded-xl object-contain border border-(--bg-border) bg-white p-1"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-amber)/10 text-(--color-amber)">
                                            <Building2 size={20} />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-(--text-primary)">
                                            {carrier.name}
                                        </h3>
                                        <span className="font-mono text-xs text-(--text-muted)">
                                            {carrier.code}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        carrier.is_active
                                            ? "bg-(--color-mint)/10 text-(--color-mint)"
                                            : "bg-(--text-muted)/10 text-(--text-muted)"
                                    }`}
                                >
                                    {carrier.is_active
                                        ? t("shippingCarriers.status.active")
                                        : t(
                                              "shippingCarriers.status.inactive"
                                          )}
                                </div>
                            </div>

                            {carrier.tracking_url_pattern && (
                                <div className="mt-3 flex items-center gap-1 text-xs text-(--text-muted)">
                                    <LinkIcon size={11} />
                                    <span className="truncate">
                                        {carrier.tracking_url_pattern.slice(
                                            0,
                                            40
                                        )}
                                        ...
                                    </span>
                                </div>
                            )}

                            {/* API Badge */}
                            <div className="mt-3">
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                                        carrier.api_enabled
                                            ? "bg-(--color-lavender)/10 text-(--color-lavender)"
                                            : "bg-(--bg-hover) text-(--text-muted)"
                                    }`}
                                >
                                    <LinkIcon size={10} />
                                    {carrier.api_enabled
                                        ? t(
                                              "shippingCarriers.apiStatus.enabled"
                                          )
                                        : t(
                                              "shippingCarriers.apiStatus.disabled"
                                          )}
                                </span>
                            </div>

                            {/* الإجراءات */}
                            <div className="mt-4 flex items-center justify-end gap-1 border-t border-(--bg-border) pt-3">
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/shipping-carriers/${carrier.id}`
                                        )
                                    }
                                    className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                    title={t("shippingCarriers.actions.view")}
                                >
                                    <Eye size={14} />
                                </button>
                                <button
                                    onClick={() => toggleStatus(carrier)}
                                    className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                    title={
                                        carrier.is_active
                                            ? t(
                                                  "shippingCarriers.actions.deactivate"
                                              )
                                            : t(
                                                  "shippingCarriers.actions.activate"
                                              )
                                    }
                                >
                                    {carrier.is_active ? (
                                        <PowerOff size={14} />
                                    ) : (
                                        <Power size={14} />
                                    )}
                                </button>
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/shipping-carriers/${carrier.id}/edit`
                                        )
                                    }
                                    className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                    title={t("shippingCarriers.actions.edit")}
                                >
                                    <Settings2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(carrier)}
                                    className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-error)"
                                    title={t(
                                        "shippingCarriers.actions.delete"
                                    )}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}