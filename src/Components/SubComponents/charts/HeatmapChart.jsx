import { useMemo } from "react";
import ChartWrapper from "./ChartWrapper";

export default function HeatmapChart({ data = [], isDark = false, title = "Heatmap", height = 320 }) {
    const options = useMemo(() => ({
        chart: {
            type: "heatmap",
            background: "transparent",
            foreColor: isDark ? "#f1f5f9" : "#1e293b",
            toolbar: { show: false },
        },
        theme: { mode: isDark ? "dark" : "light" },
        dataLabels: { enabled: false },
        colors: ["#6366F1"],
        xaxis: {
            labels: {
                style: { colors: isDark ? "#94a3b8" : "#64748b", fontSize: "11px" },
            },
        },
        yaxis: {
            labels: {
                style: { colors: isDark ? "#94a3b8" : "#64748b", fontSize: "11px" },
            },
        },
        grid: {
            borderColor: isDark ? "#334155" : "#e2e8f0",
        },
        tooltip: { theme: isDark ? "dark" : "light" },
    }), [isDark]);

    const series = useMemo(
        () =>
            data.map((row) => ({
                name: row.name,
                data: row.data,
            })),
        [data]
    );

    return <ChartWrapper options={options} series={series} type="heatmap" height={height} title={title} />;
}