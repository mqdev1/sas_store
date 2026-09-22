import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
    Package,
    PlusIcon,
    ShoppingBasket,
    ShoppingCart,
    Users,
    TrendingUp,
    DollarSign,
    Clock,
    ArrowUpRight,
    RefreshCw,
} from "lucide-react";

import DataTable from "../SubComponents/DataTable";
import {
    DonutChart,
    BarChart,
    LineChart,
    RadialBarChart,
} from "../SubComponents/charts";
import { TemplateDarkMode } from "../../Store/TemplateSettings";
import { supabase } from "../../lib/supabase";

import * as ordersService from "../../Services/ordersService";
import * as productsService from "../../Services/productsService";
import * as reportsService from "../../Services/reportsService";

// ============================================
// إعدادات أعمدة الجدول
// ============================================
const getTableColumns = (t) => [
    {
        headerText: t("home.table.id"),
        name: "id",
        sortable: true,
        render: (row) => (
            <span className="font-mono text-xs text-(--color-lavender)">
                #{row.id}
            </span>
        ),
    },
    {
        headerText: t("home.table.client"),
        name: "client_name",
        sortable: true,
    },
    {
        headerText: t("home.table.status"),
        name: "status",
        sortable: true,
        render: (row) => {
            const STATUS = {
                pending: {
                    color: "text-(--color-amber) bg-(--color-amber)/10",
                },
                processing: {
                    color: "text-(--color-lavender) bg-(--color-lavender)/10",
                },
                shipped: {
                    color: "text-(--color-lavender) bg-(--color-lavender)/10",
                },
                delivered: {
                    color: "text-(--color-mint) bg-(--color-mint)/10",
                },
                cancelled: {
                    color: "text-(--color-error) bg-(--color-error)/10",
                },
                refunded: {
                    color: "text-(--color-pink) bg-(--color-pink)/10",
                },
            };
            const s = STATUS[row.status] || STATUS.pending;
            return (
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}
                >
                    {t(`home.status.${row.status}`) ||
                        t("home.status.pending")}
                </span>
            );
        },
    },
    {
        headerText: t("home.table.date"),
        name: "order_date",
        sortable: true,
    },
    {
        headerText: t("home.table.total"),
        name: "total",
        sortable: true,
        render: (row) => (
            <span className="font-bold text-(--color-mint)">
                {Number(row.total).toLocaleString()} ₪
            </span>
        ),
    },
    {
        headerText: t("home.table.options"),
        name: "events",
        events: [
            {
                name: "on_preview",
                event: (row) =>
                    (window.location.href = `/orders/${row.id}`),
            },
            {
                name: "on_edit",
                event: (row) =>
                    (window.location.href = `/orders/${row.id}/edit`),
            },
        ],
    },
];

// ============================================
// بطاقة إحصائية
// ============================================
function StatCard({
    title,
    subtitle,
    value,
    to,
    icon: Icon,
    color,
    trend,
    loading,
}) {
    return (
        <div className="flex w-full flex-col rounded-2xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-xs transition-colors hover:border-(--color-lavender)">
            <div className="flex items-center justify-between">
                <h2 className="text-md text-(--text-primary)">{title}</h2>
                {trend && !loading && (
                    <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            trend.startsWith("-")
                                ? "bg-(--color-error)/10 text-(--color-error)"
                                : "bg-(--color-mint)/10 text-(--color-mint)"
                        }`}
                    >
                        <ArrowUpRight size={12} />
                        {trend}
                    </span>
                )}
            </div>
            <div className="flex w-full items-center justify-between">
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-(--text-muted)">{subtitle}</p>
                    {loading ? (
                        <div className="h-5 w-20 animate-pulse rounded bg-(--bg-hover)" />
                    ) : (
                        <h1 className="text-sm font-semibold text-(--text-primary)">
                            {value}
                        </h1>
                    )}
                </div>
                <Link
                    to={to}
                    className="ms-3 rounded-full p-3 transition-colors hover:bg-(--bg-hover)"
                >
                    <Icon size={40} className={color} />
                </Link>
            </div>
        </div>
    );
}

// ============================================
// بطاقة صغيرة
// ============================================
function MiniStat({ icon: Icon, label, value, color, loading }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-(--bg-border) bg-(--bg-card) p-3 shadow-xs">
            <div className={`rounded-lg p-2 ${color}`}>
                <Icon size={18} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-(--text-muted)">{label}</span>
                {loading ? (
                    <div className="mt-1 h-4 w-24 animate-pulse rounded bg-(--bg-hover)" />
                ) : (
                    <span className="text-sm font-semibold text-(--text-primary)">
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================
// عنصر نشاط
// ============================================
function ActivityItem({ order }) {
    return (
        <div className="flex items-center justify-between border-b border-(--bg-border) py-2 last:border-b-0">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-lavender)/10 text-(--color-lavender)">
                    <ShoppingCart size={14} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm text-(--text-primary)">
                        {order.client_name || "—"}
                    </span>
                    <span className="text-xs text-(--text-muted)">
                        #{order.id}
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-(--text-primary)">
                    {Number(order.total).toLocaleString()} ₪
                </span>
                <span className="text-xs text-(--text-muted)">
                    {order.order_date}
                </span>
            </div>
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function Home() {
    const { t } = useTranslation();

    const auth = useSelector((s) => s.auth);
    const darkMode = useSelector(TemplateDarkMode);
    const isDark = darkMode === "dark" || darkMode === true;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [stats, setStats] = useState(null);
    const [productCount, setProductCount] = useState(0);
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);
    const [salesByCountry, setSalesByCountry] = useState([]);
    const [ordersByStatus, setOrdersByStatus] = useState([]);
    const [topClients, setTopClients] = useState([]);

    // ============================================
    // جلب كل البيانات
    // ============================================
    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [
                statsRes,
                productCountRes,
                recentRes,
                topProductsRes,
                dailyRes,
                countryRes,
                statusRes,
                clientsRes,
            ] = await Promise.all([
                ordersService.getDashboardStats(),
                productsService.getCount(),
                ordersService.getRecent(5),
                reportsService.getTopProducts(5),
                reportsService.getDailySales(30),
                reportsService.getSalesByCountry(5),
                reportsService.getOrdersByStatus(),
                reportsService.getTopClients(5),
            ]);

            setStats(statsRes);
            setProductCount(productCountRes);
            setRecentOrders(recentRes || []);
            setTopProducts(topProductsRes || []);
            setMonthlySales(dailyRes || []);
            setSalesByCountry(countryRes || []);
            setOrdersByStatus(statusRes || []);
            setTopClients(clientsRes || []);
        } catch (err) {
            console.error("Home load error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll, refreshKey]);

    // ✅ Realtime
    useEffect(() => {
        const channel = supabase
            .channel("home_orders")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                () => setRefreshKey((k) => k + 1)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const columns = useMemo(() => getTableColumns(t), [t]);

    return (
        <>
            {/* ============ العنوان ============ */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-(--text-primary)">
                        {t("home.title")}
                    </h1>
                    <p className="mt-1 text-sm text-(--text-muted)">
                        {t("home.subtitle")}
                    </p>
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
                        <span>{t("home.refresh")}</span>
                    </button>

                    <Link
                        to="/orders/new"
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    >
                        <PlusIcon size={15} />
                        <span>{t("home.newOrder")}</span>
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                    <span className="text-(--color-error)">⚠️ {error}</span>
                </div>
            )}

            {/* ============ بطاقات الإحصائيات الرئيسية ============ */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title={t("home.stats.products")}
                    subtitle={t("home.stats.productsSubtitle")}
                    value={t("home.stats.productsValue", {
                        count: productCount,
                    })}
                    to="/products"
                    icon={Package}
                    color="text-(--color-mint)"
                    trend="+12%"
                    loading={loading}
                />
                <StatCard
                    title={t("home.stats.orders")}
                    subtitle={t("home.stats.ordersSubtitle")}
                    value={t("home.stats.ordersValue", {
                        count: stats?.orders_count || 0,
                    })}
                    to="/orders"
                    icon={ShoppingCart}
                    color="text-(--color-amber)"
                    trend="+8%"
                    loading={loading}
                />
                <StatCard
                    title={t("home.stats.cancelled")}
                    subtitle={t("home.stats.cancelledSubtitle")}
                    value={t("home.stats.cancelledValue", {
                        count: stats?.orders_cancelled || 0,
                    })}
                    to="/orders/cancel"
                    icon={ShoppingBasket}
                    color="text-(--color-pink)"
                    trend="-3%"
                    loading={loading}
                />
                <StatCard
                    title={t("home.stats.clients")}
                    subtitle={t("home.stats.clientsSubtitle")}
                    value={t("home.stats.clientsValue", {
                        count: stats?.clients_count || 0,
                    })}
                    to="/clients"
                    icon={Users}
                    color="text-(--color-lavender)"
                    trend="+15%"
                    loading={loading}
                />
            </div>

            {/* ============ إحصائيات مالية سريعة ============ */}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
                <MiniStat
                    icon={DollarSign}
                    label={t("home.mini.revenue")}
                    value={`${Number(
                        stats?.orders_revenue || 0
                    ).toLocaleString()} ₪`}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                    loading={loading}
                />
                <MiniStat
                    icon={TrendingUp}
                    label={t("home.mini.avgOrder")}
                    value={`${Number(
                        stats?.orders_count
                            ? stats.orders_revenue / stats.orders_count
                            : 0
                    ).toFixed(0)} ₪`}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                    loading={loading}
                />
                <MiniStat
                    icon={Clock}
                    label={t("home.mini.pending")}
                    value={t("home.mini.pendingValue", {
                        count: stats?.orders_pending || 0,
                    })}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                    loading={loading}
                />
            </div>

            {/* ============ الجدول + Donut ============ */}
            <div className="mt-6 gap-5 md:grid md:grid-cols-3">
                <div className="w-full md:col-span-2">
                    <div className="overflow-hidden overflow-x-auto rounded-xl border border-(--bg-border)">
                        <DataTable
                            columns={columns}
                            data={recentOrders}
                            loading={loading}
                            multiselect={false}
                            exportFileName="recent-orders"
                        >
                            <Link
                                to="/orders/new"
                                className="flex cursor-pointer items-center rounded-full border border-(--bg-border) p-2 px-4 hover:bg-(--color-lavender) hover:text-(--bg-elevated)"
                            >
                                <PlusIcon size={15} />
                                <small className="ms-1">
                                    {t("home.table.addNew")}
                                </small>
                            </Link>
                            <Link
                                to="/orders"
                                className="flex cursor-pointer items-center rounded-full border border-(--bg-border) p-2 px-4 hover:bg-(--color-lavender) hover:text-(--bg-elevated)"
                            >
                                <ShoppingCart size={15} />
                                <small className="ms-1">
                                    {t("home.table.reviewOrders")}
                                </small>
                            </Link>
                        </DataTable>
                    </div>
                </div>

                <div className="w-full">
                    <DonutChart
                        data={topProducts}
                        isDark={isDark}
                        title={t("home.charts.topProducts")}
                        subtitle={t("home.charts.topProductsSubtitle")}
                        height={340}
                    />
                </div>
            </div>

            {/* ============ الرسوم البيانية ============ */}
            <div className="mt-5 grid gap-5 md:grid-cols-2">
                <LineChart
                    data={monthlySales}
                    isDark={isDark}
                    title={t("home.charts.dailySales")}
                    subtitle={t("home.charts.dailySalesSubtitle")}
                    height={280}
                />
                <BarChart
                    data={salesByCountry}
                    isDark={isDark}
                    title={t("home.charts.salesByCountry")}
                    subtitle={t("home.charts.salesByCountrySubtitle")}
                    height={280}
                />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
                <RadialBarChart
                    data={ordersByStatus}
                    isDark={isDark}
                    title={t("home.charts.ordersByStatus")}
                    subtitle={t("home.charts.ordersByStatusSubtitle")}
                    height={300}
                />

                {/* آخر الطلبات */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-sm">
                    <h2 className="mb-2 text-base font-semibold text-(--text-primary)">
                        {t("home.recent.title")}
                    </h2>
                    <p className="mb-3 text-xs text-(--text-muted)">
                        {t("home.recent.subtitle")}
                    </p>
                    <div className="flex flex-col">
                        {loading ? (
                            <div className="flex flex-col gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-12 animate-pulse rounded-lg bg-(--bg-hover)"
                                    />
                                ))}
                            </div>
                        ) : recentOrders.length > 0 ? (
                            recentOrders.map((order) => (
                                <ActivityItem key={order.id} order={order} />
                            ))
                        ) : (
                            <p className="py-6 text-center text-sm text-(--text-muted)">
                                {t("home.noOrders")}
                            </p>
                        )}
                    </div>
                </div>

                {/* أعلى العملاء */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-sm">
                    <h2 className="mb-2 text-base font-semibold text-(--text-primary)">
                        {t("home.topClients.title")}
                    </h2>
                    <p className="mb-3 text-xs text-(--text-muted)">
                        {t("home.topClients.subtitle")}
                    </p>
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-8 animate-pulse rounded-lg bg-(--bg-hover)"
                                />
                            ))
                        ) : topClients.length > 0 ? (
                            topClients.map((client, idx) => (
                                <div
                                    key={client.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                                            style={{
                                                background: client.color,
                                            }}
                                        >
                                            {idx + 1}
                                        </div>
                                        <span className="text-sm text-(--text-primary)">
                                            {client.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-(--text-primary)">
                                        {Number(
                                            client.total
                                        ).toLocaleString()}{" "}
                                        ₪
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="py-6 text-center text-sm text-(--text-muted)">
                                {t("home.noClients")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}