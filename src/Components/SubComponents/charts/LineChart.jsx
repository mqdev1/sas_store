import { useMemo } from "react";
import ChartWrapper from "./ChartWrapper";

export default function LineChart({
    data = [],
    isDark = false,
    title = "Line Chart",
    subtitle,
    height = 300,
    valueSuffix = "₪",
    color = "#6366F1",
}) {
    const isEmpty = !data || data.length === 0;

    const options = useMemo(
        () => ({
            chart: {
                type: "area",
                background: "transparent",
                foreColor: isDark ? "#f1f5f9" : "#1e293b",
                toolbar: { show: false },
                zoom: { enabled: false },
            },
            theme: { mode: isDark ? "dark" : "light" },
            colors: [color],
            stroke: { curve: "smooth", width: 3 },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.5,
                    opacityTo: 0.05,
                    stops: [0, 100],
                },
            },
            markers: { size: 4, hover: { size: 6 } },
            dataLabels: { enabled: false },
            xaxis: {
                categories: data.map((d) => d.label),
                labels: {
                    style: {
                        colors: isDark ? "#94a3b8" : "#64748b",
                        fontSize: "11px",
                    },
                },
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: isDark ? "#94a3b8" : "#64748b",
                        fontSize: "11px",
                    },
                    formatter: (val) => val.toLocaleString(),
                },
            },
            grid: {
                borderColor: isDark ? "#334155" : "#e2e8f0",
                strokeDashArray: 4,
            },
            tooltip: {
                theme: isDark ? "dark" : "light",
                y: {
                    formatter: (val) =>
                        `${Number(val).toLocaleString()} ${valueSuffix}`,
                },
            },
        }),
        [data, isDark, valueSuffix, color]
    );

    const series = useMemo(
        () => [{ name: title, data: data.map((d) => d.value) }],
        [data, title]
    );

    return (
        <ChartWrapper
            options={options}
            series={series}
            type="area"
            height={height}
            title={title}
            subtitle={subtitle}
            empty={isEmpty}
        />
    );
}