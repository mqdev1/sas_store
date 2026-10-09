import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    Users,
    Edit,
    DollarSign,
    ShoppingCart,
    Mail,
    Phone,
    MapPin,
    Calendar,
    TrendingUp,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { LineChart, BarChart } from "../SubComponents/charts";
import { TemplateDarkMode } from "../../Store/TemplateSettings";
import * as clientsService from "../../Services/clientsService";

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
// حساب المشتريات الشهرية من الطلبات
// ============================================
function computeMonthlySpending(orders, months) {
    const buckets = months.slice(0, 6).map((label) => ({
        label,
        value: 0,
    }));

    orders.forEach((o) => {
        const d = new Date(o.created_at || o.order_date);
        if (isNaN(d)) return;
        const idx = d.getMonth() % 6;
        if (buckets[idx]) {
            buckets[idx].value += Number(o.total || 0);
        }
    });

    return buckets.map((b) => ({
        ...b,
        value: Math.round(b.value),
    }));
}

// ============================================
// الصفحة
// ============================================
export default function ClientDetails() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const darkMode = useSelector(TemplateDarkMode);
    const isDark = darkMode === "dark" || darkMode === true;
    const isRTL = i18n.language === "ar";
    const locale = isRTL ? "ar-EG" : "en-US";

    const [client, setClient] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    usePageTitle(client?.name);

    // أسماء الشهور من الترجمة
    const monthsLabels = useMemo(
        () =>
            (t("common.months", { returnObjects: true }) || []).slice(0, 6),
        [t, i18n.language]
    );

    // ============================================
    // تحميل البيانات
    // ============================================
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const c = await clientsService.getById(id);
                if (cancelled) return;
                setClient(c);

                // ✅ جلب طلبات العميل
                const clientOrders = await clientsService.getClientOrders(
                    c.name
                );
                if (!cancelled) setOrders(clientOrders || []);
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

    const monthly = useMemo(
        () => computeMonthlySpending(orders, monthsLabels),
        [orders, monthsLabels]
    );

    // ✅ عميل محسوب
    const computed = useMemo(() => {
        if (!client) return null;
        const ordersCount = orders.length || client.orders || 0;
        const spent =
            orders.reduce((s, o) => s + Number(o.total || 0), 0) ||
            client.spent ||
            0;
        return {
            ...client,
            orders: ordersCount,
            spent: Math.round(spent),
            avgOrder: ordersCount
                ? Math.round(spent / ordersCount)
                : 0,
        };
    }, [client, orders]);

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
                        {t("clients.details.loading")}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !computed) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <Users size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {error
                        ? t("clients.details.loadError")
                        : t("clients.details.notFound")}
                </h2>
                {error && (
                    <p className="flex items-center gap-2 text-sm text-(--color-error)">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                <Link
                    to="/clients"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("clients.details.back")}
                </Link>
            </div>
        );
    }

    const isActive =
        computed.status === "active" || computed.status === "نشط";

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        to="/clients"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight
                            size={16}
                            className={isRTL ? "" : "rotate-180"}
                        />
                    </Link>

                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white"
                        style={{
                            background: computed.color || "#6366F1",
                        }}
                    >
                        {(computed.name || "?")[0]}
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {computed.name}
                        </h1>
                        <div className="mt-0.5 flex items-center gap-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    isActive
                                        ? "text-(--color-mint) bg-(--color-mint)/10"
                                        : "text-(--text-muted) bg-(--bg-hover)"
                                }`}
                            >
                                {isActive
                                    ? t("clients.details.active")
                                    : t("clients.details.inactive")}
                            </span>
                            {computed.created_at && (
                                <span className="text-xs text-(--text-muted)">
                                    {t("clients.details.memberSince", {
                                        date: new Date(
                                            computed.created_at
                                        ).toLocaleDateString(locale),
                                    })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <Link
                    to={`/clients/${computed.id}/edit`}
                    className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                    <Edit size={15} />
                    <span>{t("clients.details.edit")}</span>
                </Link>
            </div>

            {/* بطاقات المعلومات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={ShoppingCart}
                    label={t("clients.details.stats.orders")}
                    value={computed.orders.toLocaleString(locale)}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={DollarSign}
                    label={t("clients.details.stats.spent")}
                    value={`${computed.spent.toLocaleString(locale)} ₪`}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
                <InfoCard
                    icon={TrendingUp}
                    label={t("clients.details.stats.avgOrder")}
                    value={`${computed.avgOrder.toLocaleString(locale)} ₪`}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
                <InfoCard
                    icon={Calendar}
                    label={t("clients.details.stats.joinedAt")}
                    value={
                        computed.created_at
                            ? new Date(computed.created_at).toLocaleDateString(
                                  locale
                              )
                            : "—"
                    }
                    color="text-(--color-pink) bg-(--color-pink)/10"
                />
            </div>

            {/* معلومات الاتصال */}
            <div className="mb-4 rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                    {t("clients.details.contactInfo")}
                </h2>
                <div className="grid gap-3 md:grid-cols-3">
                    <InfoCard
                        icon={Mail}
                        label={t("clients.details.email")}
                        value={computed.email || "—"}
                        color="text-(--color-lavender) bg-(--color-lavender)/10"
                    />
                    <InfoCard
                        icon={Phone}
                        label={t("clients.details.phone")}
                        value={computed.phone || "—"}
                        color="text-(--color-mint) bg-(--color-mint)/10"
                    />
                    <InfoCard
                        icon={MapPin}
                        label={t("clients.details.address")}
                        value={computed.address || "—"}
                        color="text-(--color-amber) bg-(--color-amber)/10"
                    />
                </div>
            </div>

            {/* الرسوم */}
            <div className="grid gap-4 md:grid-cols-2">
                <LineChart
                    data={monthly}
                    isDark={isDark}
                    title={t("clients.details.monthlySpending")}
                    subtitle={t("clients.details.byMonth")}
                    height={280}
                />
                <BarChart
                    data={monthly}
                    isDark={isDark}
                    title={t("clients.details.spendingComparison")}
                    subtitle={t("clients.details.byMonth")}
                    height={280}
                />
            </div>
        </>
    );
}