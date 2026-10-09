import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

// ============================================
// إعدادات الحالات
// ============================================
const STATUS_CONFIG = {
    pending: {
        percent: 25,
        color: "#F59E0B", // amber
        labelKey: "pending",
    },
    processing: {
        percent: 50,
        color: "#6366F1", // lavender
        labelKey: "processing",
    },
    shipped: {
        percent: 75,
        color: "#3B82F6", // blue
        labelKey: "shipped",
    },
    delivered: {
        percent: 100,
        color: "#10B981", // mint
        labelKey: "delivered",
    },
    cancelled: {
        percent: 100,
        color: "#EF4444", // error
        labelKey: "cancelled",
    },
    refunded: {
        percent: 100,
        color: "#EC4899", // pink
        labelKey: "refunded",
    },
};

// ============================================
// حلقة SVG حسب النسبة
// ============================================
function ProgressRing({ percent = 0, color = "#6366F1", size = 72, stroke = 3 }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <svg
            width={size}
            height={size}
            className="absolute inset-0 -rotate-90"
            style={{ transform: "rotate(-90deg)" }}
        >
            {/* الخلفية */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--bg-border)"
                strokeWidth={stroke}
            />
            {/* الحلقة */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                    transition: "stroke-dashoffset 0.5s ease",
                }}
            />
        </svg>
    );
}

// ============================================
// Order Story
// ============================================
function OrderStory({ order, onClick }) {
    const { t } = useTranslation();
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

    const clientName = order.client_name || "—";
    const initial = clientName[0]?.toUpperCase() || "?";

    return (
        <button
            type="button"
            onClick={() => onClick(order)}
            className="flex shrink-0 flex-col items-center gap-2 transition-transform hover:scale-105 focus:outline-none mt-3 ms-2"
        >
            {/* Avatar + Ring */}
            <div className="relative h-[72px] w-[72px]">
                {/* الحلقة */}
                <ProgressRing
                    percent={config.percent}
                    color={config.color}
                    size={72}
                    stroke={3}
                />

                {/* Avatar داخلي */}
                <div className="absolute inset-[6px] flex items-center justify-center overflow-hidden rounded-full bg-(--bg-elevated) border-2 border-(--bg-card)">
                    {order.client_avatar ? (
                        <img
                            src={order.client_avatar}
                            alt={clientName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-lg font-bold text-(--text-primary)">
                            {initial}
                        </span>
                    )}
                </div>

                {/* نقطة الحالة */}
                <div
                    className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-[2.5px] border-(--bg-card)"
                    style={{ background: config.color }}
                    title={t(`orders.status.${config.labelKey}`)}
                />
            </div>

            {/* الاسم */}
            <span className="max-w-[76px] truncate text-center text-xs font-medium text-(--text-secondary)">
                {clientName}
            </span>
        </button>
    );
}

// ============================================
// RecentOrdersStories
// ============================================
export default function RecentOrdersStories({
    orders = [],
    loading = false,
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleClick = (order) => {
        navigate(`/orders/${order.id}`);
    };

    // ============================================
    // Loading
    // ============================================
    if (loading) {
        return (
            <div className="mb-4 rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                <div className="mb-3 flex items-center gap-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-(--bg-hover)" />
                </div>
                <div className="flex gap-3 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="flex shrink-0 flex-col items-center gap-2"
                        >
                            <div className="h-[72px] w-[72px] animate-pulse rounded-full bg-(--bg-hover)" />
                            <div className="h-3 w-12 animate-pulse rounded bg-(--bg-hover)" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ============================================
    // Empty
    // ============================================
    if (!orders || orders.length === 0) {
        return null;
    }

    // ============================================
    // Render
    // ============================================
    return (
        <div className="mb-4 rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
            {/* الرأس */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShoppingCart
                        size={16}
                        className="text-(--color-amber)"
                    />
                    <h3 className="text-sm font-bold text-(--text-primary)">
                        {t("home.recentOrdersStories.title")}
                    </h3>
                    <span className="rounded-full bg-(--bg-hover) px-2 py-0.5 text-[10px] text-(--text-muted)">
                        {orders.length}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/orders")}
                    className="text-xs text-(--color-lavender) hover:underline"
                >
                    {t("home.recentOrdersStories.viewAll")}
                </button>
            </div>

            {/* Stories */}
            <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
                {orders.map((order) => (
                    <OrderStory
                        key={order.id}
                        order={order}
                        onClick={handleClick}
                    />
                ))}
            </div>


        </div>
    );
}