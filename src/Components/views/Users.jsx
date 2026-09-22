import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Users as UsersIcon,
    UserPlus,
    Search,
    Filter,
    UserCheck,
    Shield,
    UserX,
    RefreshCw,
} from "lucide-react";
import DataTable from "../SubComponents/DataTable";
import * as usersService from "../../Services/usersService";
import {
    ROLES,
    getUserStatusColor,
    getRoleColor,
} from "../../data/usersData";
import { supabase } from "../../lib/supabase";

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
// شارة الحالة
// ============================================
function StatusBadge({ status }) {
    const { t } = useTranslation();
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getUserStatusColor(
                status
            )}`}
        >
            {status === "active"
                ? t("users.status.active")
                : t("users.status.inactive")}
        </span>
    );
}

// ============================================
// شارة الدور
// ============================================
function RoleBadge({ role }) {
    const { t } = useTranslation();
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(
                role
            )}`}
        >
            {t(`users.roles.${role}`, { defaultValue: role })}
        </span>
    );
}

// ============================================
// الصفحة
// ============================================
export default function Users() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // ✅ debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    // ============================================
    // جلب
    // ============================================
    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersRes, statsRes] = await Promise.all([
                usersService.getAll({
                    search: debouncedSearch,
                    role: filterRole !== "all" ? filterRole : null,
                    status: filterStatus !== "all" ? filterStatus : null,
                    pageSize: 500,
                }),
                usersService.getStats(),
            ]);

            setUsers(usersRes.data || []);
            setStats(statsRes);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filterRole, filterStatus]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers, refreshKey]);

    // ✅ realtime
    useEffect(() => {
        const channel = supabase
            .channel("users_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "profiles" },
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
        if (!confirm(t("users.confirmDelete", { name: row.name }))) return;
        try {
            await usersService.remove(row.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(
                t("users.deleteFailed", {
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
                headerText: t("users.table.name"),
                name: "name",
                sortable: true,
                width: 220,
                render: (row) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-lavender) text-sm font-bold text-white">
                            {(row.name || "?")[0]}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-(--text-primary)">
                                {row.name}
                            </span>
                            <span className="text-xs text-(--text-muted)">
                                @{row.username || "—"}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                headerText: t("users.table.email"),
                name: "email",
                sortable: true,
                width: 220,
            },
            {
                headerText: t("users.table.role"),
                name: "role",
                sortable: true,
                width: 130,
                render: (row) => <RoleBadge role={row.role} />,
            },
            {
                headerText: t("users.table.permissions"),
                name: "permissions",
                width: 110,
                render: (row) => (
                    <span className="inline-flex items-center gap-1 rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs font-medium text-(--text-secondary)">
                        <Shield size={11} />
                        {(row.permissions || []).length}
                    </span>
                ),
            },
            {
                headerText: t("users.table.status"),
                name: "status",
                sortable: true,
                width: 110,
                render: (row) => <StatusBadge status={row.status} />,
            },
            {
                headerText: t("users.table.lastLogin"),
                name: "last_login",
                sortable: true,
                width: 160,
                render: (row) => {
                    if (!row.last_login)
                        return (
                            <span className="text-xs text-(--text-muted)">
                                —
                            </span>
                        );
                    const d = new Date(row.last_login);
                    const locale =
                        i18n.language === "ar" ? "ar-EG" : "en-US";
                    return (
                        <span className="text-xs text-(--text-muted)">
                            {d.toLocaleDateString(locale)}{" "}
                            {d.toLocaleTimeString(locale, {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    );
                },
            },
            {
                headerText: t("users.table.options"),
                name: "events",
                width: 130,
                events: [
                    {
                        name: "on_preview",
                        event: (row) => navigate(`/users/${row.id}`),
                    },
                    {
                        name: "on_edit",
                        event: (row) => navigate(`/users/${row.id}/edit`),
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
                        <UsersIcon
                            size={22}
                            className="text-(--color-lavender)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("users.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("users.subtitle")}
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
                        <span>{t("users.refresh")}</span>
                    </button>

                    <Link
                        to="/users/new"
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <UserPlus size={15} />
                        <span>{t("users.newUser")}</span>
                    </Link>
                </div>
            </div>

            {/* إحصائيات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label={t("users.stats.total")}
                    value={stats?.total || 0}
                    icon={UsersIcon}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("users.stats.active")}
                    value={stats?.active || 0}
                    icon={UserCheck}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("users.stats.inactive")}
                    value={stats?.inactive || 0}
                    icon={UserX}
                    color="text-(--text-muted) bg-(--bg-hover)"
                    loading={loading}
                />
                <StatCard
                    label={t("users.stats.admins")}
                    value={stats?.admins || 0}
                    icon={Shield}
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
                        placeholder={t("users.search")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-(--bg-border) bg-(--bg-main) p-2 ps-9 text-sm text-(--text-primary) outline-0 transition-colors placeholder:text-(--text-muted) focus:border-(--color-lavender)"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={15} className="text-(--text-muted)" />
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="rounded-lg border border-(--bg-border) bg-(--bg-main) px-3 py-1.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                    >
                        <option value="all">{t("users.filterRole")}</option>
                        {ROLES.map((r) => (
                            <option key={r.key} value={r.key}>
                                {t(`users.roles.${r.key}`, {
                                    defaultValue: r.label,
                                })}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-lg border border-(--bg-border) bg-(--bg-main) px-3 py-1.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                    >
                        <option value="all">{t("users.filterStatus")}</option>
                        <option value="active">
                            {t("users.status.active")}
                        </option>
                        <option value="inactive">
                            {t("users.status.inactive")}
                        </option>
                    </select>
                </div>

                {(filterRole !== "all" ||
                    filterStatus !== "all" ||
                    search) && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilterRole("all");
                            setFilterStatus("all");
                            setSearch("");
                        }}
                        className="text-xs text-(--color-lavender) hover:underline"
                    >
                        {t("users.clearFilters")}
                    </button>
                )}
            </div>

            {/* الجدول */}
            <div className="overflow-hidden overflow-x-auto rounded-xl border border-(--bg-border)">
                <DataTable
                    columns={columns}
                    data={users}
                    loading={loading}
                    error={error}
                    multiselect={true}
                    selectAllPages={true}
                    exportFileName="users"
                />
            </div>
        </>
    );
}