import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Sparkles,
    X,
    Send,
    Loader2,
    Printer,
    Download,
    Bot,
    AlertCircle,
    FileText,
    BarChart3,
    Table as TableIcon,
    Lightbulb,
} from "lucide-react";
import * as agentsService from "../../Services/agentsService";
import * as reportsAIService from "../../Services/reportsAIService";
import ReportPreview from "./ReportPreview";

const QUICK_PROMPTS = [
    "تقرير كامل عن إجمالي المبيعات والإيرادات",
    "أفضل 10 منتجات مبيعًا",
    "تقرير الطلبات حسب الحالة",
    "أعلى 10 عملاء من حيث الشراء",
    "تقرير المبيعات حسب الدولة",
    "تقرير المدفوعات حسب طريقة الدفع",
];

export default function AIReportModal({ open, onClose }) {
    const { t } = useTranslation();

    const [prompt, setPrompt] = useState("");
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState("");
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState("");

    // جلب الوكلاء المختصين بالتقارير
    useEffect(() => {
        if (!open) return;

        agentsService
            .getAll()
            .then((data) => {
                const reportAgents = (data || []).filter(
                    (a) =>
                        a.is_active &&
                        (a.tools || []).includes("generate_report")
                );
                setAgents(reportAgents);
                if (reportAgents[0]) {
                    setSelectedAgent(reportAgents[0].id);
                }
            })
            .catch((err) => console.warn("Agents error:", err));
    }, [open]);

    const reset = () => {
        setPrompt("");
        setReport(null);
        setError("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const generate = async () => {
        if (!prompt.trim()) {
            setError(t("reports.ai.promptRequired"));
            return;
        }

        setLoading(true);
        setError("");
        setReport(null);

        try {
            const result = await reportsAIService.generateAIReport({
                prompt: prompt.trim(),
                agent_id: selectedAgent || null,
            });
            setReport(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!open) return null;

    return (
        <>
            {/* Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 ai-report-modal-overlay"
                onClick={handleClose}
            >
                <div
                    className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-(--bg-border) bg-(--bg-card) shadow-2xl ai-report-modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-(--bg-border) p-4 no-print">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-gradient-to-br from-(--color-lavender) to-(--color-pink) p-2">
                                <Sparkles
                                    size={18}
                                    className="text-white"
                                />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-(--text-primary)">
                                    {t("reports.ai.title")}
                                </h2>
                                <p className="text-xs text-(--text-muted)">
                                    {t("reports.ai.subtitle")}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-(--text-muted) hover:bg-(--bg-hover)"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body: side-by-side */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Input panel */}
                        <div className="flex w-1/3 flex-col border-e border-(--bg-border) p-4 no-print">
                            {/* Agent selector */}
                            {agents.length > 0 && (
                                <div className="mb-3">
                                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-(--text-secondary)">
                                        <Bot size={12} />
                                        {t("reports.ai.agentLabel")}
                                    </label>
                                    <select
                                        value={selectedAgent}
                                        onChange={(e) =>
                                            setSelectedAgent(e.target.value)
                                        }
                                        className="w-full rounded-lg border border-(--bg-border) bg-(--bg-elevated) p-2 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                                    >
                                        {agents.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Prompt input */}
                            <label className="mb-1.5 text-xs font-medium text-(--text-secondary)">
                                {t("reports.ai.promptLabel")}
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={t("reports.ai.promptPlaceholder")}
                                rows={4}
                                disabled={loading}
                                className="mb-3 w-full resize-none rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                            />

                            {/* Quick prompts */}
                            <div className="mb-4">
                                <div className="mb-2 flex items-center gap-1 text-xs font-medium text-(--text-muted)">
                                    <Lightbulb size={12} />
                                    {t("reports.ai.suggestions")}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {QUICK_PROMPTS.map((p, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setPrompt(p)}
                                            disabled={loading}
                                            className="rounded-full border border-(--bg-border) bg-(--bg-elevated) px-2.5 py-1 text-xs text-(--text-secondary) transition-colors hover:border-(--color-lavender) hover:text-(--color-lavender)"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="button"
                                onClick={generate}
                                disabled={loading || !prompt.trim()}
                                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-(--color-lavender) to-(--color-pink) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Sparkles size={15} />
                                )}
                                {loading
                                    ? t("reports.ai.generating")
                                    : t("reports.ai.generate")}
                            </button>

                            {/* Error */}
                            {error && (
                                <div className="mt-3 flex items-start gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-xs">
                                    <AlertCircle
                                        size={14}
                                        className="mt-0.5 shrink-0 text-(--color-error)"
                                    />
                                    <span className="text-(--text-primary)">
                                        {error}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Preview panel */}
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <ReportPreview
                                report={report}
                                loading={loading}
                            />
                        </div>
                    </div>

                    {/* Footer actions */}
                    {report && (
                        <div className="flex items-center justify-end gap-2 border-t border-(--bg-border) p-3 no-print">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                            >
                                <Printer size={14} />
                                {t("reports.ai.print")}
                            </button>
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                            >
                                <Download size={14} />
                                {t("reports.ai.savePdf")}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .ai-report-printable,
                    .ai-report-printable * { visibility: visible; }
                    .ai-report-printable {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print { display: none !important; }
                    .ai-report-modal-overlay { position: static !important; background: white !important; padding: 0 !important; }
                    .ai-report-modal-content { box-shadow: none !important; border: none !important; max-width: 100% !important; height: auto !important; }
                }
            `}</style>
        </>
    );
}