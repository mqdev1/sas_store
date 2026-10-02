import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Truck,
    PlusIcon,
    Search,
    Filter,
    Package,
    CheckCircle2,
    Clock,
    DollarSign,
    RefreshCw,
} from "lucide-react";
import DataTable from "../SubComponents/DataTable";
import * as shippingService from "../../Services/shippingService";
import { supabase } from "../../lib/supabase";

// ============================================
// ثوابت
// ============================================
const SHIPPING_STATUS_KEYS = [
    "preparing",
    "shipped",
    "in_transit",
    "delivered",
    "delayed",
    "cancelled",
];

const CARRIERS = ["Aramex", "DHL", "FedEx", "UPS", "Local Express"];

// مفاتيح طرق الشحن (بحسب النظام الجديد)
const SHIPPING_METHOD_KEYS = ["normal", "express", "same_day", "pickup"];

// ============================================
// خريطة مفاتيح الحالة → مفاتيح الترجمة
// ============================================
const STATUS_KEY_MAP = {
    preparing: "preparing",
    shipped: "shipped",
    in_transit: "in_transit",
    delivered: "delivered",
    delayed: "delayed",
    cancelled: "cancelled",
};

// ============================================
// شارة الحالة
// ============================================
function StatusBadge({ status }) {
    const { t } = useTranslation();
    const STATUS = {
        preparing: {
            cls: "text-(--color-pink) bg-(--color-pink)/10",
        },
        shipped: {
            cls: "text-(--color-amber) bg-(--color-amber)/10",
        },
        in_transit: {
            cls: "text-(--color-lavender) bg-(--color-lavender)/10",
        },
        delivered: {
            cls: "text-(--color-mint) bg-(--color-mint)/10",
        },
        delayed: {
            cls: "text-(--color-error) bg-(--color-error)/10",
        },
        cancelled: {
            cls: "text-(--text-muted) bg-(--bg-hover)",
        },
    };
    const key = STATUS_KEY_MAP[status] || "preparing";
    const s = STATUS[status] || STATUS.preparing;
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}
        >
            {t(`shipping.status.${key}`)}
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
export default function Shipping() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [shipments, setShipments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterCarrier, setFilterCarrier] = useState("all");

    // ✅ debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    // ============================================
    // جلب
    // ============================================
    const loadShipments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [shipmentsRes, statsRes] = await Promise.all([
                shippingService.getAll({
                    search: debouncedSearch,
                    status: filterStatus !== "all" ? filterStatus : null,
                    carrier: filterCarrier !== "all" ? filterCarrier : null,
                    pageSize: 500,
                }),
                shippingService.getStats(),
            ]);

            setShipments(shipmentsRes.data || []);
            setStats(statsRes);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filterStatus, filterCarrier]);

    useEffect(() => {
        loadShipments();
    }, [loadShipments, refreshKey]);

    // ✅ realtime
    useEffect(() => {
        const channel = supabase
            .channel("shipments_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "shipments" },
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
                t("shipping.confirmDelete", {
                    tracking: row.tracking_number,
                })
            )
        )
            return;
        try {
            await shippingService.remove(row.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("shipping.deleteFailed", {
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
                headerText: t("shipping.table.tracking"),
                name: "tracking_number",
                sortable: true,
                width: 140,
                render: (row) => (
                    <span className="font-mono text-xs font-medium text-(--color-lavender)">
                        {row.tracking_number}
                    </span>
                ),
            },
            {
                headerText: t("shipping.table.client"),
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
                headerText: t("shipping.table.city"),
                name: "city",
                sortable: true,
                width: 120,
            },
            {
                headerText: t("shipping.table.carrier"),
                name: "carrier",
                sortable: true,
                width: 130,
            },
            {
                headerText: t("shipping.table.method"),
                name: "method",
                sortable: true,
                width: 130,
                render: (row) => {
                    const key = row.method;
                    return t(`shipping.methods.${key}`, {
                        defaultValue: row.method,
                    });
                },
            },
            {
                headerText: t("shipping.table.weight"),
                name: "weight",
                sortable: true,
                width: 100,
                render: (row) =>
                    `${Number(row.weight).toFixed(2)} ${t(
                        "shipping.details.weightUnit"
                    )}`,
            },
            {
                headerText: t("shipping.table.cost"),
                name: "cost",
                sortable: true,
                width: 120,
                render: (row) => (
                    <span className="font-medium text-(--color-mint)">
                        {Number(row.cost).toLocaleString(i18n.language)} ₪
                    </span>
                ),
            },
            {
                headerText: t("shipping.table.status"),
                name: "status",
                sortable: true,
                width: 130,
                render: (row) => <StatusBadge status={row.status} />,
            },
            {
                headerText: t("shipping.table.shippedAt"),
                name: "shipped_at",
                sortable: true,
                width: 130,
            },
            {
                headerText: t("shipping.table.options"),
                name: "events",
                width: 130,
                events: [
                    {
                        name: "on_preview",
                        event: (row) => navigate(`/shipping/${row.id}`),
                    },
                    {
                        name: "on_edit",
                        event: (row) =>
                            navigate(`/shipping/${row.id}/edit`),
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
                        <Truck
                            size={22}
                            className="text-(--color-amber)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("shipping.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("shipping.subtitle")}
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
                        <span>{t("shipping.refresh")}</span>
                    </button>

                    <Link
                        to="/shipping/new"
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <PlusIcon size={15} />
                        <span>{t("shipping.newShipment")}</span>
                    </Link>
                </div>
            </div>

            {/* إحصائيات */}
            <div className="mb-4 grid gap-3 md:grid-cols-4">
                <StatCard
                    label={t("shipping.stats.total")}
                    value={(stats?.total || 0).toLocaleString(i18n.language)}
                    icon={Package}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("shipping.stats.delivered")}
                    value={`${stats?.delivered || 0} (${
                        stats?.deliveryRate || 0
                    }%)`}
                    icon={CheckCircle2}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("shipping.stats.inTransit")}
                    value={(stats?.inTransit || 0).toLocaleString(
                        i18n.language
                    )}
                    icon={Clock}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("shipping.stats.totalCost")}
                    value={`${(stats?.totalCost || 0).toLocaleString(
                        i18n.language
                    )} ₪`}
                    icon={DollarSign}
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
                        placeholder={t("shipping.search")}
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
                            {t("shipping.filterStatus")}
                        </option>
                        {SHIPPING_STATUS_KEYS.map((key) => (
                            <option key={key} value={key}>
                                {t(`shipping.status.${key}`)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterCarrier}
                        onChange={(e) => setFilterCarrier(e.target.value)}
                        className="rounded-lg border border-(--bg-border) bg-(--bg-main) px-3 py-1.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                    >
                        <option value="all">
                            {t("shipping.filterCarrier")}
                        </option>
                        {CARRIERS.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                {(filterStatus !== "all" ||
                    filterCarrier !== "all" ||
                    search) && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilterStatus("all");
                            setFilterCarrier("all");
                            setSearch("");
                        }}
                        className="text-xs text-(--color-lavender) hover:underline"
                    >
                        {t("shipping.clearFilters")}
                    </button>
                )}
            </div>

            {/* الجدول */}
            <div className="overflow-hidden overflow-x-auto rounded-xl border border-(--bg-border)">
                <DataTable
                    columns={columns}
                    data={shipments}
                    loading={loading}
                    error={error}
                    multiselect={true}
                    selectAllPages={true}
                    exportFileName="shipments"
                />
            </div>
        </>
    );
}