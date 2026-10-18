import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

// ============================================
// ألوان الحالات
// ============================================
const STATUS_COLORS = {
    pending: "#F59E0B",      // amber
    processing: "#6366F1",   // lavender
    shipped: "#3B82F6",      // blue
    delivered: "#10B981",    // mint
    cancelled: "#EF4444",    // error
    refunded: "#EC4899",     // pink
    none: "#6B7280",         // gray
};

const STATUS_GRADIENTS = {
    pending: ["#F59E0B", "#FBBF24"],
    processing: ["#6366F1", "#8B5CF6"],
    shipped: ["#3B82F6", "#06B6D4"],
    delivered: ["#10B981", "#34D399"],
    cancelled: ["#EF4444", "#F87171"],
    refunded: ["#EC4899", "#F472B6"],
    none: ["#6B7280", "#9CA3AF"],
};

// ============================================
// Story Avatar
// ============================================
function StoryAvatar({ client, onClick }) {
    const status = client.status || "none";
    const gradient = STATUS_GRADIENTS[status] || STATUS_GRADIENTS.none;

    const initial =
        (client.name || client.first_name || "?")[0].toUpperCase();

    return (
        <button
            type="button"
            onClick={() => onClick(client)}
            className="flex shrink-0 flex-col items-center gap-2 transition-transform hover:scale-105 focus:outline-none mt-3 ms-2"
        >
            {/* Avatar مع Border متدرج */}
            <div className="relative">
                {/* Border متدرج */}
                <div
                    className="flex h-[68px] w-[68px] items-center justify-center rounded-full p-[3px]"
                    style={{
                        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                    }}
                >
                    {/* Avatar داخلي */}
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-(--bg-card) bg-(--bg-elevated)">
                        {client.avatar_url ? (
                            <img
                                src={client.avatar_url}
                                alt={client.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xl font-bold text-(--text-primary)">
                                {initial}
                            </span>
                        )}
                    </div>
                </div>

                {/* نقطة حالة صغيرة */}
                <div
                    className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-[2.5px] border-(--bg-card)"
                    style={{ background: STATUS_COLORS[status] }}
                />
            </div>

            {/* الاسم */}
            <span className="max-w-[72px] truncate text-center text-xs font-medium text-(--text-secondary)">
                {client.name || client.first_name || "—"}
            </span>
        </button>
    );
}

// ============================================
// ClientsStories
// ============================================
export default function ClientsStories({ clients = [], loading = false }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleClick = (client) => {
        navigate(`/clients/${client.id}`);
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
                            <div className="h-[68px] w-[68px] animate-pulse rounded-full bg-(--bg-hover)" />
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
    if (!clients || clients.length === 0) {
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
                    <User size={16} className="text-(--color-lavender)" />
                    <h3 className="text-sm font-bold text-(--text-primary)">
                        {t("home.clientsStories.title")}
                    </h3>
                    <span className="rounded-full bg-(--bg-hover) px-2 py-0.5 text-[10px] text-(--text-muted)">
                        {clients.length}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/clients")}
                    className="text-xs text-(--color-lavender) hover:underline"
                >
                    {t("home.clientsStories.viewAll")}
                </button>
            </div>

            {/* Stories */}
            <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
                {clients.map((client) => (
                    <StoryAvatar
                        key={client.id}
                        client={client}
                        onClick={handleClick}
                    />
                ))}
            </div>
        </div>
    );
}