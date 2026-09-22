import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    FolderTree,
    Edit,
    Trash2,
    Package,
    Calendar,
    Palette,
    Hash,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import * as categoriesService from "../../Services/categoriesService";

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
export default function CategoryDetails() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isRTL = i18n.language === "ar";
    const locale = isRTL ? "ar-EG" : "en-US";

    const [category, setCategory] = useState(null);
    const [productCount, setProductCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    usePageTitle(category?.name);

    // ============================================
    // جلب
    // ============================================
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const c = await categoriesService.getById(id);
                if (cancelled) return;

                setCategory(c);

                const count = await categoriesService.getProductCount(c.name);
                if (!cancelled) setProductCount(count);
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

    // ============================================
    // حذف
    // ============================================
    const handleDelete = async () => {
        if (!confirm(t("categories.confirmDelete", { name: category.name })))
            return;
        try {
            await categoriesService.remove(category.id);
            navigate("/categories");
        } catch (err) {
            alert(
                t("categories.deleteFailed", {
                    error: err.message || "",
                })
            );
        }
    };

    // ============================================
    // Loading / Error
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
                        {t("categories.form.loading")}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <FolderTree size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {error
                        ? t("categories.details.loadError")
                        : t("categories.details.notFound")}
                </h2>
                {error && (
                    <p className="flex items-center gap-2 text-sm text-(--color-error)">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                <Link
                    to="/categories"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("categories.details.back")}
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        to="/categories"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight
                            size={16}
                            className={isRTL ? "" : "rotate-180"}
                        />
                    </Link>

                    <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                        style={{ background: category.color || "#6366F1" }}
                    >
                        <FolderTree size={24} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {category.name}
                        </h1>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            {category.is_active ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-(--color-mint)/10 px-2 py-0.5 text-xs font-medium text-(--color-mint)">
                                    <CheckCircle2 size={11} />
                                    {t("categories.details.active")}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-(--text-muted)/10 px-2 py-0.5 text-xs font-medium text-(--text-muted)">
                                    <XCircle size={11} />
                                    {t("categories.details.inactive")}
                                </span>
                            )}
                            {category.slug && (
                                <span className="text-xs text-(--text-muted) font-mono">
                                    /{category.slug}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to={`/categories/${category.id}/edit`}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Edit size={15} />
                        <span>{t("categories.details.edit")}</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-(--bg-border) text-(--color-error) transition-colors hover:bg-(--color-error) hover:text-white"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* الوصف */}
            {category.description && (
                <div className="mb-4 rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <p className="text-sm leading-relaxed text-(--text-secondary)">
                        {category.description}
                    </p>
                </div>
            )}

            {/* بطاقات المعلومات */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={Package}
                    label={t("categories.details.productsCount")}
                    value={productCount}
                    color="text-(--color-lavender) bg-(--color-lavender)/10"
                />
                <InfoCard
                    icon={Palette}
                    label={t("categories.details.color")}
                    value={category.color || "#6366F1"}
                    color="text-(--color-pink) bg-(--color-pink)/10"
                />
                <InfoCard
                    icon={Hash}
                    label={t("categories.details.sortOrder")}
                    value={category.sort_order}
                    color="text-(--color-amber) bg-(--color-amber)/10"
                />
                <InfoCard
                    icon={Calendar}
                    label={t("categories.details.addedAt")}
                    value={
                        category.created_at
                            ? new Date(
                                  category.created_at
                              ).toLocaleDateString(locale)
                            : "—"
                    }
                    color="text-(--color-mint) bg-(--color-mint)/10"
                />
            </div>

            {/* المنتجات */}
            <div className="mt-4 rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package
                            size={18}
                            className="text-(--color-mint)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("categories.details.products")}
                        </h2>
                    </div>
                    <Link
                        to={`/products?category=${category.name}`}
                        className="text-xs font-medium text-(--color-lavender) hover:underline"
                    >
                        {t("categories.details.viewAllProducts")} →
                    </Link>
                </div>
                <p className="text-sm text-(--text-muted)">
                    {productCount > 0
                        ? t("categories.details.productsCountMsg", {
                              count: productCount,
                          })
                        : t("categories.details.noProducts")}
                </p>
            </div>
        </>
    );
}