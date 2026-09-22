import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    Users as UsersIcon,
    Edit,
    Mail,
    Phone,
    Shield,
    Building2,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { DonutChart, BarChart } from "../SubComponents/charts";
import { TemplateDarkMode } from "../../Store/TemplateSettings";
import * as usersService from "../../Services/usersService";
import {
    PERMISSIONS,
    getUserStatusColor,
    getRoleColor,
} from "../../data/usersData";

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
// الصفحة
// ============================================
export default function UserDetails() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const darkMode = useSelector(TemplateDarkMode);
    const isDark = darkMode === "dark" || darkMode === true;
    const isRTL = i18n.language === "ar";
    const locale = isRTL ? "ar-EG" : "en-US";

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    

    usePageTitle(user?.name);

    // ============================================
    // جلب المستخدم
    // ============================================
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const u = await usersService.getById(id);
                if (!cancelled) setUser(u);
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

    // ✅ الصلاحيات
    const permissionsByGroup = useMemo(() => {
        if (!user) return {};
        const groups = {};
        PERMISSIONS.forEach((p) => {
            if (!groups[p.group]) groups[p.group] = [];
            groups[p.group].push({
                ...p,
                granted: (user.permissions || []).includes(p.key),
            });
        });
        return groups;
    }, [user]);

    // ✅ Donut
    const roleDist = useMemo(() => {
        if (!user) return [];
        return [
            {
                id: 0,
                label: t(`users.roles.${user.role}`, {
                    defaultValue: user.role,
                }),
                value: 1,
                color: "#6366F1",
            },
        ];
    }, [user, t, i18n.language]);

    // ✅ النشاط (mock)
    const weekdays = useMemo(
        () =>
            t("common.weekdays", { returnObjects: true }) || [
                "Sat",
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
            ],
        [t, i18n.language]
    );

    const activity = useMemo(() => {
        return weekdays.map((label) => ({
            label,
            value: Math.round(Math.random() * 20 + 2),
        }));
    }, [weekdays]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={32}
                        className="animate-spin text-(--color-lavender)"
                    />
                    <p className="text-sm text-(--text-muted)">
                        {t("users.details.loading")}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <UsersIcon size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {error
                        ? t("users.details.loadError")
                        : t("users.details.notFound")}
                </h2>
                {error && (
                    <p className="flex items-center gap-2 text-sm text-(--color-error)">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                <Link
                    to="/users"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("users.details.back")}
                </Link>
            </div>
        );
    }

    const lastLogin = user.last_login ? new Date(user.last_login) : null;

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        to="/users"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight
                            size={16}
                            className={isRTL ? "" : "rotate-180"}
                        />
                    </Link>

                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-lavender) text-xl font-bold text-white">
                        {(user.name || "?")[0]}
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {user.name}
                        </h1>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(
                                    user.role
                                )}`}
                            >
                                {t(`users.roles.${user.role}`, {
                                    defaultValue: user.role,
                                })}
                            </span>
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getUserStatusColor(
                                    user.status
                                )}`}
                            >
                                {user.status === "active"
                                    ? t("users.status.active")
                                    : t("users.status.inactive")}
                            </span>
                            <span className="text-xs text-(--text-muted)">
                                @{user.username || "—"}
                            </span>
                        </div>
                    </div>
                </div>

                <Link
                    to={`/users/${user.id}/edit`}
                    className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                    <Edit size={15} />
                    <span>{t("users.details.edit")}</span>
                </Link>
            </div>

            {/* بطاقات المعلومات */}
            <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={Mail}
                    label={t("users.details.stats.email")}
                    value={user.email || "—"}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={Phone}
                    label={t("users.details.stats.phone")}
                    value={user.phone || "—"}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
                <InfoCard
                    icon={Building2}
                    label={t("users.details.stats.department")}
                    value={t(`users.form.departments.${user.department}`, {
                        defaultValue: user.department || "—",
                    })}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
                <InfoCard
                    icon={Calendar}
                    label={t("users.details.stats.joinedAt")}
                    value={
                        user.created_at
                            ? new Date(user.created_at).toLocaleDateString(
                                  locale
                              )
                            : "—"
                    }
                    color="text-(--color-pink) bg-(--color-pink)/10"
                />
            </div>

            {/* آخر دخول */}
            {lastLogin && (
                <div className="mb-4 rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Clock
                                size={20}
                                className="text-(--color-lavender)"
                            />
                            <div>
                                <span className="block text-xs text-(--text-muted)">
                                    {t("users.details.lastLogin")}
                                </span>
                                <span className="text-sm font-bold text-(--text-primary)">
                                    {lastLogin.toLocaleDateString(locale)} -{" "}
                                    {lastLogin.toLocaleTimeString(locale, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield
                                size={16}
                                className="text-(--color-mint)"
                            />
                            <span className="text-sm text-(--text-muted)">
                                {t("users.details.permissionsCount", {
                                    count: (user.permissions || []).length,
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* الصلاحيات + Donut */}
            <div className="mb-4 grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-(--text-primary)">
                            <Shield
                                size={18}
                                className="text-(--color-lavender)"
                            />
                            {t("users.details.permissions")}
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            {Object.entries(permissionsByGroup).map(
                                ([group, perms]) => (
                                    <div
                                        key={group}
                                        className="rounded-lg border border-(--bg-border) bg-(--bg-main)/40 p-3"
                                    >
                                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-(--text-muted)">
                                            {group}
                                        </h3>
                                        <div className="flex flex-col gap-1.5">
                                            {perms.map((p) => (
                                                <div
                                                    key={p.key}
                                                    className="flex items-center gap-2"
                                                >
                                                    {p.granted ? (
                                                        <CheckCircle2
                                                            size={14}
                                                            className="shrink-0 text-(--color-mint)"
                                                        />
                                                    ) : (
                                                        <XCircle
                                                            size={14}
                                                            className="shrink-0 text-(--text-muted)"
                                                        />
                                                    )}
                                                    <span
                                                        className={`text-xs ${
                                                            p.granted
                                                                ? "text-(--text-primary)"
                                                                : "text-(--text-muted) line-through"
                                                        }`}
                                                    >
                                                        {p.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <DonutChart
                        data={roleDist}
                        isDark={isDark}
                        title={t("users.details.roleChart")}
                        height={220}
                        totalLabel={t("users.details.roleChartTotal")}
                    />
                </div>
            </div>

            {/* النشاط الأسبوعي */}
            <div className="grid gap-4">
                <BarChart
                    data={activity}
                    isDark={isDark}
                    title={t("users.details.weeklyActivity")}
                    subtitle={t("users.details.weeklyActivitySubtitle")}
                    height={280}
                    valueSuffix={t("users.details.activityUnit")}
                />
            </div>
        </>
    );
}