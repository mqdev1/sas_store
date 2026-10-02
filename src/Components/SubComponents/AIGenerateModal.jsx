import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Sparkles,
    X,
    Check,
    AlertCircle,
    Package,
    Tag,
    DollarSign,
    Boxes,
    Star,
    Edit,
    Bot,
    Image as ImageIcon,
} from "lucide-react";
import * as agentsService from "../../Services/agentsService";
import * as categoriesService from "../../Services/categoriesService";

export default function AIGenerateModal({ open, onClose, onApprove }) {
    const { t } = useTranslation();
    const [step, setStep] = useState("input");
    const [form, setForm] = useState({
        name: "",
        category: "",
        keywords: "",
        agent_id: "",
    });
    const [categories, setCategories] = useState([]);
    const [agents, setAgents] = useState([]);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        categoriesService
            .getAll({ isActive: true })
            .then((res) => {
                const cats = res.data || [];
                setCategories(cats);
                if (cats[0]) {
                    setForm((f) => ({
                        ...f,
                        category: f.category || cats[0].name,
                    }));
                }
            })
            .catch((err) => console.warn("Categories error:", err));

        agentsService
            .getAll()
            .then((data) => {
                const productAgents = (data || []).filter(
                    (a) =>
                        a.is_active &&
                        (a.tools || []).includes("generate_product")
                );
                setAgents(productAgents);
                if (productAgents[0]) {
                    setForm((f) => ({
                        ...f,
                        agent_id: f.agent_id || productAgents[0].id,
                    }));
                }
            })
            .catch((err) => console.warn("Agents error:", err));
    }, [open]);

    const reset = () => {
        setStep("input");
        setForm({ name: "", category: "", keywords: "", agent_id: "" });
        setResult(null);
        setError("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // ============================================
    // توليد
    // ============================================
    const generate = async () => {
        if (!form.name.trim()) {
            setError(t("common.aiGenerate.nameRequired"));
            return;
        }
        if (!form.category) {
            setError(t("common.aiGenerate.categoryRequired"));
            return;
        }

        setError("");
        setStep("generating");

        try {
            const data = await agentsService.generateProduct({
                agent_id: form.agent_id || null,
                name: form.name.trim(),
                category: form.category,
                keywords: form.keywords.trim(),
            });

            setResult(data);
            setStep("review");
        } catch (err) {
            console.error("🔴 [AIGenerateModal] err:", err);
            setError(err.message);
            setStep("input");
        }
    };

    const approve = () => {
        if (!result) return;
        onApprove(result);
        handleClose();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleClose}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-(--bg-border) bg-(--bg-card) shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* الرأس */}
                <div className="flex items-center justify-between border-b border-(--bg-border) p-4">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-(--color-lavender)/10 p-2">
                            <Sparkles
                                size={18}
                                className="text-(--color-lavender)"
                            />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-(--text-primary)">
                                {t("common.aiGenerate.title")}
                            </h2>
                            <p className="text-xs text-(--text-muted)">
                                {t("common.aiGenerate.subtitle")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:bg-(--bg-hover)"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* المحتوى */}
                <div className="flex-1 overflow-y-auto p-4">
                    {step === "input" && (
                        <div className="flex flex-col gap-4">
                            {agents.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="flex items-center gap-1 text-xs font-medium text-(--text-secondary)">
                                        <Bot size={12} />
                                        {t("common.aiGenerate.agentLabel")}
                                    </label>
                                    <select
                                        value={form.agent_id}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                agent_id: e.target.value,
                                            }))
                                        }
                                        className="rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                                    >
                                        {agents.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name} — {a.model}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {agents.length === 0 && (
                                <div className="flex items-start gap-2 rounded-xl border border-(--color-amber)/40 bg-(--color-amber)/5 p-3 text-xs">
                                    <AlertCircle
                                        size={14}
                                        className="shrink-0 text-(--color-amber) mt-0.5"
                                    />
                                    <span className="text-(--text-primary)">
                                        {t("common.aiGenerate.noAgentWarning")}
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-(--text-secondary)">
                                    {t("common.aiGenerate.productName")} *
                                </label>
                                <input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        "common.aiGenerate.productNamePlaceholder"
                                    )}
                                    className="rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                                    autoFocus
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-(--text-secondary)">
                                    {t("common.aiGenerate.category")}
                                </label>
                                <select
                                    value={form.category}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            category: e.target.value,
                                        }))
                                    }
                                    className="rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                                >
                                    {categories.length === 0 ? (
                                        <option value="">
                                            {t("common.aiGenerate.noCategories")}
                                        </option>
                                    ) : (
                                        categories.map((c) => (
                                            <option key={c.id} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-(--text-secondary)">
                                    {t("common.aiGenerate.keywords")}
                                </label>
                                <input
                                    value={form.keywords}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            keywords: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        "common.aiGenerate.keywordsPlaceholder"
                                    )}
                                    className="rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                                    <AlertCircle
                                        size={16}
                                        className="shrink-0 text-(--color-error)"
                                    />
                                    <span className="text-(--text-primary)">
                                        {error}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {step === "generating" && (
                        <div className="flex flex-col items-center justify-center gap-4 py-12">
                            <div className="relative">
                                <div className="h-16 w-16 animate-spin rounded-full border-4 border-(--bg-border) border-t-(--color-lavender)" />
                                <Sparkles
                                    size={22}
                                    className="absolute inset-0 m-auto text-(--color-lavender)"
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-(--text-primary)">
                                    {t("common.aiGenerate.generating")}
                                </p>
                                <p className="mt-1 text-xs text-(--text-muted)">
                                    {t("common.aiGenerate.generatingHint")}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === "review" && result && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 rounded-xl border border-(--color-mint)/40 bg-(--color-mint)/5 p-3 text-sm">
                                <Check
                                    size={16}
                                    className="shrink-0 text-(--color-mint)"
                                />
                                <span className="text-(--text-primary)">
                                    {t("common.aiGenerate.reviewSuccess")}
                                </span>
                            </div>

                            <div className="rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--color-lavender)/10 text-(--color-lavender)">
                                        <Package size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-bold text-(--text-primary)">
                                            {result.name}
                                        </h3>
                                        <p className="mt-1 text-xs text-(--text-muted)">
                                            {result.sku} • {result.category}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-3 text-sm leading-relaxed text-(--text-secondary)">
                                    {result.description}
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <div className="flex items-center gap-2">
                                        <DollarSign
                                            size={14}
                                            className="text-(--color-mint)"
                                        />
                                        <span className="text-sm font-bold text-(--text-primary)">
                                            {Number(
                                                result.price
                                            ).toLocaleString()}{" "}
                                            ₪
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Boxes
                                            size={14}
                                            className="text-(--color-lavender)"
                                        />
                                        <span className="text-sm text-(--text-primary)">
                                            {t(
                                                "common.aiGenerate.stockUnit",
                                                { count: result.stock }
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Star
                                            size={14}
                                            className="text-(--color-amber)"
                                        />
                                        <span className="text-sm text-(--text-primary)">
                                            {result.rating} / 5
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tag
                                            size={14}
                                            className="text-(--color-pink)"
                                        />
                                        <span className="text-sm text-(--text-primary)">
                                            {t(
                                                "common.aiGenerate.tagsCount",
                                                {
                                                    count:
                                                        result.tags?.length ||
                                                        0,
                                                }
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {result.tags?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {result.tags.map((tag, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs text-(--text-secondary)"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-start gap-2 rounded-xl border border-(--color-lavender)/30 bg-(--color-lavender)/5 p-3 text-xs">
                                <ImageIcon
                                    size={14}
                                    className="shrink-0 text-(--color-lavender) mt-0.5"
                                />
                                <span className="text-(--text-primary)">
                                    {t("common.aiGenerate.imageNote")}
                                </span>
                            </div>

                            <div className="text-xs text-(--text-muted)">
                                {t("common.aiGenerate.editHint")}
                            </div>
                        </div>
                    )}
                </div>

                {/* الأزرار */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-(--bg-border) p-4">
                    {step === "input" && (
                        <>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={generate}
                                disabled={categories.length === 0}
                                className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                <Sparkles size={15} />
                                {t("common.aiGenerate.generate")}
                            </button>
                        </>
                    )}

                    {step === "review" && (
                        <>
                            <button
                                type="button"
                                onClick={() => setStep("input")}
                                className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                            >
                                <Edit size={14} />
                                {t("common.aiGenerate.editInputs")}
                            </button>
                            <button
                                type="button"
                                onClick={approve}
                                className="flex items-center gap-2 rounded-full bg-(--color-mint) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                <Check size={15} />
                                {t("common.aiGenerate.approve")}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}