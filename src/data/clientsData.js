import { CHART_COLORS, CLIENTS, ADDRESSES } from "./dashboardData";

// ============================================
// مدن لاستخراج الدولة
// ============================================
export const COUNTRIES = [
    "فلسطين",
    "هولندا",
    "مصر",
    "الأردن",
    "أمريكا",
    "تركيا",
    "ألمانيا",
    "فرنسا",
    "إسبانيا",
    "الإمارات",
    "السعودية",
];

// ============================================
// توليد عملاء
// ============================================
export function generateClients(count = 16) {
    return CLIENTS.slice(0, count).map((name, i) => {
        const orders = Math.floor(Math.random() * 40) + 1;
        const spent = Math.floor(Math.random() * 50000) + 1000;
        const address = ADDRESSES[i % ADDRESSES.length];
        const [country, city] = address.split("-");

        return {
            id: i + 1,
            name,
            email: `${name.toLowerCase()}@example.com`,
            phone: `+970-${Math.floor(Math.random() * 900000000 + 100000000)}`,
            address,
            city: city || "",
            country: country || "",
            orders,
            spent,
            avgOrder: Math.round(spent / orders),
            status: i % 7 === 0 ? "غير نشط" : "نشط",
            joined_at: new Date(
                2022 + Math.floor(Math.random() * 3),
                Math.floor(Math.random() * 12),
                Math.floor(Math.random() * 28) + 1
            )
                .toISOString()
                .slice(0, 10),
            color: CHART_COLORS[i % CHART_COLORS.length],
            avatar: null,
        };
    });
}

// ============================================
// إحصائيات العملاء
// ============================================
export function getClientsStats(clients) {
    const totalSpent = clients.reduce((s, c) => s + c.spent, 0);
    const active = clients.filter((c) => c.status === "نشط").length;
    const inactive = clients.length - active;

    return {
        count: clients.length,
        active,
        inactive,
        totalSpent: Math.round(totalSpent),
        avgSpent: clients.length
            ? Math.round(totalSpent / clients.length)
            : 0,
    };
}

// ============================================
// حالة العميل → لون
// ============================================
export function getClientStatusColor(status) {
    if (status === "نشط")
        return "text-(--color-mint) bg-(--color-mint)/10";
    return "text-(--text-muted) bg-(--bg-hover)";
}