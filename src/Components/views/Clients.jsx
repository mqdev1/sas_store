import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Users,
    PlusIcon,
    Search,
    Filter,
    UserCheck,
    UserX,
    DollarSign,
    RefreshCw,
} from "lucide-react";
import DataTable from "../SubComponents/DataTable";
import * as clientsService from "../../Services/clientsService";
import { supabase } from "../../lib/supabase";

// ============================================
// شارة الحالة
// ============================================
function StatusBadge({ status }) {
    const { t } = useTranslation();
    const isActive = status === "active" || status === "نشط";
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isActive
                    ? "text-(--color-mint) bg-(--color-mint)/10"
                    : "text-(--text-muted) bg-(--bg-hover)"
            }`}
        >
            {isActive
                ? t("clients.details.active")
                : t("clients.details.inactive")}
        </span>
    );
}

// ============================================
// أفاتار
// ============================================
function Avatar({ name, color = "#6366F1" }) {
    return (
        <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: color }}
        >
            {(name || "?")[0]}
        </div>
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
export default function Clients() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // ✅ debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    // ============================================
    // جلب
    // ============================================
    const loadClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [clientsRes, statsRes] = await Promise.all([
                clientsService.getAll({
                    search: debouncedSearch,
                    status: filterStatus !== "all" ? filterStatus : null,
                    pageSize: 500,
                }),
                clientsService.getStats(),
            ]);

            setClients(clientsRes.data || []);
            setStats(statsRes);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filterStatus]);

    useEffect(() => {
        loadClients();
    }, [loadClients, refreshKey]);

    // ✅ realtime
    useEffect(() => {
        const channel = supabase
            .channel("clients_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "clients" },
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
        if (!confirm(t("clients.confirmDelete", { name: row.name }))) return;
        try {
            await clientsService.remove(row.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("clients.deleteFailed", {
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
                headerText: t("clients.table.id"),
                name: "id",
                sortable: true,
                width: 70,
                render: (row) => (
                    <span className="font-mono text-xs text-(--color-lavender)">
                        #{row.id}
                    </span>
                ),
            },
            {
                headerText: t("clients.table.name"),
                name: "name",
                sortable: true,
                width: 200,
                render: (row) => (
                    <div className="flex items-center gap-2">
                        <Avatar name={row.name} color={row.color} />
                        <span className="font-medium text-(--text-primary)">
                            {row.name}
                        </span>
                    </div>
                ),
            },
            {
                headerText: t("clients.table.email"),
                name: "email",
                sortable: true,
                width: 200,
            },
            {
                headerText: t("clients.table.phone"),
                name: "phone",
                sortable: true,
                width: 140,
            },
            {
                headerText: t("clients.table.city"),
                name: "city",
                sortable: true,
                width: 120,
            },
            {
                headerText: t("clients.table.orders"),
                name: "orders",
                sortable: true,
                width: 100,
                render: (row) => Number(row.orders).toLocaleString(),
            },
            {
                headerText: t("clients.table.spent"),
                name: "spent",
                sortable: true,
                width: 140,
                render: (row) => (
                    <span className="font-medium text-(--color-mint)">
                        {Number(row.spent).toLocaleString()} ₪
                    </span>
                ),
            },
            {
                headerText: t("clients.table.status"),
                name: "status",
                sortable: true,
                width: 110,
                render: (row) => <StatusBadge status={row.status} />,
            },
            {
                headerText: t("clients.table.options"),
                name: "events",
                width: 130,
                events: [
                    {
                        name: "on_preview",
                        event: (row) => navigate(`/clients/${row.id}`),
                    },
                    {
                        name: "on_edit",
                        event: (row) =>
                            navigate(`/clients/${row.id}/edit`),
                    },
                    {
                        name: "on_delete",
                        event: handleDelete,
                    },
                ],
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [navigate, t]
    );

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <Users
                            size={22}
                            className="text-(--color-lavender)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("clients.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("clients.subtitle")}
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
                        <span>{t("clients.refresh")}</span>
                    </button>

                    <Link
                        to="/clients/new"
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <PlusIcon size={15} />
                        <span>{t("clients.newClient")}</span>
                    </Link>
                </div>
            </div>

            {/* إحصائيات */}
            <div className="mb-4 grid gap-3 md:grid-cols-4">
                <StatCard
                    label={t("clients.stats.total")}
                    value={(stats?.count || 0).toLocaleString()}
                    icon={Users}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("clients.stats.active")}
                    value={(stats?.active || 0).toLocaleString()}
                    icon={UserCheck}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("clients.stats.inactive")}
                    value={(stats?.inactive || 0).toLocaleString()}
                    icon={UserX}
                    color="text-(--text-muted) bg-(--bg-hover)"
                    loading={loading}
                />
                <StatCard
                    label={t("clients.stats.totalSpent")}
                    value={`${(stats?.totalSpent || 0).toLocaleString()} ₪`}
                    icon={DollarSign}
                    color="text-(--color-amber) bg-(--color-amber)/10"
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
                        placeholder={t("clients.search")}
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
                        className="rounded-lg border border-(--bg-border) bg-(--bg-main) px-3 py-1.5 text-sm text-(--text-primary) outline-0 transition-colors focus:border-(--color-lavender)"
                    >
                        <option value="all">
                            {t("clients.filterStatus")}
                        </option>
                        <option value="active">
                            {t("clients.filterActive")}
                        </option>
                        <option value="inactive">
                            {t("clients.filterInactive")}
                        </option>
                    </select>
                </div>

                {(filterStatus !== "all" || search) && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilterStatus("all");
                            setSearch("");
                        }}
                        className="text-xs text-(--color-lavender) hover:underline"
                    >
                        {t("clients.clearFilters")}
                    </button>
                )}
            </div>

            {/* الجدول */}
            <div className="overflow-hidden overflow-x-auto rounded-xl border border-(--bg-border)">
                <DataTable
                    columns={columns}
                    data={clients}
                    loading={loading}
                    error={error}
                    multiselect={true}
                    selectAllPages={true}
                    exportFileName="clients"
                >
                    <Link
                        to="/clients/new"
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-xs font-medium text-(--text-secondary) transition-colors hover:bg-(--color-lavender) hover:text-(--bg-elevated)"
                    >
                        <PlusIcon size={13} />
                        <span>{t("clients.add")}</span>
                    </Link>
                </DataTable>
            </div>
        </>
    );
}