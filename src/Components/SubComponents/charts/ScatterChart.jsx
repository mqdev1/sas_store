import { useMemo } from "react";
import ChartWrapper from "./ChartWrapper";

export default function ScatterChart({ data = [], isDark = false, title = "Scatter Chart", height = 320 }) {
    const options = useMemo(() => ({
        chart: {
            type: "scatter",
            background: "transparent",
            foreColor: isDark ? "#f1f5f9" : "#1e293b",
            toolbar: { show: false },
            zoom: { enabled: true },
        },
        theme: { mode: isDark ? "dark" : "light" },
        colors: ["#EC4899"],
        markers: { size: 6 },
        dataLabels: { enabled: false },
        xaxis: {
            tickAmount: 10,
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
            strokeDashArray: 4,
        },
        tooltip: {
            theme: isDark ? "dark" : "light",
        },
    }), [isDark]);

    const series = useMemo(
        () => [
            {
                name: title,
                data: data.map((d) => ({ x: d.x, y: d.y })),
            },
        ],
        [data, title]
    );

    return <ChartWrapper options={options} series={series} type="scatter" height={height} title={title} />;
}