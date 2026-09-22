import ReactApexChart from "react-apexcharts";

export default function ChartWrapper({
    options,
    series,
    type = "bar",
    height = 300,
    title,
    subtitle,
    empty = false,
    emptyText = "لا توجد بيانات",
    className = "",
}) {
    return (
        <div
            className={`
                w-full
                rounded-xl
                border border-(--bg-border)
                bg-(--bg-card)
                p-4
                shadow-sm
                transition-colors
                ${className}
            `}
        >
            {title && (
                <div className="mb-3">
                    <h2 className="text-base font-semibold text-(--text-primary)">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-(--text-muted)">
                            {subtitle}
                        </p>
                    )}
                </div>
            )}

            {empty ? (
                <p className="py-10 text-center text-sm text-(--text-muted)">
                    {emptyText}
                </p>
            ) : (
                <ReactApexChart
                    options={options}
                    series={series}
                    type={type}
                    height={height}
                />
            )}
        </div>
    );
}