import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Package,
    PlusIcon,
    Search,
    Filter,
    TrendingUp,
    DollarSign,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import DataTable from "../SubComponents/DataTable";
import * as productsService from "../../Services/productsService";
import * as categoriesService from "../../Services/categoriesService";

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
// شارة حالة المخزون
// ============================================
function StockBadge({ stock }) {
    const { t } = useTranslation();
    const s = Number(stock) || 0;
    let cls, label;

    if (s === 0) {
        cls = "text-(--color-error) bg-(--color-error)/10";
        label = t("products.stock.out");
    } else if (s < 30) {
        cls = "text-(--color-amber) bg-(--color-amber)/10";
        label = t("products.stock.low");
    } else {
        cls = "text-(--color-mint) bg-(--color-mint)/10";
        label = t("products.stock.available");
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
        >
            {label} ({s})
        </span>
    );
}

// ============================================
// الصفحة
// ============================================
export default function Products() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [categories, setCategories] = useState([]);

    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // ✅ Debounce للبحث
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // ✅ جلب الفئات
    useEffect(() => {
        categoriesService
            .getAll({ isActive: true })
            .then((res) => setCategories(res.data || []))
            .catch((err) => console.error("Categories load error:", err));
    }, []);

    // ============================================
    // جلب المنتجات
    // ============================================
    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [productsRes, statsRes] = await Promise.all([
                productsService.getAll({
                    search: debouncedSearch,
                    category:
                        filterCategory !== "all" ? filterCategory : null,
                    pageSize: 500,
                }),
                productsService.getStats(),
            ]);

            setProducts(productsRes.data || []);
            setStats(statsRes);
        } catch (err) {
            console.error("Products load error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, filterCategory]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts, refreshKey]);

    // ============================================
    // حذف منتج
    // ============================================
    const handleDelete = async (row) => {
        if (!confirm(t("products.confirmDelete", { name: row.name })))
            return;

        try {
            await productsService.remove(row.id);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            alert(t("products.deleteFailed", { error: err.message }));
        }
    };

    // ============================================
    // تصدير
    // ============================================
    const handleExport = (blob, rows) => {
        if (!blob) {
            alert(t("products.noDataToExport"));
            return;
        }
        console.log(t("products.exported", { count: rows.length }));
    };

    // ============================================
    // الأعمدة
    // ============================================
    const columns = useMemo(
        () => [
            {
                headerText: t("products.table.id"),
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
                headerText: t("products.table.sku"),
                name: "sku",
                sortable: true,
                width: 120,
            },
            {
                headerText: t("products.table.name"),
                name: "name",
                sortable: true,
                width: 180,
            },
            {
                headerText: t("products.table.category"),
                name: "category",
                sortable: true,
                width: 130,
            },
            {
                headerText: t("products.table.price"),
                name: "price",
                sortable: true,
                width: 110,
                render: (row) => (
                    <span className="font-medium text-(--text-primary)">
                        {Number(row.price).toLocaleString()} ₪
                    </span>
                ),
            },
            {
                headerText: t("products.table.stock"),
                name: "stock",
                sortable: true,
                width: 120,
                render: (row) => <StockBadge stock={row.stock} />,
            },
            {
                headerText: t("products.table.sold"),
                name: "sold",
                sortable: true,
                width: 100,
                render: (row) => Number(row.sold).toLocaleString(),
            },
            {
                headerText: t("products.table.revenue"),
                name: "revenue",
                sortable: true,
                width: 120,
                render: (row) => (
                    <span className="font-medium text-(--color-mint)">
                        {Number(row.revenue).toLocaleString()} ₪
                    </span>
                ),
            },
            {
                headerText: t("products.table.rating"),
                name: "rating",
                sortable: true,
                width: 90,
                render: (row) => `⭐ ${row.rating || "—"}`,
            },
            {
                headerText: t("products.table.options"),
                name: "events",
                width: 130,
                events: [
                    {
                        name: "on_preview",
                        event: (row) => navigate(`/products/${row.id}`),
                    },
                    {
                        name: "on_edit",
                        event: (row) =>
                            navigate(`/products/${row.id}/edit`),
                    },
                    {
                        name: "on_delete",
                        event: handleDelete,
                    },
                ],
            },
        ],
        [navigate, t]
    );

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <Package size={22} className="text-(--color-mint)" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("products.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("products.subtitle")}
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
                        <span>{t("products.refresh")}</span>
                    </button>

                    <Link
                        to="/products/new"
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <PlusIcon size={15} />
                        <span>{t("products.newProduct")}</span>
                    </Link>
                </div>
            </div>

            {/* إحصائيات */}
            <div className="mb-4 grid gap-3 md:grid-cols-4">
                <StatCard
                    label={t("products.stats.total")}
                    value={(stats?.count || 0).toLocaleString()}
                    icon={Package}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("products.stats.totalSold")}
                    value={(stats?.totalSold || 0).toLocaleString()}
                    icon={TrendingUp}
                    color="text-(--color-mint) bg-(--color-mint)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("products.stats.totalRevenue")}
                    value={`${(stats?.totalRevenue || 0).toLocaleString()} ₪`}
                    icon={DollarSign}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                    loading={loading}
                />
                <StatCard
                    label={t("products.stats.lowStock")}
                    value={
                        (stats?.lowStock || 0) + (stats?.outOfStock || 0)
                    }
                    icon={AlertTriangle}
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
                        placeholder={t("products.search")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-(--bg-border) bg-(--bg-main) p-2 ps-9 text-sm text-(--text-primary) outline-0 transition-colors placeholder:text-(--text-muted) focus:border-(--color-lavender)"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={15} className="text-(--text-muted)" />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="rounded-lg border border-(--bg-border) bg-(--bg-main) px-3 py-1.5 text-sm text-(--text-primary) outline-0 transition-colors focus:border-(--color-lavender)"
                    >
                        <option value="all">
                            {t("products.filterCategory")}
                        </option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {(filterCategory !== "all" || search) && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilterCategory("all");
                            setSearch("");
                        }}
                        className="text-xs text-(--color-lavender) hover:underline"
                    >
                        {t("products.clearFilters")}
                    </button>
                )}

                <div className="ms-auto text-xs text-(--text-muted)">
                    {!loading && (
                        <span>
                            {t("products.results", {
                                count: products.length,
                            })}
                        </span>
                    )}
                </div>
            </div>

            {/* الجدول */}
            <div className="overflow-hidden overflow-x-auto rounded-xl border border-(--bg-border)">
                <DataTable
                    columns={columns}
                    data={products}
                    loading={loading}
                    error={error}
                    multiselect={true}
                    selectAllPages={true}
                    exportFileName="products"
                    onExport={handleExport}
                    onChange={(selected) => {
                        console.log("selected:", selected.length);
                    }}
                >
                    <Link
                        to="/products/new"
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-xs font-medium text-(--text-secondary) transition-colors hover:bg-(--color-lavender) hover:text-(--bg-elevated)"
                    >
                        <PlusIcon size={13} />
                        <span>{t("products.newProduct")}</span>
                    </Link>

                    <Link
                        to="/"
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-xs font-medium text-(--text-secondary) transition-colors hover:bg-(--color-lavender) hover:text-(--bg-elevated)"
                    >
                        <Package size={13} />
                        <span>{t("home.title")}</span>
                    </Link>
                </DataTable>
            </div>
        </>
    );
}