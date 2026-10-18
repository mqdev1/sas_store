import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AIReportModal from "../SubComponents/AIReportModal";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Download,
    Calendar,
    RefreshCw,
    Printer,
    FileText,
    Percent,
    Package,
    Crown,
    Globe,
    CreditCard,
    AlertCircle,
    Sparkles,
} from "lucide-react";
import {
    LineChart,
    BarChart,
    DonutChart,
} from "../SubComponents/charts";
import { TemplateDarkMode } from "../../Store/TemplateSettings";
import * as reportsService from "../../Services/reportsService";

// ============================================
// نطاقات زمنية
// ============================================
const DATE_RANGES = [
    { key: "7d", days: 7 },
    { key: "30d", days: 30 },
    { key: "90d", days: 90 },
    { key: "6m", days: 180 },
    { key: "1y", days: 365 },
];

// ============================================
// بطاقة KPI
// ============================================
function KPICard({
    title,
    value,
    growth,
    icon: Icon,
    color,
    suffix = "",
    prefix = "",
    loading = false,
}) {
    const isPositive = (growth ?? 0) >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-xs transition-all hover:border-(--color-lavender)/40 hover:shadow-md">
            {/* خلفية زخرفية */}
            <div
                className={`absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10 ${color}`}
            />

            <div className="relative flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${color}`}>
                    <Icon size={20} />
                </div>

                {growth !== undefined && !loading && (
                    <div
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${isPositive
                            ? "bg-(--color-mint)/10 text-(--color-mint)"
                            : "bg-(--color-error)/10 text-(--color-error)"
                            }`}
                    >
                        <TrendIcon size={12} />
                        {isPositive ? "+" : ""}
                        {growth}%
                    </div>
                )}
            </div>

            <div className="relative mt-3 flex flex-col">
                <span className="text-xs text-(--text-muted)">{title}</span>
                {loading ? (
                    <div className="mt-1 h-7 w-24 animate-pulse rounded bg-(--bg-hover)" />
                ) : (
                    <span className="mt-1 text-2xl font-bold text-(--text-primary)">
                        {prefix}
                        {typeof value === "number"
                            ? value.toLocaleString()
                            : value}
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================
// صف Top
// ============================================
function TopRow({ index, name, primary, secondary, color, badge }) {
    return (
        <div className="flex items-center justify-between border-b border-(--bg-border) py-2.5 last:border-b-0">
            <div className="flex items-center gap-3">
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ background: color }}
                >
                    {index + 1}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-(--text-primary)">
                        {name}
                    </span>
                    {badge && (
                        <span className="text-xs text-(--text-muted)">
                            {badge}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-(--text-primary)">
                    {primary}
                </span>
                {secondary && (
                    <span className="text-xs text-(--text-muted)">
                        {secondary}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function Reports() {
    const { t, i18n } = useTranslation();
    const darkMode = useSelector(TemplateDarkMode);
    const isDark = darkMode === "dark" || darkMode === true;
    const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
    // داخل Reports()
    const [aiModalOpen, setAiModalOpen] = useState(false);

    const [range, setRange] = useState("30d");
    const [refreshKey, setRefreshKey] = useState(0);

    // ✅ States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [dailyData, setDailyData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [topClients, setTopClients] = useState([]);
    const [salesByCategory, setSalesByCategory] = useState([]);
    const [salesByCountry, setSalesByCountry] = useState([]);
    const [paymentsBreakdown, setPaymentsBreakdown] = useState([]);
    const [ordersByStatus, setOrdersByStatus] = useState([]);

    const [kpis, setKpis] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalVisitors: 0,
        totalRefunds: 0,
        avgOrder: 0,
        conversion: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        visitorsGrowth: 0,
        conversionGrowth: 0,
    });

    // ✅ النطاق بالأيام
    const days = useMemo(
        () => DATE_RANGES.find((r) => r.key === range)?.days || 30,
        [range]
    );

    // ============================================
    // جلب البيانات
    // ============================================
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [
                dailyRes,
                topProductsRes,
                topClientsRes,
                categoriesRes,
                countriesRes,
                paymentsRes,
                statusRes,
                kpisRes,
            ] = await Promise.all([
                reportsService.getDailySales(days),
                reportsService.getTopProducts(5),
                reportsService.getTopClients(5),
                reportsService.getSalesByCategory(),
                reportsService.getSalesByCountry(5),
                reportsService.getPaymentsBreakdown(),
                reportsService.getOrdersByStatus(),
                reportsService.getKPIs(days),
            ]);

            setDailyData(dailyRes || []);
            setTopProducts(topProductsRes || []);
            setTopClients(topClientsRes || []);
            setSalesByCategory(categoriesRes || []);
            setSalesByCountry(countriesRes || []);
            setPaymentsBreakdown(paymentsRes || []);
            setOrdersByStatus(statusRes || []);

            // ✅ KPIs
            setKpis({
                totalRevenue: kpisRes?.totalRevenue || 0,
                totalOrders: kpisRes?.totalOrders || 0,
                totalVisitors: 0,
                totalRefunds: 0,
                avgOrder: kpisRes?.avgOrder || 0,
                conversion: 0,
                revenueGrowth: kpisRes?.growth || 0,
                ordersGrowth: 0,
                visitorsGrowth: 0,
                conversionGrowth: 0,
            });
        } catch (err) {
            console.error("Reports load error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        loadData();
    }, [loadData, refreshKey]);

    // ============================================
    // تصدير CSV
    // ============================================
    const exportCSV = () => {
        if (dailyData.length === 0) {
            alert(t("reports.noDataToExport"));
            return;
        }

        const headers = ["Date", "Orders", "Revenue"];
        const rows = dailyData.map((d) =>
            [d.label, d.orders || 0, d.revenue].join(",")
        );
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${range}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const printReport = () => window.print();

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <BarChart3
                            size={22}
                            className="text-(--color-lavender)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("reports.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("reports.subtitle")}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                        <span>{t("reports.refresh")}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setAiModalOpen(true)}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-(--color-lavender) to-(--color-pink) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Sparkles size={14} />
                        <span>{t("reports.ai.button")}</span>
                    </button>

                    <button
                        type="button"
                        onClick={printReport}
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <Printer size={14} />
                        <span>{t("reports.print")}</span>
                    </button>

                    <button
                        type="button"
                        onClick={exportCSV}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Download size={14} />
                        <span>{t("reports.exportCsv")}</span>
                    </button>
                </div>
            </div>

            {/* خطأ */}
            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                    <AlertCircle
                        size={18}
                        className="shrink-0 text-(--color-error)"
                    />
                    <span className="text-(--text-primary)">{error}</span>
                </div>
            )}

            {/* فلتر النطاق */}
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                <div className="flex items-center gap-2 px-2 text-(--text-muted)">
                    <Calendar size={15} />
                    <span className="text-xs font-medium">
                        {t("reports.rangeLabel")}
                    </span>
                </div>
                {DATE_RANGES.map((r) => (
                    <button
                        key={r.key}
                        type="button"
                        onClick={() => setRange(r.key)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${range === r.key
                            ? "bg-(--color-lavender) text-white shadow-sm"
                            : "text-(--text-secondary) hover:bg-(--bg-hover)"
                            }`}
                    >
                        {t(`reports.ranges.${r.key}`)}
                    </button>
                ))}
            </div>

            {/* KPIs */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title={t("reports.kpis.totalRevenue")}
                    value={kpis.totalRevenue}
                    suffix=" ₪"
                    growth={kpis.revenueGrowth}
                    icon={DollarSign}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                    loading={loading}
                />
                <KPICard
                    title={t("reports.kpis.totalOrders")}
                    value={kpis.totalOrders}
                    growth={kpis.ordersGrowth}
                    icon={ShoppingCart}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                    loading={loading}
                />
                <KPICard
                    title={t("reports.kpis.avgOrder")}
                    value={kpis.avgOrder}
                    suffix=" ₪"
                    icon={Percent}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                    loading={loading}
                />
                <KPICard
                    title={t("reports.kpis.productsCount")}
                    value={topProducts.length}
                    icon={Package}
                    color="text-(--color-pink) bg-(--color-pink)/10"
                    loading={loading}
                />
            </div>

            {/* الرسم الرئيسي */}
            <div className="mb-4 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <LineChart
                        data={dailyData}
                        isDark={isDark}
                        title={t("reports.charts.dailyRevenue")}
                        subtitle={t("reports.charts.lastNDays", {
                            days,
                        })}
                        height={320}
                    />
                </div>

                <DonutChart
                    data={salesByCategory}
                    isDark={isDark}
                    title={t("reports.charts.salesByCategory")}
                    subtitle={t(
                        "reports.charts.salesByCategorySubtitle"
                    )}
                    height={320}
                />
            </div>

            {/* BarChart + Donut */}
            <div className="mb-4 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <BarChart
                        data={ordersByStatus}
                        isDark={isDark}
                        title={t("reports.charts.ordersByStatus")}
                        subtitle={t(
                            "reports.charts.ordersByStatusSubtitle"
                        )}
                        height={320}
                    />
                </div>

                <DonutChart
                    data={paymentsBreakdown}
                    isDark={isDark}
                    title={t("reports.charts.paymentsBreakdown")}
                    subtitle={t(
                        "reports.charts.paymentsBreakdownSubtitle"
                    )}
                    height={320}
                    totalLabel={t(
                        "reports.charts.paymentsTotalLabel"
                    )}
                    valueSuffix=""
                />
            </div>

            {/* Top Products + Top Clients */}
            <div className="mb-4 grid gap-4 lg:grid-cols-2">
                {/* Top Products */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-xs">
                    <div className="mb-3 flex items-center gap-2">
                        <Package
                            size={18}
                            className="text-(--color-mint)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("reports.topProducts.title")}
                        </h2>
                    </div>
                    <div className="flex flex-col">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="my-2 h-12 animate-pulse rounded-lg bg-(--bg-hover)"
                                />
                            ))
                        ) : topProducts.length > 0 ? (
                            topProducts.map((p, i) => (
                                <TopRow
                                    key={p.id}
                                    index={i}
                                    name={p.label}
                                    primary={`${Number(
                                        p.value
                                    ).toLocaleString(locale)} ₪`}
                                    secondary={t(
                                        "reports.topProducts.sold",
                                        { count: p.sold || 0 }
                                    )}
                                    color={p.color}
                                />
                            ))
                        ) : (
                            <p className="py-6 text-center text-sm text-(--text-muted)">
                                {t("reports.noData")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Top Clients */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-xs">
                    <div className="mb-3 flex items-center gap-2">
                        <Crown
                            size={18}
                            className="text-(--color-amber)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("reports.topClients.title")}
                        </h2>
                    </div>
                    <div className="flex flex-col">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="my-2 h-12 animate-pulse rounded-lg bg-(--bg-hover)"
                                />
                            ))
                        ) : topClients.length > 0 ? (
                            topClients.map((c, i) => (
                                <TopRow
                                    key={c.id}
                                    index={i}
                                    name={c.name}
                                    primary={`${Number(
                                        c.total
                                    ).toLocaleString(locale)} ₪`}
                                    secondary={t(
                                        "reports.topClients.orders",
                                        { count: c.orders || 0 }
                                    )}
                                    color={c.color}
                                />
                            ))
                        ) : (
                            <p className="py-6 text-center text-sm text-(--text-muted)">
                                {t("reports.noData")}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sales by Country */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-xs">
                    <div className="mb-3 flex items-center gap-2">
                        <Globe
                            size={18}
                            className="text-(--color-lavender)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("reports.salesByCountry.title")}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-8 animate-pulse rounded-lg bg-(--bg-hover)"
                                />
                            ))
                        ) : salesByCountry.length > 0 ? (
                            salesByCountry.map((s) => {
                                const max =
                                    salesByCountry[0]?.value || 1;
                                const pct = (s.value / max) * 100;
                                return (
                                    <div key={s.id}>
                                        <div className="mb-1 flex items-center justify-between text-xs">
                                            <span className="font-medium text-(--text-primary)">
                                                {s.label}
                                            </span>
                                            <span className="text-(--text-muted)">
                                                {Number(
                                                    s.value
                                                ).toLocaleString(
                                                    locale
                                                )}{" "}
                                                ₪
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-(--bg-hover)">
                                            <div
                                                className="h-full rounded-full bg-(--color-lavender) transition-all"
                                                style={{
                                                    width: `${pct}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="py-6 text-center text-sm text-(--text-muted)">
                                {t("reports.noData")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Orders by Status (Line) */}
                <LineChart
                    data={dailyData.map((d) => ({
                        label: d.label,
                        value: d.value,
                    }))}
                    isDark={isDark}
                    title={t("reports.charts.dailyRevenue")}
                    subtitle={t(
                        "reports.charts.dailyRevenueSubtitle"
                    )}
                    height={300}
                />
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-(--bg-border) pt-4 text-xs text-(--text-muted)">
                <div className="flex items-center gap-2">
                    <FileText size={12} />
                    <span>
                        {t("reports.footer.autoGenerated")} •{" "}
                        {new Date().toLocaleString(locale)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <CreditCard size={12} />
                    <span>
                        {t("reports.footer.recordsCount", {
                            count: dailyData.length,
                        })}
                    </span>
                </div>
            </div>
            <AIReportModal
                open={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
            />
        </>
    );
}