import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    Truck,
    Edit,
    Package,
    MapPin,
    Calendar,
    DollarSign,
    Weight,
    CheckCircle2,
    Clock,
    Building2,
    Route,
    Loader2,
    AlertCircle,
} from "lucide-react";
import {
    DonutChart,
    BarChart,
    LineChart,
} from "../SubComponents/charts";
import { TemplateDarkMode } from "../../Store/TemplateSettings";
import * as shippingService from "../../Services/shippingService";

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
// Timeline
// ============================================
function Timeline({ shipment }) {
    const { t } = useTranslation();

    const steps = [
        {
            label: t("shipping.details.timelineCreated"),
            date: shipment.created_at?.slice(0, 10),
            done: true,
        },
        {
            label: t("shipping.details.timelinePreparing"),
            date: shipment.shipped_at,
            done: shipment.status !== "preparing",
        },
        {
            label: t("shipping.details.timelineShipped"),
            date: shipment.shipped_at,
            done: ["shipped", "in_transit", "delivered"].includes(
                shipment.status
            ),
        },
        {
            label: t("shipping.details.timelineInTransit"),
            date: shipment.shipped_at,
            done: ["in_transit", "delivered"].includes(shipment.status),
        },
        {
            label: t("shipping.details.timelineDelivered"),
            date: shipment.delivered_at || "—",
            done: shipment.status === "delivered",
        },
    ];

    return (
        <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
            <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                {t("shipping.details.timeline")}
            </h2>

            <div className="flex flex-col gap-0">
                {steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                                    step.done
                                        ? "border-(--color-mint) bg-(--color-mint) text-white"
                                        : "border-(--bg-border) bg-(--bg-card) text-(--text-muted)"
                                }`}
                            >
                                {step.done ? (
                                    <CheckCircle2 size={14} />
                                ) : (
                                    <Clock size={14} />
                                )}
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-0.5 flex-1 min-h-8 ${
                                        step.done
                                            ? "bg-(--color-mint)"
                                            : "bg-(--bg-border)"
                                    }`}
                                />
                            )}
                        </div>

                        <div className="pb-4">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-sm font-medium ${
                                        step.done
                                            ? "text-(--text-primary)"
                                            : "text-(--text-muted)"
                                    }`}
                                >
                                    {step.label}
                                </span>
                                <span className="text-xs text-(--text-muted)">
                                    {step.date || "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function ShippingDetails() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const darkMode = useSelector(TemplateDarkMode);
    const isDark = darkMode === "dark" || darkMode === true;
    const isRTL = i18n.language === "ar";
    const locale = isRTL ? "ar-EG" : "en-US";

    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    usePageTitle(shipment?.tracking_number);

    // أسماء الشهور من الترجمة
    const monthLabels = useMemo(
        () =>
            (t("common.months", { returnObjects: true }) || []).slice(0, 6),
        [t, i18n.language]
    );

    // ============================================
    // جلب الشحنة
    // ============================================
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const s = await shippingService.getById(id);
                if (!cancelled) setShipment(s);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    // ✅ بيانات الرسوم
    const statusDist = useMemo(() => {
        if (!shipment) return [];
        return [
            {
                id: 0,
                label: t(`shipping.status.${shipment.status}`),
                value: 1,
                color: "#6366F1",
            },
        ];
    }, [shipment, t, i18n.language]);

    const monthly = useMemo(() => {
        return monthLabels.map((label) => ({
            label,
            value: Math.round(Math.random() * 30 + 5),
        }));
    }, [monthLabels]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("shipping.details.loading")}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !shipment) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <Truck size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {error
                        ? t("shipping.details.loadError")
                        : t("shipping.details.notFound")}
                </h2>
                {error && (
                    <p className="flex items-center gap-2 text-sm text-(--color-error)">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                <Link
                    to="/shipping"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("shipping.details.back")}
                </Link>
            </div>
        );
    }

    // ✅ شارة الحالة
    const STATUS = {
        preparing: {
            cls: "text-(--color-pink) bg-(--color-pink)/10",
        },
        shipped: {
            cls: "text-(--color-amber) bg-(--color-amber)/10",
        },
        in_transit: {
            cls: "text-(--color-lavender) bg-(--color-lavender)/10",
        },
        delivered: {
            cls: "text-(--color-mint) bg-(--color-mint)/10",
        },
        delayed: {
            cls: "text-(--color-error) bg-(--color-error)/10",
        },
        cancelled: {
            cls: "text-(--text-muted) bg-(--bg-hover)",
        },
    };
    const statusObj = STATUS[shipment.status] || STATUS.preparing;

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        to="/shipping"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight
                            size={16}
                            className={isRTL ? "" : "rotate-180"}
                        />
                    </Link>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-amber) text-white">
                        <Truck size={22} />
                    </div>

                    <div>
                        <h1 className="font-mono text-xl font-bold text-(--text-primary)">
                            {shipment.tracking_number}
                        </h1>
                        <div className="mt-0.5 flex items-center gap-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusObj.cls}`}
                            >
                                {t(`shipping.status.${shipment.status}`)}
                            </span>
                            <span className="text-xs text-(--text-muted)">
                                {shipment.carrier} •{" "}
                                {t(`shipping.methods.${shipment.method}`, {
                                    defaultValue: shipment.method,
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                <Link
                    to={`/shipping/${shipment.id}/edit`}
                    className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                    <Edit size={15} />
                    <span>{t("shipping.details.edit")}</span>
                </Link>
            </div>

            {/* بطاقات المعلومات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={Package}
                    label={t("shipping.details.stats.client")}
                    value={shipment.client_name || "—"}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={Weight}
                    label={t("shipping.details.stats.weight")}
                    value={`${Number(shipment.weight).toFixed(2)} ${t(
                        "shipping.details.weightUnit"
                    )}`}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
                <InfoCard
                    icon={DollarSign}
                    label={t("shipping.details.stats.cost")}
                    value={`${Number(shipment.cost).toLocaleString(
                        i18n.language
                    )} ₪`}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
                <InfoCard
                    icon={Calendar}
                    label={t("shipping.details.stats.shippedAt")}
                    value={shipment.shipped_at || "—"}
                    color="text-(--color-pink) bg-(--color-pink)/10"
                />
            </div>

            {/* معلومات الشحن */}
            <div className="mb-4 grid gap-3 md:grid-cols-3">
                <InfoCard
                    icon={Building2}
                    label={t("shipping.details.carrier")}
                    value={shipment.carrier || "—"}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={Route}
                    label={t("shipping.details.method")}
                    value={t(`shipping.methods.${shipment.method}`, {
                        defaultValue: shipment.method,
                    })}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
                <InfoCard
                    icon={MapPin}
                    label={t("shipping.details.destination")}
                    value={`${shipment.country || ""} - ${
                        shipment.city || ""
                    }`}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
            </div>

            {/* Timeline + Donut */}
            <div className="mb-4 grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Timeline shipment={shipment} />
                </div>
                <div>
                    <DonutChart
                        data={statusDist}
                        isDark={isDark}
                        title={t("shipping.details.statusChart")}
                        height={300}
                        totalLabel={t("shipping.details.statusChartTotal")}
                    />
                </div>
            </div>

            {/* رسوم */}
            <div className="grid gap-4 md:grid-cols-2">
                <LineChart
                    data={monthly}
                    isDark={isDark}
                    title={t("shipping.details.shipmentsMovement")}
                    subtitle={t("shipping.details.last6Months")}
                    height={280}
                    valueSuffix=""
                />
                <BarChart
                    data={monthly}
                    isDark={isDark}
                    title={t("shipping.details.shipmentsComparison")}
                    subtitle={t("shipping.details.last6Months")}
                    height={280}
                    valueSuffix=""
                />
            </div>
        </>
    );
}