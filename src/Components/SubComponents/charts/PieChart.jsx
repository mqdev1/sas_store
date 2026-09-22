import { useMemo } from "react";
import ChartWrapper from "./ChartWrapper";

const COLORS = [
    "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#F59E0B",
    "#10B981", "#14B8A6", "#06B6D4", "#3B82F6", "#A855F7",
];

export default function PieChart({ data = [], isDark = false, title = "Pie Chart", height = 320 }) {
    const options = useMemo(() => ({
        chart: {
            type: "pie",
            background: "transparent",
            foreColor: isDark ? "#f1f5f9" : "#1e293b",
            toolbar: { show: false },
        },
        theme: { mode: isDark ? "dark" : "light" },
        labels: data.map((d) => d.label),
        colors: data.map((d, i) => d.color || COLORS[i % COLORS.length]),
        legend: {
            position: "bottom",
            horizontalAlign: "center",
            fontSize: "12px",
            markers: { size: 6 },
            itemMargin: { horizontal: 8, vertical: 4 },
        },
        dataLabels: {
            enabled: true,
            style: {
                fontSize: "11px",
                fontWeight: "bold",
                colors: [isDark ? "#f1f5f9" : "#1e293b"],
            },
            formatter: (val) => `${val.toFixed(1)}%`,
        },
        stroke: {
            show: true,
            width: 2,
            colors: [isDark ? "#1e293b" : "#ffffff"],
        },
        tooltip: {
            theme: isDark ? "dark" : "light",
            y: { formatter: (val) => `${val.toLocaleString()}` },
        },
    }), [data, isDark]);

    const series = useMemo(() => data.map((d) => d.value), [data]);

    return <ChartWrapper options={options} series={series} type="pie" height={height} title={title} />;
}