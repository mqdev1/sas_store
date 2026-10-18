import { useMemo } from "react";
import ChartWrapper from "./ChartWrapper";
import { CHART_COLORS } from "../../../data/dashboardData";

export default function DonutChart({
    data = [],
    isDark = false,
    title = "Donut Chart",
    subtitle,
    height = 300,
    totalLabel = "الإجمالي",
    valueSuffix = "₪",
}) {
    const isEmpty = !data || data.length === 0;

    const options = useMemo(
        () => ({
            chart: {
                type: "donut",
                background: "transparent",
                foreColor: isDark ? "#f1f5f9" : "#1e293b",
                toolbar: { show: false },
            },
            theme: { mode: isDark ? "dark" : "light" },
            labels: data.map((p) => p.label),
            colors: data.map(
                (p, i) => p.color || CHART_COLORS[i % CHART_COLORS.length]
            ),
            legend: {
                position: "bottom",
                horizontalAlign: "center",
                fontSize: "11px",
                markers: { size: 5 },
                itemMargin: { horizontal: 6, vertical: 3 },
            },
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: "10px",
                    fontWeight: "bold",
                    colors: [isDark ? "#f1f5f9" : "#1e293b"],
                },
                formatter: (val) => `${val.toFixed(0)}%`,
            },
            stroke: {
                show: true,
                width: 2,
                colors: [isDark ? "#1e293b" : "#ffffff"],
            },
            tooltip: {
                theme: isDark ? "dark" : "light",
                y: {
                    formatter: (val) =>
                        `${Number(val).toLocaleString()} ${valueSuffix}`,
                },
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: "58%",
                        labels: {
                            show: true,
                            name: {
                                fontSize: "11px",
                                color: isDark ? "#94a3b8" : "#64748b",
                            },
                            value: {
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: isDark ? "#f1f5f9" : "#1e293b",
                                formatter: (val) =>
                                    Number(val).toLocaleString(),
                            },
                            total: {
                                show: true,
                                label: totalLabel,
                                color: isDark ? "#94a3b8" : "#64748b",
                                formatter: (w) =>
                                    w.globals.seriesTotals
                                        .reduce((a, b) => a + b, 0)
                                        .toLocaleString(),
                            },
                        },
                    },
                },
            },
        }),
        [data, isDark, totalLabel, valueSuffix]
    );

    const series = useMemo(() => data.map((p) => p.value), [data]);

    return (
        <ChartWrapper
            options={options}
            series={series}
            type="donut"
            height={height}
            title={title}
            subtitle={subtitle}
            empty={isEmpty}
        />
    );
}