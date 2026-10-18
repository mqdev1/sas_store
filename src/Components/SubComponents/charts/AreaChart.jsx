import { useMemo } from "react";
import ChartWrapper from "./ChartWrapper";

export default function AreaChart({ data = [], isDark = false, title = "Area Chart", height = 320 }) {
    const options = useMemo(() => ({
        chart: {
            type: "area",
            background: "transparent",
            foreColor: isDark ? "#f1f5f9" : "#1e293b",
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        theme: { mode: isDark ? "dark" : "light" },
        colors: ["#8B5CF6"],
        stroke: { curve: "smooth", width: 3 },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.6,
                opacityTo: 0.05,
                stops: [0, 100],
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: data.map((d) => d.label),
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
            y: { formatter: (val) => `${val.toLocaleString()}` },
        },
    }), [data, isDark]);

    const series = useMemo(
        () => [{ name: title, data: data.map((d) => d.value) }],
        [data, title]
    );

    return <ChartWrapper options={options} series={series} type="area" height={height} title={title} />;
}