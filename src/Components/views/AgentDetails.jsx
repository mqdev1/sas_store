import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    Bot,
    Edit,
    Trash2,
    Power,
    PowerOff,
    Puzzle,
    Thermometer,
    Cpu,
    MessageSquare,
    Send,
    Sparkles,
    Clock,
    CheckCircle2,
    AlertCircle,
    Settings2,
    Copy,
    Check,
    Loader2,
    User,
} from "lucide-react";
import { AVAILABLE_TOOLS } from "../../data/agentsData";
import * as agentsService from "../../Services/agentsService";

// ============================================
// بطاقة معلومة
// ============================================
function InfoCard({ icon: Icon, label, value, color }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-(--bg-border) bg-(--bg-card) p-3">
            <div className={`rounded-lg p-2 ${color}`}>
                <Icon size={18} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-(--text-muted)">{label}</span>
                <span className="text-sm font-bold text-(--text-primary)">
                    {value}
                </span>
            </div>
        </div>
    );
}

// ============================================
// دردشة مع الوكيل
// ============================================
function ChatDemo({ agent, isActive }) {
    const { t } = useTranslation();

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: t("agents.details.chat.welcome", {
                name: agent.name,
                description:
                    agent.description ||
                    t("agents.details.chat.welcomeDefault"),
            }),
        },
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages]);

    const send = async () => {
        if (!input.trim() || sending || !isActive) return;

        const userMsg = { role: "user", content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setSending(true);

        try {
            const result = await agentsService.run(agent.id, newMessages);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        result.content ||
                        t("agents.details.chat.noResponse"),
                },
            ]);
        } catch (err) {
            console.error("Chat error:", err);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: t("agents.details.chat.errorPrefix", {
                        error: err.message,
                    }),
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col rounded-xl border border-(--bg-border) bg-(--bg-card) shadow-xs">
            <div className="flex items-center justify-between border-b border-(--bg-border) p-3">
                <div className="flex items-center gap-2">
                    <MessageSquare
                        size={16}
                        className="text-(--color-lavender)"
                    />
                    <h2 className="text-base font-semibold text-(--text-primary)">
                        {t("agents.details.chat.title")}
                    </h2>
                </div>
                <span className="text-xs text-(--text-muted)">
                    {isActive
                        ? t("agents.details.chat.connected")
                        : t("agents.details.chat.disconnected")}
                </span>
            </div>

            <div
                ref={scrollRef}
                className="flex max-h-96 min-h-80 flex-col gap-3 overflow-y-auto p-4"
            >
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`flex gap-2 ${
                            m.role === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                    >
                        <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{
                                background:
                                    m.role === "user"
                                        ? "#64748b"
                                        : agent.color || "#6366F1",
                            }}
                        >
                            {m.role === "user" ? (
                                <User size={14} />
                            ) : (
                                agent.name.charAt(0)
                            )}
                        </div>
                        <div
                            className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                                m.role === "user"
                                    ? "bg-(--color-lavender) text-white"
                                    : "bg-(--bg-hover) text-(--text-primary)"
                            }`}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}

                {sending && (
                    <div className="flex gap-2">
                        <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: agent.color || "#6366F1" }}
                        >
                            <Loader2 size={14} className="animate-spin" />
                        </div>
                        <div className="rounded-2xl bg-(--bg-hover) px-3 py-2 text-sm text-(--text-muted)">
                            {t("agents.details.chat.thinking")}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 border-t border-(--bg-border) p-3">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && send()
                    }
                    placeholder={
                        isActive
                            ? t("agents.details.chat.placeholder")
                            : t("agents.details.chat.placeholderDisabled")
                    }
                    disabled={!isActive || sending}
                    className="flex-1 rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender) disabled:opacity-50"
                />
                <button
                    type="button"
                    onClick={send}
                    disabled={!input.trim() || sending || !isActive}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-lavender) text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                    {sending ? (
                        <Loader2 size={15} className="animate-spin" />
                    ) : (
                        <Send size={15} />
                    )}
                </button>
            </div>
        </div>
    );
}

// ============================================
// بطاقة أداة
// ============================================
function ToolCard({ tool }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--color-lavender)/10 text-(--color-lavender)">
                <Puzzle size={16} />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-(--text-primary)">
                    {tool.name}
                </span>
                <span className="text-xs text-(--text-muted)">
                    {tool.description}
                </span>
            </div>
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function AgentDetails() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isRTL = i18n.language === "ar";
    const locale = isRTL ? "ar-EG" : "en-US";

    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [toggling, setToggling] = useState(false);

    usePageTitle(agent?.name);

    // ✅ جلب الوكيل
    const loadAgent = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await agentsService.getById(id);
            setAgent(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadAgent();
    }, [loadAgent]);

    // ✅ الأدوات
    const agentTools = useMemo(() => {
        if (!agent) return [];
        return (agent.tools || [])
            .map((tId) => AVAILABLE_TOOLS.find((t) => t.id === tId))
            .filter(Boolean);
    }, [agent]);

    // ✅ نسخ
    const copyId = () => {
        if (!agent) return;
        navigator.clipboard.writeText(`agent_${agent.id}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // ✅ تفعيل/تعطيل
    const toggleActive = async () => {
        if (!agent) return;
        setToggling(true);
        try {
            await agentsService.toggleActive(agent.id, !agent.is_active);
            setAgent((prev) => ({ ...prev, is_active: !prev.is_active }));
        } catch (err) {
            alert(
                t("agents.toggleFailed", {
                    error: err.message || "",
                })
            );
        } finally {
            setToggling(false);
        }
    };

    // ✅ حذف
    const handleDelete = async () => {
        if (!agent) return;
        if (!confirm(t("agents.confirmDelete", { name: agent.name })))
            return;
        try {
            await agentsService.remove(agent.id);
            navigate("/agents");
        } catch (err) {
            alert(
                t("agents.deleteFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("agents.details.loading")}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <Bot size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {error
                        ? t("agents.details.loadError")
                        : t("agents.details.notFound")}
                </h2>
                {error && (
                    <p className="flex items-center gap-2 text-sm text-(--color-error)">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                <Link
                    to="/agents"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("agents.details.back")}
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/agents")}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight
                            size={16}
                            className={isRTL ? "" : "rotate-180"}
                        />
                    </button>

                    <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
                        style={{ background: agent.color || "#6366F1" }}
                    >
                        <Bot size={26} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {agent.name}
                        </h1>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    agent.is_active
                                        ? "bg-(--color-mint)/10 text-(--color-mint)"
                                        : "bg-(--text-muted)/10 text-(--text-muted)"
                                }`}
                            >
                                {agent.is_active ? (
                                    <CheckCircle2 size={11} />
                                ) : (
                                    <AlertCircle size={11} />
                                )}
                                {agent.is_active
                                    ? t("agents.status.active")
                                    : t("agents.status.inactive")}
                            </span>

                            <button
                                type="button"
                                onClick={copyId}
                                className="inline-flex items-center gap-1 rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs font-mono text-(--text-secondary) transition-colors hover:text-(--color-lavender)"
                                title={t("agents.details.copyId")}
                            >
                                {copied ? (
                                    <Check size={11} />
                                ) : (
                                    <Copy size={11} />
                                )}
                                agent_{agent.id}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleActive}
                        disabled={toggling}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                            agent.is_active
                                ? "border-(--bg-border) text-(--text-secondary) hover:bg-(--bg-hover)"
                                : "border-(--color-mint) text-(--color-mint) hover:bg-(--color-mint)/10"
                        }`}
                    >
                        {toggling ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : agent.is_active ? (
                            <>
                                <PowerOff size={14} />
                                <span>{t("agents.details.deactivate")}</span>
                            </>
                        ) : (
                            <>
                                <Power size={14} />
                                <span>{t("agents.details.activate")}</span>
                            </>
                        )}
                    </button>

                    <Link
                        to={`/agents/${agent.id}/edit`}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Edit size={15} />
                        <span>{t("agents.details.edit")}</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-(--bg-border) text-(--color-error) transition-colors hover:bg-(--color-error) hover:text-white"
                        title={t("agents.details.delete")}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* الوصف */}
            {agent.description && (
                <div className="mb-4 rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <p className="text-sm leading-relaxed text-(--text-secondary)">
                        {agent.description}
                    </p>
                </div>
            )}

            {/* بطاقات المعلومات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={Cpu}
                    label={t("agents.details.stats.model")}
                    value={agent.model || "—"}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={Thermometer}
                    label={t("agents.details.stats.temperature")}
                    value={agent.temperature}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
                <InfoCard
                    icon={Puzzle}
                    label={t("agents.details.stats.toolsCount")}
                    value={agentTools.length}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
                <InfoCard
                    icon={Clock}
                    label={t("agents.details.stats.updatedAt")}
                    value={
                        agent.updated_at
                            ? new Date(agent.updated_at).toLocaleDateString(
                                  locale
                              )
                            : "—"
                    }
                    color="text-(--color-pink) bg-(--color-pink)/10"
                />
            </div>

            {/* الأدوات + التعليمات */}
            <div className="mb-4 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Puzzle
                                size={18}
                                className="text-(--color-mint)"
                            />
                            <h2 className="text-base font-semibold text-(--text-primary)">
                                {t("agents.details.tools")}
                            </h2>
                        </div>

                        {agentTools.length > 0 ? (
                            <div className="grid gap-2 md:grid-cols-2">
                                {agentTools.map((tool) => (
                                    <ToolCard key={tool.id} tool={tool} />
                                ))}
                            </div>
                        ) : (
                            <p className="py-6 text-center text-sm text-(--text-muted)">
                                {t("agents.details.noTools")}
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Settings2
                            size={18}
                            className="text-(--color-lavender)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("agents.details.instructions")}
                        </h2>
                    </div>
                    <div className="rounded-lg border border-(--bg-border) bg-(--bg-main)/50 p-3">
                        <p className="whitespace-pre-wrap text-xs leading-relaxed text-(--text-secondary)">
                            {agent.system_prompt ||
                                t("agents.details.noInstructions")}
                        </p>
                    </div>
                </div>
            </div>

            {/* الدردشة */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ChatDemo agent={agent} isActive={agent.is_active} />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Sparkles
                                size={18}
                                className="text-(--color-amber)"
                            />
                            <h2 className="text-base font-semibold text-(--text-primary)">
                                {t("agents.details.quickInfo")}
                            </h2>
                        </div>

                        <div className="flex flex-col gap-2 text-xs">
                            <div className="flex items-center justify-between border-b border-(--bg-border) py-2">
                                <span className="text-(--text-muted)">
                                    {t("agents.details.quick.id")}
                                </span>
                                <span className="font-mono text-(--text-primary)">
                                    agent_{agent.id}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-(--bg-border) py-2">
                                <span className="text-(--text-muted)">
                                    {t("agents.details.quick.provider")}
                                </span>
                                <span className="text-(--text-primary)">
                                    {agent.provider}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-(--bg-border) py-2">
                                <span className="text-(--text-muted)">
                                    {t("agents.details.quick.status")}
                                </span>
                                <span
                                    className={
                                        agent.is_active
                                            ? "text-(--color-mint)"
                                            : "text-(--text-muted)"
                                    }
                                >
                                    {agent.is_active
                                        ? t("agents.status.active")
                                        : t("agents.status.inactive")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-(--text-muted)">
                                    {t("agents.details.quick.tools")}
                                </span>
                                <span className="text-(--text-primary)">
                                    {agentTools.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                        <p className="text-xs leading-relaxed text-(--text-muted)">
                            {t("agents.details.hint")}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}