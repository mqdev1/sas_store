import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ShoppingCart,
    PlusIcon,
    Search,
    Filter,
    RefreshCw,
    DollarSign,
    Package,
    Clock,
} from "lucide-react";
import DataTable from "../SubComponents/DataTable";
import * as ordersService from "../../Services/ordersService";
import { supabase } from "../../lib/supabase";

// ============================================
// إعدادات الأعمدة
// ============================================
const buildColumns = (navigate, onDelete, t) => [
    {
        headerText: t("orders.table.id"),
        name: "id",
        sortable: true,
        width: 80,
        render: (row) => (
            <span className="font-mono text-xs font-medium text-(--color-lavender)">
                #{row.id}
            </span>
        ),
    },
    {
        headerText: t("orders.table.client"),
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
        headerText: t("orders.table.status"),
        name: "status",
        sortable: true,
        width: 130,
        render: (row) => {
            const STATUS = {
                pending: {
                    cls: "text-(--color-amber) bg-(--color-amber)/10",
                },
                processing: {
                    cls: "text-(--color-lavender) bg-(--color-lavender)/10",
                },
                shipped: {
                    cls: "text-(--color-lavender) bg-(--color-lavender)/10",
                },
                delivered: {
                    cls: "text-(--color-mint) bg-(--color-mint)/10",
                },
                cancelled: {
                    cls: "text-(--color-error) bg-(--color-error)/10",
                },
                refunded: {
                    cls: "text-(--color-pink) bg-(--color-pink)/10",
                },
            };
            const s = STATUS[row.status] || STATUS.pending;
            return (
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}
                >
                    {t(`orders.status.${row.status}`)}
                </span>
            );
        },
    },
    {
        headerText: t("orders.table.date"),
        name: "order_date",
        sortable: true,
        width: 120,
    },
    {
        headerText: t("orders.table.address"),
        name: "address",
        sortable: true,
        width: 200,
    },
    {
        headerText: t("orders.table.total"),
        name: "total",
        sortable: true,
        width: 120,
        render: (row) => (
            <span className="font-bold text-(--color-mint)">
                {Number(row.total).toLocaleString()} ₪
            </span>
        ),
    },
    {
        headerText: t("orders.table.options"),
        name: "events",
        width: 130,
        events: [
            {
                name: "on_preview",
                event: (row) => navigate(`/orders/${row.id}`),
            },
            {
                name: "on_edit",
                event: (row) => navigate(`/orders/${row.id}/edit`),
            },
            {
                name: "on_delete",
                event: onDelete,
            },
        ],
    },
];

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
export default function Orders() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [filterStatus, setFilterStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // ✅ debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    // ============================================
    // جلب البيانات
    // ============================================
    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [ordersRes, statsRes] = await Promise.all([
                ordersService.getAll({
                    search: debouncedSearch,
                    status: filterStatus !== "all" ? filterStatus : null,
                    pageSize: 500,
                }),
                ordersService.getStats(),
            ]);

            setOrders(ordersRes.data || []);
            setStats(statsRes);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filterStatus]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders, refreshKey]);

    // ✅ realtime
    useEffect(() => {
        const channel = supabase
            .channel("orders_list")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
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
        if (!confirm(t("orders.details.confirmDelete", { id: row.id })))
            return;
        try {
            await ordersService.remove(row.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(t("products.deleteFailed", { error: err.message }));
        }
    };

    const resetFilters = () => {
        setFilterStatus("all");
        setSearch("");
    };

    const columns = useMemo(
        () => buildColumns(navigate, handleDelete, t),
        [navigate, t]
    );

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <ShoppingCart
                            size={22}
                            className="text-(--color-amber)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("orders.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("orders.subtitle")}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                        <span>{t("orders.refresh")}</span>
                    </button>

                    <Link
                        to="/orders/new"
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <PlusIcon size={14} />
                        <span>{t("orders.newOrder")}</span>
                    </Link>
                </div>
            </div>

            {/* إحصائيات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label={t("orders.stats.total")}
                    value={(stats?.count || 0).toLocaleString()}
                    icon={ShoppingCart}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("orders.stats.revenue")}
                    value={`${(stats?.revenue || 0).toLocaleString()} ₪`}
                    icon={DollarSign}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("orders.stats.avgOrder")}
                    value={`${(stats?.avg || 0).toLocaleString()} ₪`}
                    icon={Package}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("orders.stats.pending")}
                    value={(stats?.pending || 0).toLocaleString()}
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
                        placeholder={t("orders.search")}
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
                            {t("orders.filterStatus")}
                        </option>
                        <option value="pending">
                            {t("orders.status.pending")}
                        </option>
                        <option value="processing">
                            {t("orders.status.processing")}
                        </option>
                        <option value="shipped">
                            {t("orders.status.shipped")}
                        </option>
                        <option value="delivered">
                            {t("orders.status.delivered")}
                        </option>
                        <option value="cancelled">
                            {t("orders.status.cancelled")}
                        </option>
                        <option value="refunded">
                            {t("orders.status.refunded")}
                        </option>
                    </select>
                </div>

                {(filterStatus !== "all" || search) && (
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs text-(--color-lavender) hover:underline"
                    >
                        {t("orders.clearFilters")}
                    </button>
                )}

                <div className="ms-auto text-xs text-(--text-muted)">
                    {!loading && (
                        <span>
                            {t("orders.results", { count: orders.length })}
                        </span>
                    )}
                </div>
            </div>

            {/* الجدول */}
            <div className="overflow-hidden overflow-x-auto rounded-xl border border-(--bg-border)">
                <DataTable
                    columns={columns}
                    data={orders}
                    loading={loading}
                    error={error}
                    multiselect={true}
                    selectAllPages={true}
                    exportFileName="orders"
                />
            </div>
        </>
    );
}