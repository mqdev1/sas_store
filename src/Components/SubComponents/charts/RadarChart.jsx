import { useMemo } from "react";
import ChartWrapper from "./ChartWrapper";

export default function RadarChart({ data = [], isDark = false, title = "Radar Chart", height = 320 }) {
    const options = useMemo(() => ({
        chart: {
            type: "radar",
            background: "transparent",
            foreColor: isDark ? "#f1f5f9" : "#1e293b",
            toolbar: { show: false },
        },
        theme: { mode: isDark ? "dark" : "light" },
        colors: ["#6366F1"],
        xaxis: {
            categories: data.map((d) => d.label),
            labels: {
                style: { colors: isDark ? "#94a3b8" : "#64748b", fontSize: "11px" },
            },
        },
        yaxis: { show: false },
        markers: { size: 4 },
        fill: { opacity: 0.2 },
        stroke: { width: 2 },
        tooltip: {
            theme: isDark ? "dark" : "light",
            y: { formatter: (val) => `${val.toLocaleString()}` },
        },
    }), [data, isDark]);

    const series = useMemo(
        () => [{ name: title, data: data.map((d) => d.value) }],
        [data, title]
    );

    return <ChartWrapper options={options} series={series} type="radar" height={height} title={title} />;
}