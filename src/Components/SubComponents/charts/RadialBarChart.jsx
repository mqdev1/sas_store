import { useMemo } from "react";
import ChartWrapper from "./ChartWrapper";

export default function RadialBarChart({
    data = [],
    isDark = false,
    title = "Radial Bar",
    subtitle,
    height = 300,
}) {
    const isEmpty = !data || data.length === 0;

    const options = useMemo(
        () => ({
            chart: {
                type: "radialBar",
                background: "transparent",
                foreColor: isDark ? "#f1f5f9" : "#1e293b",
                toolbar: { show: false },
            },
            theme: { mode: isDark ? "dark" : "light" },
            labels: data.map((d) => d.label),
            colors: data.map((d, i) => d.color || ["#10B981", "#F59E0B", "#EF4444"][i % 3]),
            plotOptions: {
                radialBar: {
                    hollow: { size: "40%" },
                    track: {
                        background: isDark ? "#334155" : "#e2e8f0",
                    },
                    dataLabels: {
                        name: {
                            fontSize: "12px",
                            color: isDark ? "#94a3b8" : "#64748b",
                        },
                        value: {
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: isDark ? "#f1f5f9" : "#1e293b",
                            formatter: (val) => `${val}%`,
                        },
                        total: {
                            show: true,
                            label: "المتوسط",
                            color: isDark ? "#94a3b8" : "#64748b",
                            formatter: (w) => {
                                const sum = w.globals.seriesTotals.reduce(
                                    (a, b) => a + b,
                                    0
                                );
                                return `${Math.round(sum / w.globals.series.length)}%`;
                            },
                        },
                    },
                },
            },
            legend: {
                show: true,
                position: "bottom",
                horizontalAlign: "center",
                fontSize: "11px",
                labels: { colors: isDark ? "#f1f5f9" : "#1e293b" },
                markers: { size: 5 },
            },
            tooltip: { theme: isDark ? "dark" : "light" },
        }),
        [data, isDark]
    );

    const series = useMemo(() => data.map((d) => d.value), [data]);

    return (
        <ChartWrapper
            options={options}
            series={series}
            type="radialBar"
            height={height}
            title={title}
            subtitle={subtitle}
            empty={isEmpty}
        />
    );
}