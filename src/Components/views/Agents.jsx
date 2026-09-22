import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Bot,
    Plus,
    Settings2,
    Trash2,
    Power,
    PowerOff,
    Puzzle,
    Thermometer,
    Loader2,
    RefreshCw,
    AlertCircle,
    Eye,
} from "lucide-react";
import * as agentsService from "../../Services/agentsService";
import { AVAILABLE_TOOLS } from "../../data/agentsData";
import { supabase } from "../../lib/supabase";

// ============================================
// ألوان افتراضية
// ============================================
const COLORS = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F43F5E",
    "#F59E0B",
    "#10B981",
];

// ============================================
// الصفحة
// ============================================
export default function Agents() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // ============================================
    // جلب الوكلاء
    // ============================================
    const loadAgents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await agentsService.getAll();
            setAgents(data || []);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAgents();
    }, [loadAgents, refreshKey]);

    // ✅ Realtime
    useEffect(() => {
        const channel = supabase
            .channel("agents_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "agents" },
                () => setRefreshKey((k) => k + 1)
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // ============================================
    // تفعيل/تعطيل
    // ============================================
    const toggleStatus = async (agent) => {
        try {
            await agentsService.toggleActive(agent.id, !agent.is_active);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("agents.toggleFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // حذف
    // ============================================
    const handleDelete = async (agent) => {
        if (!confirm(t("agents.confirmDelete", { name: agent.name })))
            return;
        try {
            await agentsService.remove(agent.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("agents.deleteFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // اسم الأداة
    // ============================================
    const getToolName = useCallback(
        (toolId) => {
            const tool = AVAILABLE_TOOLS.find((t) => t.id === toolId);
            return tool ? tool.name : toolId;
        },
        []
    );

    // ============================================
    // Loading
    // ============================================
    if (loading && agents.length === 0) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("agents.loading")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* رأس الصفحة */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2.5">
                        <Bot
                            size={24}
                            className="text-(--color-lavender)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("agents.title")}
                        </h1>
                        <p className="mt-1 text-sm text-(--text-muted)">
                            {t("agents.subtitle")}
                        </p>
                    </div>
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
                        <span>{t("agents.refresh")}</span>
                    </button>

                    <button
                        onClick={() => navigate("/agents/new")}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus size={16} />
                        {t("agents.newAgent")}
                    </button>
                </div>
            </div>

            {/* خطأ */}
            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                    <AlertCircle
                        size={18}
                        className="shrink-0 text-(--color-error)"
                    />
                    <span className="text-(--text-primary)">{error}</span>
                </div>
            )}

            {/* فارغ */}
            {!loading && agents.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-(--bg-border) bg-(--bg-card) py-16">
                    <Bot size={48} className="text-(--text-muted)" />
                    <div className="text-center">
                        <h3 className="font-bold text-(--text-primary)">
                            {t("agents.empty.title")}
                        </h3>
                        <p className="mt-1 text-sm text-(--text-muted)">
                            {t("agents.empty.subtitle")}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/agents/new")}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white"
                    >
                        <Plus size={16} />
                        {t("agents.addAgent")}
                    </button>
                </div>
            )}

            {/* شبكة الوكلاء */}
            {agents.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent, i) => (
                        <div
                            key={agent.id}
                            className={`group relative flex flex-col rounded-2xl border border-(--bg-border) bg-(--bg-card) p-4 shadow-xs transition-all hover:shadow-md ${
                                !agent.is_active && "opacity-70"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
                                        style={{
                                            background:
                                                agent.color ||
                                                COLORS[i % COLORS.length],
                                        }}
                                    >
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-(--text-primary)">
                                            {agent.name}
                                        </h3>
                                        <span className="text-xs text-(--text-muted)">
                                            {agent.model}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        agent.is_active
                                            ? "bg-(--color-mint)/10 text-(--color-mint)"
                                            : "bg-(--text-muted)/10 text-(--text-muted)"
                                    }`}
                                >
                                    {agent.is_active
                                        ? t("agents.status.active")
                                        : t("agents.status.inactive")}
                                </div>
                            </div>

                            <p className="mt-3 line-clamp-2 text-xs text-(--text-muted)">
                                {agent.description ||
                                    t("agents.form.noDescription")}
                            </p>

                            {/* الأدوات */}
                            <div className="mt-3 flex flex-wrap gap-1">
                                {(agent.tools || []).map((tool) => (
                                    <span
                                        key={tool}
                                        className="inline-flex items-center gap-1 rounded-full bg-(--bg-hover) px-2 py-0.5 text-[10px] text-(--text-secondary)"
                                    >
                                        <Puzzle size={10} />{" "}
                                        {getToolName(tool)}
                                    </span>
                                ))}
                            </div>

                            {/* الإجراءات */}
                            <div className="mt-4 flex items-center justify-between border-t border-(--bg-border) pt-3">
                                <div className="flex items-center gap-1 text-xs text-(--text-muted)">
                                    <Thermometer size={12} />
                                    <span>{agent.temperature}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() =>
                                            navigate(`/agents/${agent.id}`)
                                        }
                                        className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                        title={t("agents.actions.view")}
                                    >
                                        <Eye size={14} />
                                    </button>
                                    <button
                                        onClick={() =>
                                            toggleStatus(agent)
                                        }
                                        className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                        title={
                                            agent.is_active
                                                ? t("agents.actions.deactivate")
                                                : t("agents.actions.activate")
                                        }
                                    >
                                        {agent.is_active ? (
                                            <PowerOff size={14} />
                                        ) : (
                                            <Power size={14} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/agents/${agent.id}/edit`
                                            )
                                        }
                                        className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                                        title={t("agents.actions.edit")}
                                    >
                                        <Settings2 size={14} />
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDelete(agent)
                                        }
                                        className="rounded-full p-1.5 text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--color-error)"
                                        title={t("agents.actions.delete")}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}