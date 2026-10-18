// ============================================
// بيانات ثابتة (قوائم)
// ============================================
export const CLIENTS = [
    "Mahmoud", "Ayman", "Ahmed", "Sara", "Omar", "Layla",
    "Yousef", "Huda", "Khaled", "Nour", "Rami", "Dina",
    "Ali", "Mona", "Tariq", "Reem",
];

export const ADDRESSES = [
    "Palestine-Gaza", "Nezerland", "Palestine-Ramallah",
    "Egypt-Cairo", "Jordan-Amman", "USA-New York",
    "Turkey-Istanbul", "Germany-Berlin", "France-Paris",
    "Spain-Madrid", "UAE-Dubai", "Saudi-Riyadh",
];

export const PRODUCTS = [
    "لابتوب", "موبايل", "تابلت", "سماعات", "شاشة",
    "كيبورد", "ماوس", "كاميرا", "طابعة", "راوتر",
    "ساعة ذكية", "باور بانك", "شاحن", "هارد", "فلاشة",
];

export const CHART_COLORS = [
    "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#F59E0B",
    "#10B981", "#14B8A6", "#06B6D4", "#3B82F6", "#A855F7",
];

// ============================================
// Helper functions
// ============================================
const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (startYear = 1990, endYear = 2024) => {
    const day = randomInt(1, 28);
    const month = randomInt(1, 12);
    const year = randomInt(startYear, endYear);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(day)}-${pad(month)}-${pad(year)}`;
};

const randomTotal = () =>
    Math.round((Math.random() * 4950 + 50) * 10) / 10;

// ============================================
// توليد الطلبات
// ============================================
export function generateOrders(count = 1000) {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        client: CLIENTS[randomInt(0, CLIENTS.length - 1)],
        product: PRODUCTS[randomInt(0, PRODUCTS.length - 1)],
        order_date: randomDate(),
        address: ADDRESSES[randomInt(0, ADDRESSES.length - 1)],
        total: randomTotal(),
    }));
}

// ============================================
// استخراج أعلى N منتجات مبيعًا
// ============================================
export function getTopProducts(orders, limit = 5) {
    const grouped = orders.reduce((acc, order) => {
        acc[order.product] = (acc[order.product] || 0) + order.total;
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([label, value]) => ({ label, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)
        .map((item, id) => ({
            id,
            label: item.label,
            value: item.value,
            color: CHART_COLORS[id % CHART_COLORS.length],
        }));
}

// ============================================
// إحصائيات سريعة
// ============================================
export function getDashboardStats(orders) {
    const uniqueClients = new Set(orders.map((d) => d.client)).size;
    const uniqueProducts = new Set(orders.map((d) => d.product)).size;
    const cancelled = orders.filter((d) => d.total === 0).length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrder = totalRevenue / orders.length;

    return {
        clients: uniqueClients,
        products: uniqueProducts,
        orders: orders.length,
        cancelled,
        totalRevenue: Math.round(totalRevenue),
        avgOrder: Math.round(avgOrder),
    };
}

// ============================================
// مبيعات آخر 6 شهور (لـ LineChart)
// ============================================
export function getMonthlySales(orders) {
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];
    const buckets = months.map((label) => ({ label, value: 0 }));

    orders.forEach((o) => {
        // استخرج الشهر من order_date (DD-MM-YYYY)
        const parts = o.order_date.split("-");
        const month = parseInt(parts[1], 10); // 1-12
        const idx = (month - 1) % 6; // نوزّع على 6 شهور
        buckets[idx].value += o.total;
    });

    return buckets.map((b) => ({
        label: b.label,
        value: Math.round(b.value),
    }));
}

// ============================================
// أعلى 5 مدن (لـ BarChart)
// ============================================
export function getSalesByAddress(orders, limit = 5) {
    const grouped = orders.reduce((acc, order) => {
        const city = order.address.split("-").pop();
        acc[city] = (acc[city] || 0) + order.total;
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([label, value]) => ({ label, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)
        .map((item, id) => ({
            id,
            label: item.label,
            value: item.value,
            color: CHART_COLORS[id % CHART_COLORS.length],
        }));
}

// ============================================
// حالات الطلبات (لـ RadialBar)
// ============================================
export function getOrdersByStatus(orders) {
    const completed = orders.filter((o) => o.total > 1000).length;
    const pending = orders.filter(
        (o) => o.total > 100 && o.total <= 1000
    ).length;
    const cancelled = orders.filter((o) => o.total <= 100).length;

    const total = orders.length || 1;

    return [
        {
            label: "مكتملة",
            value: Math.round((completed / total) * 100),
            color: "#10B981",
        },
        {
            label: "قيد المعالجة",
            value: Math.round((pending / total) * 100),
            color: "#F59E0B",
        },
        {
            label: "ملغية",
            value: Math.round((cancelled / total) * 100),
            color: "#EF4444",
        },
    ];
}

// ============================================
// آخر 5 طلبات (للنشاطات)
// ============================================
export function getRecentOrders(orders, limit = 5) {
    return [...orders]
        .sort((a, b) => b.id - a.id)
        .slice(0, limit);
}

// ============================================
// أعلى 5 عملاء (للـ List)
// ============================================
export function getTopClients(orders, limit = 5) {
    const grouped = orders.reduce((acc, order) => {
        acc[order.client] = (acc[order.client] || 0) + order.total;
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([name, total]) => ({ name, total: Math.round(total) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit)
        .map((item, id) => ({
            ...item,
            id,
            color: CHART_COLORS[id % CHART_COLORS.length],
        }));
}