import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    CreditCard,
    PlusIcon,
    Search,
    Filter,
    DollarSign,
    Clock,
    TrendingUp,
    RefreshCw,
} from "lucide-react";
import DataTable from "../SubComponents/DataTable";
import * as paymentsService from "../../Services/paymentsService";
import { supabase } from "../../lib/supabase";

// ============================================
// ثوابت
// ============================================
const PAYMENT_STATUS_KEYS = [
    "pending",
    "processing",
    "completed",
    "failed",
    "refunded",
];

// مفاتيح طرق الدفع
const PAYMENT_METHOD_KEYS = ["card", "paypal", "bank", "cod", "wallet"];

// خريطة مفتاح الحالة → مفتاح الترجمة
const STATUS_KEY_MAP = {
    pending: "pending",
    processing: "processing",
    completed: "success",
    failed: "failed",
    refunded: "refunded",
};

// ============================================
// شارة الحالة
// ============================================
function StatusBadge({ status }) {
    const { t } = useTranslation();
    const STATUS = {
        completed: { cls: "text-(--color-mint) bg-(--color-mint)/10" },
        processing: {
            cls: "text-(--color-lavender) bg-(--color-lavender)/10",
        },
        pending: { cls: "text-(--color-amber) bg-(--color-amber)/10" },
        failed: { cls: "text-(--color-error) bg-(--color-error)/10" },
        refunded: { cls: "text-(--color-pink) bg-(--color-pink)/10" },
    };
    const key = STATUS_KEY_MAP[status] || "pending";
    const s = STATUS[status] || STATUS.pending;
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}
        >
            {t(`payments.status.${key}`)}
        </span>
    );
}

// ============================================
// بطاقة إحصائية
// ============================================
function StatCard({ label, value, icon: Icon, color, loading }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-(--bg-border) bg-(--bg-card) p-3 shadow-xs">
            <div className={`rounded-lg p-2 ${color}`}>
                <Icon size={18} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-(--text-muted)">{label}</span>
                {loading ? (
                    <div className="mt-1 h-5 w-16 animate-pulse rounded bg-(--bg-hover)" />
                ) : (
                    <span className="text-lg font-bold text-(--text-primary)">
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function Payments() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterMethod, setFilterMethod] = useState("all");

    // ✅ debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    // ============================================
    // جلب
    // ============================================
    const loadPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [paymentsRes, statsRes] = await Promise.all([
                paymentsService.getAll({
                    search: debouncedSearch,
                    status: filterStatus !== "all" ? filterStatus : null,
                    method: filterMethod !== "all" ? filterMethod : null,
                    pageSize: 500,
                }),
                paymentsService.getStats(),
            ]);

            setPayments(paymentsRes.data || []);
            setStats(statsRes);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filterStatus, filterMethod]);

    useEffect(() => {
        loadPayments();
    }, [loadPayments, refreshKey]);

    // ✅ realtime
    useEffect(() => {
        const channel = supabase
            .channel("payments_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "payments" },
                () => setRefreshKey((k) => k + 1)
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // ============================================
    // حذف
    // ============================================
    const handleDelete = async (row) => {
        if (
            !confirm(
                t("payments.confirmDelete", {
                    tx: row.transaction_id,
                })
            )
        )
            return;
        try {
            await paymentsService.remove(row.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("payments.deleteFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // الأعمدة
    // ============================================
    const columns = useMemo(
        () => [
            {
                headerText: t("payments.table.transaction"),
                name: "transaction_id",
                sortable: true,
                width: 150,
                render: (row) => (
                    <span className="font-mono text-xs font-medium text-(--color-lavender)">
                        {row.transaction_id}
                    </span>
                ),
            },
            {
                headerText: t("payments.table.client"),
                name: "client_name",
                sortable: true,
                width: 180,
                render: (row) => (
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-lavender) text-xs font-bold text-white">
                            {(row.client_name || "?")[0]}
                        </div>
                        <span className="font-medium text-(--text-primary)">
                            {row.client_name || "—"}
                        </span>
                    </div>
                ),
            },
            {
                headerText: t("payments.table.method"),
                name: "method",
                sortable: true,
                width: 150,
                render: (row) =>
                    t(`payments.methods.${row.method}`, {
                        defaultValue: row.method,
                    }),
            },
            {
                headerText: t("payments.table.amount"),
                name: "amount",
                sortable: true,
                width: 130,
                render: (row) => (
                    <span className="font-semibold text-(--text-primary)">
                        {Number(row.amount).toLocaleString(i18n.language)}{" "}
                        {row.currency || "₪"}
                    </span>
                ),
            },
            {
                headerText: t("payments.table.fee"),
                name: "fee",
                sortable: true,
                width: 110,
                render: (row) => (
                    <span className="text-xs text-(--text-muted)">
                        {Number(row.fee).toLocaleString(i18n.language)}{" "}
                        {row.currency || "₪"}
                    </span>
                ),
            },
            {
                headerText: t("payments.table.net"),
                name: "net",
                sortable: true,
                width: 130,
                render: (row) => (
                    <span className="font-medium text-(--color-mint)">
                        {Number(row.net).toLocaleString(i18n.language)}{" "}
                        {row.currency || "₪"}
                    </span>
                ),
            },
            {
                headerText: t("payments.table.status"),
                name: "status",
                sortable: true,
                width: 130,
                render: (row) => <StatusBadge status={row.status} />,
            },
            {
                headerText: t("payments.table.date"),
                name: "created_at",
                sortable: true,
                width: 120,
                render: (row) =>
                    row.created_at
                        ? new Date(row.created_at).toLocaleDateString(
                            i18n.language === "ar" ? "ar-EG" : "en-US"
                        )
                        : "—",
            },
            {
                headerText: t("payments.table.options"),
                name: "events",
                width: 130,
                events: [
                    {
                        name: "on_preview",
                        event: (row) => navigate(`/payments/${row.id}`),
                    },
                    {
                        name: "on_edit",
                        event: (row) =>
                            navigate(`/payments/${row.id}/edit`),
                    },
                    {
                        name: "on_delete",
                        event: handleDelete,
                    },
                ],
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [navigate, t, i18n.language]
    );

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <CreditCard
                            size={22}
                            className="text-(--color-mint)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("payments.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("payments.subtitle")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setRefreshKey((k) => k + 1)}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender) disabled:opacity-50"
                    >
                        <RefreshCw
                            size={14}
                            className={loading ? "animate-spin" : ""}
                        />
                        <span>{t("payments.refresh")}</span>
                    </button>

                    <Link
                        to="/payments/new"
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <PlusIcon size={15} />
                        <span>{t("payments.newPayment")}</span>
                    </Link>
                </div>
            </div>

            {/* إحصائيات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label={t("payments.stats.total")}
                    value={(stats?.total || 0).toLocaleString(i18n.language)}
                    icon={CreditCard}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("payments.stats.totalAmount")}
                    value={`${(stats?.totalAmount || 0).toLocaleString(
                        i18n.language
                    )} ₪`}
                    icon={DollarSign}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("payments.stats.successRate")}
                    value={`${stats?.successRate || 0}%`}
                    icon={TrendingUp}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("payments.stats.totalFees")}
                    value={`${(stats?.totalFees || 0).toLocaleString(
                        i18n.language
                    )} ₪`}
                    icon={Clock}
                    color="text-(--color-pink) bg-(--color-pink)/10"
                    loading={loading}
                />
            </div>

            {/* فلاتر */}
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-(--bg-border) bg-(--bg-card) p-3">
                <div className="relative flex flex-1 items-center md:max-w-xs">
                    <Search
                        size={16}
                        className="pointer-events-none absolute inset-s-3 text-(--text-muted)"
                    />
                    <input
                        type="search"
                        placeholder={t("payments.search")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-(--bg-border) bg-(--bg-main) p-2 ps-9 text-sm text-(--text-primary) outline-0 transition-colors placeholder:text-(--text-muted) focus:border-(--color-lavender)"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={15} className="text-(--text-muted)" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-lg border border-(--bg-border) bg-(--bg-main) px-3 py-1.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                    >
                        <option value="all">
                            {t("payments.filterStatus")}
                        </option>
                        {PAYMENT_STATUS_KEYS.map((key) => (
                            <option key={key} value={key}>
                                {t(
                                    `payments.status.${STATUS_KEY_MAP[key]}`
                                )}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterMethod}
                        onChange={(e) => setFilterMethod(e.target.value)}
                        className="rounded-lg border border-(--bg-border) bg-(--bg-main) px-3 py-1.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                    >
                        <option value="all">
                            {t("payments.filterMethod")}
                        </option>
                        {PAYMENT_METHOD_KEYS.map((key) => (
                            <option key={key} value={key}>
                                {t(`payments.methods.${key}`)}
                            </option>
                        ))}
                    </select>
                </div>

                {(filterStatus !== "all" ||
                    filterMethod !== "all" ||
                    search) && (
                        <button
                            type="button"
                            onClick={() => {
                                setFilterStatus("all");
                                setFilterMethod("all");
                                setSearch("");
                            }}
                            className="text-xs text-(--color-lavender) hover:underline"
                        >
                            {t("payments.clearFilters")}
                        </button>
                    )}
            </div>

            {/* الجدول */}
            <div className="overflow-hidden overflow-x-auto rounded-xl border border-(--bg-border)">
                <DataTable
                    columns={columns}
                    data={payments}
                    loading={loading}
                    error={error}
                    multiselect={true}
                    selectAllPages={true}
                    exportFileName="payments"
                />
            </div>
        </>
    );
}