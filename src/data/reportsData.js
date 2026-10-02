import { CHART_COLORS, CLIENTS, PRODUCTS, ADDRESSES } from "./dashboardData";

// ============================================
// نطاقات زمنية جاهزة
// ============================================
export const DATE_RANGES = [
    { key: "7d", label: "آخر 7 أيام", days: 7 },
    { key: "30d", label: "آخر 30 يوم", days: 30 },
    { key: "90d", label: "آخر 3 شهور", days: 90 },
    { key: "6m", label: "آخر 6 شهور", days: 180 },
    { key: "1y", label: "آخر سنة", days: 365 },
];

// ============================================
// توليد بيانات التقارير
// ============================================
export function generateReportData(days = 30) {
    const daily = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);

        const orders = Math.floor(Math.random() * 40) + 10;
        const revenue = Math.round(orders * (Math.random() * 200 + 80));
        const visitors = Math.floor(Math.random() * 800) + 200;
        const conversion = +((orders / visitors) * 100).toFixed(2);

        daily.push({
            label: d.toLocaleDateString("ar-EG", {
                day: "2-digit",
                month: "2-digit",
            }),
            date: d.toISOString().slice(0, 10),
            orders,
            revenue,
            visitors,
            conversion,
            refunds: Math.floor(Math.random() * 3),
        });
    }

    return daily;
}

// ============================================
// KPIs محسوبة
// ============================================
export function calculateKPIs(data) {
    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = data.reduce((s, d) => s + d.orders, 0);
    const totalVisitors = data.reduce((s, d) => s + d.visitors, 0);
    const totalRefunds = data.reduce((s, d) => s + d.refunds, 0);
    const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
    const conversion = totalVisitors
        ? (totalOrders / totalVisitors) * 100
        : 0;

    // ✅ مقارنة مع النصف السابق
    const half = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, half);
    const secondHalf = data.slice(half);

    const revenueGrowth = growth(firstHalf, secondHalf, "revenue");
    const ordersGrowth = growth(firstHalf, secondHalf, "orders");
    const visitorsGrowth = growth(firstHalf, secondHalf, "visitors");
    const conversionGrowth = growth(firstHalf, secondHalf, "conversion");

    return {
        totalRevenue,
        totalOrders,
        totalVisitors,
        totalRefunds,
        avgOrder: Math.round(avgOrder),
        conversion: +conversion.toFixed(2),
        revenueGrowth,
        ordersGrowth,
        visitorsGrowth,
        conversionGrowth,
    };
}

function growth(a, b, key) {
    const sumA = a.reduce((s, x) => s + x[key], 0);
    const sumB = b.reduce((s, x) => s + x[key], 0);
    if (!sumA) return 0;
    return +(((sumB - sumA) / sumA) * 100).toFixed(1);
}

// ============================================
// أفضل المنتجات (Top N)
// ============================================
export function getTopProducts(count = 5) {
    return PRODUCTS.slice(0, count).map((name, i) => {
        const sold = Math.floor(Math.random() * 400) + 50;
        const revenue = sold * (Math.random() * 800 + 200);
        return {
            id: i,
            name,
            sold,
            revenue: Math.round(revenue),
            color: CHART_COLORS[i % CHART_COLORS.length],
        };
    }).sort((a, b) => b.revenue - a.revenue);
}

// ============================================
// أفضل العملاء
// ============================================
export function getTopClients(count = 5) {
    return CLIENTS.slice(0, count).map((name, i) => {
        const orders = Math.floor(Math.random() * 30) + 5;
        const spent = Math.round(orders * (Math.random() * 300 + 150));
        return {
            id: i,
            name,
            orders,
            spent,
            color: CHART_COLORS[i % CHART_COLORS.length],
        };
    }).sort((a, b) => b.spent - a.spent);
}

// ============================================
// المبيعات حسب الفئة
// ============================================
export function getSalesByCategory() {
    const categories = [
        "إلكترونيات",
        "كمبيوتر",
        "ملحقات",
        "صوتيات",
        "شبكات",
        "تصوير",
    ];

    return categories.map((label, i) => ({
        id: i,
        label,
        value: Math.floor(Math.random() * 50000) + 10000,
        color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

// ============================================
// المبيعات حسب الدولة
// ============================================
export function getSalesByCountry() {
    const grouped = ADDRESSES.reduce((acc, addr) => {
        const country = addr.split("-")[0];
        acc[country] = (acc[country] || 0) + Math.floor(Math.random() * 30000 + 5000);
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([label, value], i) => ({
            id: i,
            label,
            value,
            color: CHART_COLORS[i % CHART_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
}

// ============================================
// طرق الدفع
// ============================================
export function getPaymentsBreakdown() {
    const methods = [
        "بطاقة ائتمانية",
        "PayPal",
        "تحويل بنكي",
        "الدفع عند الاستلام",
        "محفظة إلكترونية",
    ];
    return methods.map((label, i) => ({
        id: i,
        label,
        value: Math.floor(Math.random() * 400) + 50,
        color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

// ============================================
// مقارنة سنوية (شهر/شهر)
// ============================================
export function getYearlyComparison() {
    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ];

    return months.map((label) => ({
        label,
        value: Math.floor(Math.random() * 50000) + 10000,
    }));
}