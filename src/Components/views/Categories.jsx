import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    FolderTree,
    PlusIcon,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    RefreshCw,
} from "lucide-react";
import DataTable from "../SubComponents/DataTable";
import * as categoriesService from "../../Services/categoriesService";
import { supabase } from "../../lib/supabase";

// ============================================
// شارة الحالة
// ============================================
function StatusBadge({ isActive }) {
    const { t } = useTranslation();
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isActive
                    ? "text-(--color-mint) bg-(--color-mint)/10"
                    : "text-(--text-muted) bg-(--bg-hover)"
            }`}
        >
            {isActive
                ? t("categories.details.active")
                : t("categories.details.inactive")}
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
                    <div className="mt-1 h-5 w-12 animate-pulse rounded bg-(--bg-hover)" />
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
export default function Categories() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    // ============================================
    // جلب
    // ============================================
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [catsRes, statsRes] = await Promise.all([
                categoriesService.getAll({
                    search: debouncedSearch,
                    isActive:
                        filterStatus === "all"
                            ? null
                            : filterStatus === "active",
                    pageSize: 500,
                }),
                categoriesService.getStats(),
            ]);

            setCategories(catsRes.data || []);
            setStats(statsRes);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filterStatus]);

    useEffect(() => {
        loadData();
    }, [loadData, refreshKey]);

    // realtime
    useEffect(() => {
        const channel = supabase
            .channel("categories_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "categories" },
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
        if (!confirm(t("categories.confirmDelete", { name: row.name })))
            return;
        try {
            await categoriesService.remove(row.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("categories.deleteFailed", {
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
                headerText: t("categories.table.id"),
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
                headerText: t("categories.table.name"),
                name: "name",
                sortable: true,
                width: 220,
                render: (row) => (
                    <div className="flex items-center gap-2">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                            style={{
                                background: `${row.color}20`,
                                color: row.color || "#6366F1",
                            }}
                        >
                            <FolderTree size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-(--text-primary)">
                                {row.name}
                            </span>
                            {row.slug && (
                                <span className="text-xs text-(--text-muted)">
                                    /{row.slug}
                                </span>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                headerText: t("categories.table.description"),
                name: "description",
                sortable: false,
                width: 250,
                render: (row) => (
                    <span className="text-xs text-(--text-muted)">
                        {row.description
                            ? row.description.length > 50
                                ? row.description.slice(0, 50) + "..."
                                : row.description
                            : "—"}
                    </span>
                ),
            },
            {
                headerText: t("categories.table.color"),
                name: "color",
                width: 80,
                render: (row) => (
                    <div className="flex items-center gap-2">
                        <div
                            className="h-5 w-5 rounded-full border border-(--bg-border)"
                            style={{ background: row.color || "#6366F1" }}
                        />
                        <span className="text-xs text-(--text-muted)">
                            {row.color}
                        </span>
                    </div>
                ),
            },
            {
                headerText: t("categories.table.sortOrder"),
                name: "sort_order",
                sortable: true,
                width: 90,
            },
            {
                headerText: t("categories.table.status"),
                name: "is_active",
                sortable: true,
                width: 110,
                render: (row) => <StatusBadge isActive={row.is_active} />,
            },
            {
                headerText: t("categories.table.options"),
                name: "events",
                width: 130,
                events: [
                    {
                        name: "on_preview",
                        event: (row) => navigate(`/categories/${row.id}`),
                    },
                    {
                        name: "on_edit",
                        event: (row) =>
                            navigate(`/categories/${row.id}/edit`),
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
                        <FolderTree
                            size={22}
                            className="text-(--color-lavender)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("categories.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("categories.subtitle")}
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
                        <span>{t("categories.refresh")}</span>
                    </button>

                    <Link
                        to="/categories/new"
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <PlusIcon size={15} />
                        <span>{t("categories.newCategory")}</span>
                    </Link>
                </div>
            </div>

            {/* إحصائيات */}
            <div className="mb-4 grid gap-3 md:grid-cols-3">
                <StatCard
                    label={t("categories.stats.total")}
                    value={stats?.total || 0}
                    icon={FolderTree}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("categories.stats.active")}
                    value={stats?.active || 0}
                    icon={CheckCircle2}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("categories.stats.inactive")}
                    value={stats?.inactive || 0}
                    icon={XCircle}
                    color="text-(--text-muted) bg-(--bg-hover)"
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
                        placeholder={t("categories.search")}
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
                            {t("categories.filterStatus")}
                        </option>
                        <option value="active">
                            {t("categories.filterActive")}
                        </option>
                        <option value="inactive">
                            {t("categories.filterInactive")}
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
                        {t("categories.clearFilters")}
                    </button>
                )}
            </div>

            {/* الجدول */}
            <div className="overflow-hidden overflow-x-auto rounded-xl border border-(--bg-border)">
                <DataTable
                    columns={columns}
                    data={categories}
                    loading={loading}
                    error={error}
                    multiselect={true}
                    selectAllPages={true}
                    exportFileName="categories"
                >
                    <Link
                        to="/categories/new"
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-xs font-medium text-(--text-secondary) transition-colors hover:bg-(--color-lavender) hover:text-(--bg-elevated)"
                    >
                        <PlusIcon size={13} />
                        <span>{t("categories.newCategory")}</span>
                    </Link>
                </DataTable>
            </div>
        </>
    );
}