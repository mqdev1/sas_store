import { CHART_COLORS, CLIENTS } from "./dashboardData";

// ============================================
// طرق الدفع
// ============================================
export const PAYMENT_METHODS = [
    "بطاقة ائتمانية",
    "بطاقة خصم",
    "PayPal",
    "تحويل بنكي",
    "الدفع عند الاستلام",
    "محفظة إلكترونية",
];

// ============================================
// حالات الدفع
// ============================================
export const PAYMENT_STATUSES = [
    "مكتمل",
    "معلّق",
    "فاشل",
    "مسترجع",
    "قيد المعالجة",
];

// ============================================
// العملات
// ============================================
export const CURRENCIES = ["₪", "$", "€", "£"];

// ============================================
// توليد المدفوعات
// ============================================
export function generatePayments(count = 80) {
    return Array.from({ length: count }, (_, i) => {
        const client = CLIENTS[i % CLIENTS.length];
        const method =
            PAYMENT_METHODS[
                Math.floor(Math.random() * PAYMENT_METHODS.length)
            ];
        const status =
            PAYMENT_STATUSES[
                Math.floor(Math.random() * PAYMENT_STATUSES.length)
            ];
        const amount = Math.round((Math.random() * 4900 + 100) * 100) / 100;
        const fee = Math.round(amount * 0.025 * 100) / 100;

        const createdAt = new Date(
            2024,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        );

        return {
            id: i + 1,
            transaction: `TXN-${String(i + 1).padStart(6, "0")}`,
            client,
            method,
            status,
            amount,
            fee,
            net: Math.round((amount - fee) * 100) / 100,
            currency: "₪",
            order_id: `ORD-${String((i % 60) + 1).padStart(4, "0")}`,
            reference:
                status === "مكتمل" || status === "مسترجع"
                    ? `REF-${Math.random()
                          .toString(36)
                          .slice(2, 10)
                          .toUpperCase()}`
                    : null,
            created_at: createdAt.toISOString().slice(0, 10),
            color: CHART_COLORS[i % CHART_COLORS.length],
        };
    });
}

// ============================================
// إحصائيات المدفوعات
// ============================================
export function getPaymentsStats(payments) {
    const total = payments.length;
    const completed = payments.filter((p) => p.status === "مكتمل").length;
    const pending = payments.filter((p) => p.status === "معلّق").length;
    const failed = payments.filter((p) => p.status === "فاشل").length;
    const refunded = payments.filter((p) => p.status === "مسترجع").length;

    const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
    const totalFees = payments.reduce((s, p) => s + p.fee, 0);
    const netRevenue = payments
        .filter((p) => p.status === "مكتمل")
        .reduce((s, p) => s + p.net, 0);

    return {
        total,
        completed,
        pending,
        failed,
        refunded,
        totalAmount: Math.round(totalAmount),
        totalFees: Math.round(totalFees),
        netRevenue: Math.round(netRevenue),
        successRate: total
            ? Math.round((completed / total) * 100)
            : 0,
    };
}

// ============================================
// حالة الدفع → لون
// ============================================
export function getPaymentStatusColor(status) {
    switch (status) {
        case "مكتمل":
            return "text-(--color-mint) bg-(--color-mint)/10";
        case "قيد المعالجة":
            return "text-(--color-lavender) bg-(--color-lavender)/10";
        case "معلّق":
            return "text-(--color-amber) bg-(--color-amber)/10";
        case "فاشل":
            return "text-(--color-error) bg-(--color-error)/10";
        case "مسترجع":
            return "text-(--color-pink) bg-(--color-pink)/10";
        default:
            return "text-(--text-muted) bg-(--bg-hover)";
    }
}

// ============================================
// توزيع الحالات (Donut)
// ============================================
export function getStatusDistribution(payments) {
    const grouped = payments.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(grouped).map(([label, value], i) => ({
        id: i,
        label,
        value,
        color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

// ============================================
// المدفوعات حسب الطريقة (Bar)
// ============================================
export function getPaymentsByMethod(payments) {
    const grouped = payments.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([label, value]) => ({ label, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .map((item, i) => ({
            ...item,
            color: CHART_COLORS[i % CHART_COLORS.length],
        }));
}

// ============================================
// الإيرادات الشهرية (Line)
// ============================================
export function getMonthlyRevenue(payments) {
    const months = [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
    ];

    const buckets = months.slice(0, 6).map((label) => ({
        label,
        value: 0,
    }));

    payments
        .filter((p) => p.status === "مكتمل")
        .forEach((p) => {
            const idx = Math.floor(Math.random() * 6);
            buckets[idx].value += p.amount;
        });

    return buckets.map((b) => ({
        label: b.label,
        value: Math.round(b.value),
    }));
}