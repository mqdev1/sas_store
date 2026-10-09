import { CHART_COLORS } from "./dashboardData";

export const CATEGORIES = [
    "إلكترونيات",
    "كمبيوتر",
    "ملحقات",
    "صوتيات",
    "شبكات",
    "تصوير",
];

export const BASE_PRODUCTS = [
    { name: "لابتوب", category: "كمبيوتر", price: 2500, stock: 45 },
    { name: "موبايل", category: "إلكترونيات", price: 1800, stock: 120 },
    { name: "تابلت", category: "إلكترونيات", price: 1200, stock: 60 },
    { name: "سماعات", category: "صوتيات", price: 350, stock: 200 },
    { name: "شاشة", category: "كمبيوتر", price: 900, stock: 35 },
    { name: "كيبورد", category: "ملحقات", price: 150, stock: 300 },
    { name: "ماوس", category: "ملحقات", price: 80, stock: 500 },
    { name: "كاميرا", category: "تصوير", price: 1400, stock: 25 },
    { name: "طابعة", category: "ملحقات", price: 700, stock: 40 },
    { name: "راوتر", category: "شبكات", price: 250, stock: 90 },
    { name: "ساعة ذكية", category: "إلكترونيات", price: 600, stock: 75 },
    { name: "باور بانك", category: "ملحقات", price: 120, stock: 220 },
    { name: "شاحن", category: "ملحقات", price: 60, stock: 400 },
    { name: "هارد", category: "كمبيوتر", price: 400, stock: 55 },
    { name: "فلاشة", category: "ملحقات", price: 45, stock: 600 },
];

// صور افتراضية (placeholders)
const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&q=80",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
];

export function generateProducts() {
    return BASE_PRODUCTS.map((p, i) => {
        const sold = Math.floor(Math.random() * 500) + 10;
        const revenue = sold * p.price;

        return {
            id: i + 1,
            sku: `SKU-${String(i + 1).padStart(4, "0")}`,
            name: p.name,
            category: p.category,
            price: p.price,
            stock: p.stock,
            sold,
            revenue,
            rating: (Math.random() * 2 + 3).toFixed(1),
            status: p.stock === 0 ? "نفد" : p.stock < 30 ? "منخفض" : "متوفر",
            color: CHART_COLORS[i % CHART_COLORS.length],
            images: [DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]],
            description:
                "منتج عالي الجودة، مناسب للاستخدام اليومي. يتميز بالأداء الممتاز والسعر المناسب.",
            created_at: new Date(
                2024,
                Math.floor(Math.random() * 12),
                Math.floor(Math.random() * 28) + 1
            )
                .toISOString()
                .slice(0, 10),
        };
    });
}

export function getProductsStats(products) {
    const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
    const totalSold = products.reduce((s, p) => s + p.sold, 0);
    const lowStock = products.filter((p) => p.stock < 30).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    return {
        count: products.length,
        totalRevenue: Math.round(totalRevenue),
        totalSold,
        lowStock,
        outOfStock,
    };
}

export function getStockColor(stock) {
    if (stock === 0) return "text-(--color-error) bg-(--color-error)/10";
    if (stock < 30) return "text-(--color-amber) bg-(--color-amber)/10";
    return "text-(--color-mint) bg-(--color-mint)/10";
}