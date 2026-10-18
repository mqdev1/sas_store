import { useMemo } from "react";
import ChartWrapper from "./ChartWrapper";
import { CHART_COLORS } from "../../../data/dashboardData";

export default function BarChart({
    data = [],
    isDark = false,
    title = "Bar Chart",
    subtitle,
    height = 300,
    horizontal = false,
    valueSuffix = "₪",
}) {
    const isEmpty = !data || data.length === 0;

    const options = useMemo(
        () => ({
            chart: {
                type: "bar",
                background: "transparent",
                foreColor: isDark ? "#f1f5f9" : "#1e293b",
                toolbar: { show: false },
            },
            theme: { mode: isDark ? "dark" : "light" },
            plotOptions: {
                bar: {
                    horizontal,
                    borderRadius: 6,
                    columnWidth: "55%",
                    distributed: true,
                },
            },
            colors: data.map(
                (d, i) => d.color || CHART_COLORS[i % CHART_COLORS.length]
            ),
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
                padding: { left: 8, right: 8 },
            },
            tooltip: {
                theme: isDark ? "dark" : "light",
                y: {
                    formatter: (val) =>
                        `${Number(val).toLocaleString()} ${valueSuffix}`,
                },
            },
            legend: { show: false },
        }),
        [data, isDark, horizontal, valueSuffix]
    );

    const series = useMemo(
        () => [{ name: title, data: data.map((d) => d.value) }],
        [data, title]
    );

    return (
        <ChartWrapper
            options={options}
            series={series}
            type="bar"
            height={height}
            title={title}
            subtitle={subtitle}
            empty={isEmpty}
        />
    );
}