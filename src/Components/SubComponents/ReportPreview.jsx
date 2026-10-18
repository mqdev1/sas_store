import { useTranslation } from "react-i18next";
import { FileText, Loader2, BarChart3 } from "lucide-react";
import {
    LineChart,
    BarChart,
    DonutChart,
} from "./charts";

export default function ReportPreview({ report, loading }) {
    const { t } = useTranslation();

    // ============================================
    // Loading state
    // ============================================
    if (loading) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
                <div className="relative">
                    <div className="h-14 w-14 animate-spin rounded-full border-4 border-(--bg-border) border-t-(--color-lavender)" />
                </div>
                <p className="text-sm font-medium text-(--text-primary)">
                    {t("reports.ai.generatingTitle")}
                </p>
                <p className="text-xs text-(--text-muted)">
                    {t("reports.ai.generatingHint")}
                </p>
            </div>
        );
    }

    // ============================================
    // Empty state
    // ============================================
    if (!report) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <FileText size={48} className="text-(--text-muted)" />
                <div>
                    <p className="text-sm font-medium text-(--text-primary)">
                        {t("reports.ai.emptyTitle")}
                    </p>
                    <p className="mt-1 text-xs text-(--text-muted)">
                        {t("reports.ai.emptySubtitle")}
                    </p>
                </div>
            </div>
        );
    }

    // ============================================
    // Report
    // ============================================
    return (
        <div className="ai-report-printable flex-1 overflow-y-auto bg-(--bg-main) p-6">
            <div className="mx-auto max-w-3xl rounded-xl border border-(--bg-border) bg-white p-8 shadow-sm">
                {/* Header */}
                <div className="mb-6 border-b-2 border-(--color-lavender) pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {report.title}
                    </h1>
                    {report.subtitle && (
                        <p className="mt-1 text-sm text-gray-600">
                            {report.subtitle}
                        </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                        {new Date(
                            report.generated_at || Date.now()
                        ).toLocaleString()}
                    </p>
                </div>

                {/* Summary */}
                {report.summary && (
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <h2 className="mb-2 text-sm font-bold text-blue-900">
                            {t("reports.ai.summary")}
                        </h2>
                        <p className="text-sm leading-relaxed text-blue-800">
                            {report.summary}
                        </p>
                    </div>
                )}

                {/* Sections */}
                <div className="flex flex-col gap-6">
                    {report.sections?.map((section, i) => (
                        <Section key={i} section={section} />
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
                    {t("reports.ai.footer")}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Section renderer
// ============================================
function Section({ section }) {
    const { t } = useTranslation();

    // Stats
    if (section.type === "stats" && section.items?.length) {
        return (
            <div>
                <h2 className="mb-3 text-base font-bold text-gray-900">
                    {section.title}
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {section.items.map((item, i) => (
                        <div
                            key={i}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                            <div className="text-xs text-gray-500">
                                {item.label}
                            </div>
                            <div className="mt-1 text-lg font-bold text-gray-900">
                                {typeof item.value === "number"
                                    ? item.value.toLocaleString()
                                    : item.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Table
    if (section.type === "table" && section.rows?.length) {
        return (
            <div>
                <h2 className="mb-3 text-base font-bold text-gray-900">
                    {section.title}
                </h2>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                {section.columns?.map((col, i) => (
                                    <th
                                        key={i}
                                        className="px-3 py-2 text-start text-xs font-bold text-gray-700"
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {section.rows.map((row, ri) => (
                                <tr
                                    key={ri}
                                    className="border-t border-gray-200"
                                >
                                    {section.columns?.map((col, ci) => (
                                        <td
                                            key={ci}
                                            className="px-3 py-2 text-sm text-gray-800"
                                        >
                                            {typeof row[col.key] === "number"
                                                ? row[col.key].toLocaleString()
                                                : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Chart
    if (section.type === "chart" && section.data?.length) {
        const ChartComp =
            section.chartType === "line"
                ? LineChart
                : section.chartType === "donut"
                ? DonutChart
                : BarChart;

        return (
            <div>
                <h2 className="mb-3 text-base font-bold text-gray-900">
                    {section.title}
                </h2>
                <div className="rounded-lg border border-gray-200 p-4">
                    <ChartComp
                        data={section.data}
                        isDark={false}
                        title=""
                        subtitle=""
                        height={280}
                    />
                </div>
            </div>
        );
    }

    // Text
    if (section.type === "text" && section.content) {
        return (
            <div>
                <h2 className="mb-3 text-base font-bold text-gray-900">
                    {section.title}
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {section.content}
                </p>
            </div>
        );
    }

    return null;
}