import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    CreditCard,
    Edit,
    DollarSign,
    User,
    Hash,
    Building2,
    Calendar,
    Receipt,
} from "lucide-react";
import {
    generatePayments,
    getPaymentStatusColor,
} from "../../data/paymentsData";
import {
    DonutChart,
    BarChart,
    LineChart,
} from "../SubComponents/charts";
import { TemplateDarkMode } from "../../Store/TemplateSettings";

// ============================================
// بطاقة معلومة
// ============================================
function InfoCard({ icon: Icon, label, value, color }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-(--bg-border) bg-(--bg-card) p-3">
            <div className={`rounded-lg p-2 ${color}`}>
                <Icon size={18} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-(--text-muted)">{label}</span>
                <span className="text-sm font-bold text-(--text-primary)">
                    {value}
                </span>
            </div>
        </div>
    );
}

// ============================================
// سطر تفصيلي (فاتورة)
// ============================================
function ReceiptRow({ label, value, bold, color }) {
    return (
        <div className="flex items-center justify-between border-b border-(--bg-border) py-2 last:border-b-0">
            <span className="text-sm text-(--text-muted)">{label}</span>
            <span
                className={`text-sm ${bold ? "font-bold" : "font-medium"
                    } ${color || "text-(--text-primary)"}`}
            >
                {value}
            </span>
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function PaymentDetails() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const darkMode = useSelector(TemplateDarkMode);
    const isDark = darkMode === "dark" || darkMode === true;
    const isRTL = i18n.language === "ar";
    const locale = isRTL ? "ar-EG" : "en-US";

    const payments = useMemo(() => generatePayments(80), []);
    const payment = payments.find((p) => p.id === Number(id));

    usePageTitle(payment?.transaction);

    // أسماء الشهور من الترجمة
    const monthLabels = useMemo(
        () =>
            (t("common.months", { returnObjects: true }) || []).slice(0, 6),
        [t, i18n.language]
    );

    const monthly = useMemo(() => {
        return monthLabels.map((label) => ({
            label,
            value: Math.round(Math.random() * 5000 + 500),
        }));
    }, [monthLabels]);

    const methodDist = useMemo(() => {
        if (!payment) return [];
        return [
            {
                id: 0,
                label: payment.method,
                value: payment.amount,
                color: payment.color,
            },
        ];
    }, [payment]);

    // ============================================
    // Not found
    // ============================================
    if (!payment) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <CreditCard size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {t("payments.details.notFound")}
                </h2>
                <Link
                    to="/payments"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("payments.details.back")}
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        to="/payments"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight
                            size={16}
                            className={isRTL ? "" : "rotate-180"}
                        />
                    </Link>

                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                        style={{ background: payment.color }}
                    >
                        <CreditCard size={22} />
                    </div>

                    <div>
                        <h1 className="font-mono text-xl font-bold text-(--text-primary)">
                            {payment.transaction}
                        </h1>
                        <div className="mt-0.5 flex items-center gap-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPaymentStatusColor(
                                    payment.status
                                )}`}
                            >
                                {payment.status}
                            </span>
                            <span className="text-xs text-(--text-muted)">
                                {payment.method} • {payment.created_at}
                            </span>
                        </div>
                    </div>
                </div>

                <Link
                    to={`/payments/${payment.id}/edit`}
                    className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                    <Edit size={15} />
                    <span>{t("payments.details.edit")}</span>
                </Link>
            </div>

            {/* بطاقات المعلومات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={DollarSign}
                    label={t("payments.details.stats.amount")}
                    value={`${payment.amount.toLocaleString(locale)} ${payment.currency
                        }`}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
                <InfoCard
                    icon={Receipt}
                    label={t("payments.details.stats.fee")}
                    value={`${payment.fee.toLocaleString(locale)} ${payment.currency
                        }`}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
                <InfoCard
                    icon={DollarSign}
                    label={t("payments.details.stats.net")}
                    value={`${payment.net.toLocaleString(locale)} ${payment.currency
                        }`}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={Calendar}
                    label={t("payments.details.stats.date")}
                    value={payment.created_at}
                    color="text-(--color-pink) bg-(--color-pink)/10"
                />
            </div>

            {/* معلومات العملية */}
            <div className="mb-4 grid gap-4 md:grid-cols-3">
                {/* الفاتورة */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-3 text-base font-semibold text-(--text-primary)">
                        {t("payments.details.receipt")}
                    </h2>

                    <ReceiptRow
                        label={t("payments.details.totalAmount")}
                        value={`${payment.amount.toLocaleString(locale)} ${payment.currency
                            }`}
                    />
                    <ReceiptRow
                        label={t("payments.details.processingFee")}
                        value={`-${payment.fee.toLocaleString(locale)} ${payment.currency
                            }`}
                        color="text-(--color-error)"
                    />
                    <ReceiptRow
                        label={t("payments.details.netReceived")}
                        value={`${payment.net.toLocaleString(locale)} ${payment.currency
                            }`}
                        bold
                        color="text-(--color-mint)"
                    />

                    {payment.reference && (
                        <ReceiptRow
                            label={t("payments.details.reference")}
                            value={
                                <span className="font-mono text-xs">
                                    {payment.reference}
                                </span>
                            }
                        />
                    )}
                </div>

                {/* معلومات إضافية */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-3 text-base font-semibold text-(--text-primary)">
                        {t("payments.details.transactionInfo")}
                    </h2>

                    <div className="flex flex-col gap-3">
                        <InfoCard
                            icon={User}
                            label={t("payments.details.client")}
                            value={payment.client}
                            color="text-(--color-lavender) bg-(--color-lavender)/10"
                        />
                        <InfoCard
                            icon={Hash}
                            label={t("payments.details.orderId")}
                            value={payment.order_id}
                            color="text-(--color-mint) bg-(--color-mint)/10"
                        />
                        <InfoCard
                            icon={Building2}
                            label={t("payments.details.method")}
                            value={payment.method}
                            color="text-(--color-amber) bg-(--color-amber)/10"
                        />
                    </div>
                </div>

                {/* Donut */}
                <DonutChart
                    data={methodDist}
                    isDark={isDark}
                    title={t("payments.details.amountDistribution")}
                    height={280}
                    totalLabel={t("payments.details.total")}
                />
            </div>

            {/* رسوم */}
            <div className="grid gap-4 md:grid-cols-2">
                <LineChart
                    data={monthly}
                    isDark={isDark}
                    title={t("payments.details.monthlyRevenue")}
                    subtitle={t("payments.details.last6Months")}
                    height={280}
                />
                <BarChart
                    data={monthly}
                    isDark={isDark}
                    title={t("payments.details.revenueComparison")}
                    subtitle={t("payments.details.last6Months")}
                    height={280}
                />
            </div>
        </>
    );
}