import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ShoppingBasket,
    RefreshCw,
    Trash,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import DataTable from "../SubComponents/DataTable";
import * as ordersService from "../../Services/ordersService";
import { supabase } from "../../lib/supabase";

// ============================================
// الأعمدة
// ============================================
const buildColumns = (t, onRestore, onDelete, i18n) => [
    {
        headerText: t("orders.table.id"),
        name: "id",
        sortable: true,
        render: (row) => (
            <span className="font-mono text-xs text-(--color-lavender)">
                #{row.id}
            </span>
        ),
    },
    {
        headerText: t("orders.table.client"),
        name: "client_name",
        sortable: true,
    },
    {
        headerText: t("orders.table.address"),
        name: "address",
        sortable: true,
    },
    {
        headerText: t("orders.table.date"),
        name: "order_date",
        sortable: true,
    },
    {
        headerText: t("orders.table.total"),
        name: "total",
        sortable: true,
        render: (row) => (
            <span className="font-bold text-(--color-mint)">
                {Number(row.total).toLocaleString(i18n.language)} ₪
            </span>
        ),
    },
    {
        headerText: t("orders.table.options"),
        name: "events",
        events: [
            { name: "on_restore", event: onRestore },
            { name: "on_delete", event: onDelete },
        ],
    },
];

// ============================================
// بطاقة إحصائية
// ============================================
function Stat({ label, value, color, icon: Icon, loading }) {
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
export default function OrdersCancel() {
    const { t, i18n } = useTranslation();

    const [cancelled, setCancelled] = useState([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [bulkLoading, setBulkLoading] = useState(false);

    // ============================================
    // جلب الطلبات الملغية
    // ============================================
    const loadCancelled = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [cancelledRes, allRes] = await Promise.all([
                ordersService.getAll({
                    status: "cancelled",
                    pageSize: 500,
                }),
                supabase
                    .from("orders")
                    .select("*", { count: "exact", head: true }),
            ]);

            setCancelled(cancelledRes.data || []);
            setTotalOrders(allRes.count || 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCancelled();
    }, [loadCancelled, refreshKey]);

    // realtime
    useEffect(() => {
        const channel = supabase
            .channel("orders_cancelled")
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
    // استعادة
    // ============================================
    const handleRestore = async (row) => {
        if (!confirm(t("orders.cancel.confirmRestore", { id: row.id })))
            return;
        try {
            await ordersService.restore(row.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("orders.cancel.restoreFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // حذف
    // ============================================
    const handleDelete = async (row) => {
        if (!confirm(t("orders.cancel.confirmDeleteOne", { id: row.id })))
            return;
        try {
            await ordersService.remove(row.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("orders.deleteFailed", { error: err.message || "" })
            );
        }
    };

    // ============================================
    // استعادة الكل
    // ============================================
    const restoreAll = async () => {
        if (
            !confirm(
                t("orders.cancel.confirmRestoreAll", {
                    count: cancelled.length,
                })
            )
        )
            return;

        setBulkLoading(true);
        try {
            const ids = cancelled.map((o) => o.id);
            await Promise.all(ids.map((id) => ordersService.restore(id)));
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("orders.cancel.bulkFailed", {
                    error: err.message || "",
                })
            );
        } finally {
            setBulkLoading(false);
        }
    };

    // ============================================
    // حذف الكل
    // ============================================
    const deleteAll = async () => {
        if (
            !confirm(
                t("orders.cancel.confirmDeleteAll", {
                    count: cancelled.length,
                })
            )
        )
            return;
        if (!confirm(t("orders.cancel.confirmDeleteAllSecond"))) return;

        setBulkLoading(true);
        try {
            const ids = cancelled.map((o) => o.id);
            await ordersService.removeMany(ids);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("orders.cancel.bulkFailed", {
                    error: err.message || "",
                })
            );
        } finally {
            setBulkLoading(false);
        }
    };

    const totalLost = useMemo(
        () =>
            Math.round(
                cancelled.reduce((s, o) => s + Number(o.total || 0), 0)
            ),
        [cancelled]
    );

    const cancelledRate = useMemo(
        () =>
            totalOrders > 0
                ? ((cancelled.length / totalOrders) * 100).toFixed(1)
                : "0.0",
        [cancelled.length, totalOrders]
    );

    const columns = useMemo(
        () => buildColumns(t, handleRestore, handleDelete, i18n),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [i18n.language]
    );

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <ShoppingBasket
                            size={22}
                            className="text-(--color-pink)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("orders.cancel.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("orders.cancel.subtitle")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={restoreAll}
                        disabled={cancelled.length === 0 || bulkLoading}
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender) disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {bulkLoading ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <RefreshCw size={15} />
                        )}
                        <span>{t("orders.cancel.restoreAll")}</span>
                    </button>

                    <Link
                        to="/orders"
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <ShoppingBasket size={15} />
                        <span>{t("orders.cancel.viewActive")}</span>
                    </Link>
                </div>
            </div>

            {/* إحصائيات */}
            <div className="mb-4 grid gap-3 md:grid-cols-3">
                <Stat
                    label={t("orders.cancel.stats.count")}
                    value={cancelled.length.toLocaleString(i18n.language)}
                    color="text-(--color-pink) bg-(--color-pink)/10"
                    icon={AlertTriangle}
                    loading={loading}
                />
                <Stat
                    label={t("orders.cancel.stats.loss")}
                    value={`${totalLost.toLocaleString(i18n.language)} ₪`}
                    color="text-(--color-error) bg-(--color-error)/10"
                    icon={Trash}
                    loading={loading}
                />
                <Stat
                    label={t("orders.cancel.stats.rate")}
                    value={`${cancelledRate}%`}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                    icon={ShoppingBasket}
                    loading={loading}
                />
            </div>

            {/* تحذير */}
            {cancelled.length > 0 && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-(--color-amber)/40 bg-(--color-amber)/5 p-3 text-sm">
                    <AlertTriangle
                        size={18}
                        className="shrink-0 text-(--color-amber)"
                    />
                    <span className="text-(--text-primary)">
                        {t("orders.cancel.warning")}
                    </span>
                </div>
            )}

            {/* الجدول */}
            <div className="overflow-hidden overflow-x-auto rounded-xl border border-(--bg-border)">
                <DataTable
                    columns={columns}
                    data={cancelled}
                    loading={loading}
                    error={error}
                    multiselect={true}
                    selectAllPages={true}
                    exportFileName="cancelled-orders"
                >
                    <button
                        type="button"
                        onClick={deleteAll}
                        disabled={cancelled.length === 0 || bulkLoading}
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-xs font-medium text-(--color-error) transition-colors hover:bg-(--color-error) hover:text-white disabled:opacity-50"
                    >
                        <Trash size={13} />
                        <span>{t("orders.cancel.deleteAll")}</span>
                    </button>
                </DataTable>
            </div>
        </>
    );
}