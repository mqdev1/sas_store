import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    ShoppingCart,
    Edit,
    Trash2,
    User,
    MapPin,
    Calendar,
    Package,
    DollarSign,
    Printer,
    CheckCircle2,
    Clock,
    Truck,
    XCircle,
    CreditCard,
    Copy,
    Check,
    FileText,
    Loader2,
    AlertCircle,
} from "lucide-react";
import * as ordersService from "../../Services/ordersService";

// ============================================
// حالات الطلب
// ============================================
const ORDER_STATUSES = [
    {
        key: "pending",
        color: "text-(--color-amber) bg-(--color-amber)/10",
        icon: Clock,
    },
    {
        key: "processing",
        color: "text-(--color-lavender) bg-(--color-lavender)/10",
        icon: Clock,
    },
    {
        key: "shipped",
        color: "text-(--color-lavender) bg-(--color-lavender)/10",
        icon: Truck,
    },
    {
        key: "delivered",
        color: "text-(--color-mint) bg-(--color-mint)/10",
        icon: CheckCircle2,
    },
    {
        key: "cancelled",
        color: "text-(--color-error) bg-(--color-error)/10",
        icon: XCircle,
    },
];

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
// Timeline
// ============================================
function Timeline({ status }) {
    const { t } = useTranslation();

    const steps = [
        {
            key: "pending",
            label: t("orders.details.timelineCreated"),
            icon: ShoppingCart,
        },
        {
            key: "processing",
            label: t("orders.details.timelineProcessing"),
            icon: Clock,
        },
        {
            key: "shipped",
            label: t("orders.details.timelineShipped"),
            icon: Truck,
        },
        {
            key: "delivered",
            label: t("orders.details.timelineDelivered"),
            icon: CheckCircle2,
        },
    ];

    const statusIndex =
        {
            pending: 0,
            processing: 1,
            shipped: 2,
            delivered: 3,
            cancelled: -1,
        }[status] ?? 0;

    return (
        <div className="flex flex-col">
            {steps.map((step, i) => {
                const Icon = step.icon;
                const done = i <= statusIndex;
                return (
                    <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${done
                                        ? "border-(--color-mint) bg-(--color-mint) text-white"
                                        : "border-(--bg-border) bg-(--bg-card) text-(--text-muted)"
                                    }`}
                            >
                                <Icon size={14} />
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-0.5 flex-1 min-h-7 ${done
                                            ? "bg-(--color-mint)"
                                            : "bg-(--bg-border)"
                                        }`}
                                />
                            )}
                        </div>
                        <div className="pb-4 pt-1">
                            <span
                                className={`text-sm font-medium ${done
                                        ? "text-(--text-primary)"
                                        : "text-(--text-muted)"
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================
// صف في الفاتورة
// ============================================
function ReceiptRow({ label, value, bold, color }) {
    return (
        <div className="flex items-center justify-between border-b border-(--bg-border) py-2 last:border-b-0">
            <span className="text-sm text-(--text-muted)">{label}</span>
            <span
                className={`text-sm ${bold ? "font-bold text-base" : "font-medium"
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
export default function OrderDetails() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    usePageTitle(
        order ? t("orders.details.orderTitle", { id: order.id }) : null
    );

    // ============================================
    // جلب الطلب
    // ============================================
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await ordersService.getById(id);
                if (!cancelled) setOrder(data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id]);

    // ✅ نسخ رقم الطلب
    const copyId = () => {
        if (!order) return;
        navigator.clipboard.writeText(
            order.order_number || `ORD-${order.id}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // ✅ حذف
    const handleDelete = async () => {
        if (!confirm(t("orders.details.confirmDelete", { id: order.id })))
            return;
        try {
            await ordersService.remove(order.id);
            navigate("/orders");
        } catch (err) {
            alert(
                t("orders.deleteFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // Loading
    // ============================================
    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("orders.details.loading")}
                    </p>
                </div>
            </div>
        );
    }

    // ============================================
    // Error / Not Found
    // ============================================
    if (error || !order) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <ShoppingCart size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {error
                        ? t("orders.details.loadError")
                        : t("orders.details.notFound")}
                </h2>
                {error && (
                    <p className="flex items-center gap-2 text-sm text-(--color-error)">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                <Link
                    to="/orders"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("orders.details.back")}
                </Link>
            </div>
        );
    }

    const statusObj =
        ORDER_STATUSES.find((s) => s.key === order.status) ||
        ORDER_STATUSES[0];
    const StatusIcon = statusObj.icon;

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/orders")}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight
                            size={16}
                            className={i18n.language === "ar" ? "" : "rotate-180"}
                        />
                    </button>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-lavender)/10">
                        <ShoppingCart
                            size={22}
                            className="text-(--color-lavender)"
                        />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("orders.details.orderTitle", { id: order.id })}
                        </h1>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusObj.color}`}
                            >
                                <StatusIcon size={11} />
                                {t(`orders.status.${statusObj.key}`)}
                            </span>
                            <button
                                type="button"
                                onClick={copyId}
                                className="inline-flex items-center gap-1 rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs font-mono text-(--text-secondary) transition-colors hover:text-(--color-lavender)"
                                title={t("orders.details.copyId")}
                            >
                                {copied ? (
                                    <Check size={11} />
                                ) : (
                                    <Copy size={11} />
                                )}
                                {order.order_number || `ORD-${order.id}`}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                        title={t("orders.details.print")}
                    >
                        <Printer size={15} />
                    </button>

                    <Link
                        to={`/orders/${order.id}/edit`}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Edit size={15} />
                        <span>{t("orders.details.edit")}</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-(--bg-border) text-(--color-error) transition-colors hover:bg-(--color-error) hover:text-white"
                        title={t("orders.details.delete")}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* بطاقات المعلومات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={User}
                    label={t("orders.details.client")}
                    value={order.client_name || "—"}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={Calendar}
                    label={t("orders.details.date")}
                    value={order.order_date || "—"}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
                <InfoCard
                    icon={MapPin}
                    label={t("orders.details.address")}
                    value={order.address || "—"}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
                <InfoCard
                    icon={DollarSign}
                    label={t("orders.details.total")}
                    value={`${Number(order.total || 0).toLocaleString()} ₪`}
                    color="text-(--color-pink) bg-(--color-pink)/10"
                />
            </div>

            {/* Timeline + الفاتورة */}
            <div className="mb-4 grid gap-4 lg:grid-cols-3">
                {/* Timeline */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("orders.details.timeline")}
                    </h2>
                    <Timeline status={order.status} />
                </div>

                {/* المنتجات */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Package
                                size={18}
                                className="text-(--color-mint)"
                            />
                            <h2 className="text-base font-semibold text-(--text-primary)">
                                {t("orders.details.products")}
                            </h2>
                            <span className="rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs text-(--text-secondary)">
                                {order.items?.length || 0}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-(--bg-border) text-start">
                                        <th className="p-2 text-start text-xs font-bold text-(--text-muted)">
                                            {t("orders.details.product")}
                                        </th>
                                        <th className="p-2 text-start text-xs font-bold text-(--text-muted)">
                                            {t("orders.details.quantity")}
                                        </th>
                                        <th className="p-2 text-start text-xs font-bold text-(--text-muted)">
                                            {t("orders.details.price")}
                                        </th>
                                        <th className="p-2 text-start text-xs font-bold text-(--text-muted)">
                                            {t("orders.details.subtotal")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items?.length > 0 ? (
                                        order.items.map((item, i) => (
                                            <tr
                                                key={i}
                                                className="border-b border-(--bg-border) last:border-b-0"
                                            >
                                                <td className="p-2 text-sm text-(--text-primary)">
                                                    {item.product_name ||
                                                        "—"}
                                                </td>
                                                <td className="p-2 text-sm text-(--text-primary)">
                                                    {item.quantity}
                                                </td>
                                                <td className="p-2 text-sm text-(--text-primary)">
                                                    {Number(
                                                        item.price || 0
                                                    ).toLocaleString()}{" "}
                                                    ₪
                                                </td>
                                                <td className="p-2 text-sm font-bold text-(--color-mint)">
                                                    {Number(
                                                        item.subtotal ||
                                                        item.price *
                                                        item.quantity
                                                    ).toLocaleString()}{" "}
                                                    ₪
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="p-4 text-center text-sm text-(--text-muted)"
                                            >
                                                {t("orders.details.noItems")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* الفاتورة + الدفع */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* الفاتورة */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <FileText
                            size={18}
                            className="text-(--color-amber)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("orders.details.invoice")}
                        </h2>
                    </div>

                    <ReceiptRow
                        label={t("orders.details.subTotalLabel")}
                        value={`${Number(
                            order.subtotal || 0
                        ).toLocaleString()} ₪`}
                    />
                    <ReceiptRow
                        label={t("orders.details.tax")}
                        value={`${Number(order.tax || 0).toLocaleString()} ₪`}
                        color="text-(--color-amber)"
                    />
                    <ReceiptRow
                        label={t("orders.details.shipping")}
                        value={`${Number(
                            order.shipping || 0
                        ).toLocaleString()} ₪`}
                        color="text-(--color-lavender)"
                    />
                    <ReceiptRow
                        label={t("orders.details.totalLabel")}
                        value={`${Number(order.total || 0).toLocaleString()} ₪`}
                        bold
                        color="text-(--color-mint)"
                    />
                </div>

                {/* معلومات الدفع */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <CreditCard
                            size={18}
                            className="text-(--color-lavender)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("orders.details.paymentInfo")}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        <InfoCard
                            icon={CreditCard}
                            label={t("orders.details.paymentMethod")}
                            value={order.payment_method || "—"}
                            color="text-(--color-lavender) bg-(--color-lavender)/10"
                        />
                        <InfoCard
                            icon={CheckCircle2}
                            label={t("orders.details.paymentStatus")}
                            value={
                                order.payment_status ||
                                t("orders.details.paymentStatusUnset")
                            }
                            color="text-(--color-mint) bg-(--color-mint)/10"
                        />
                        <InfoCard
                            icon={DollarSign}
                            label={t("orders.details.amount")}
                            value={`${Number(
                                order.total || 0
                            ).toLocaleString()} ₪`}
                            color="text-(--color-amber) bg-(--color-amber)/10"
                        />
                    </div>

                    {order.notes && (
                        <div className="mt-4 rounded-lg border border-(--bg-border) bg-(--bg-main)/40 p-3">
                            <span className="text-xs font-bold text-(--text-muted)">
                                {t("orders.details.notes")}:
                            </span>
                            <p className="mt-1 text-sm text-(--text-secondary)">
                                {order.notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}