import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    ArrowRight,
    Package,
    Edit,
    DollarSign,
    TrendingUp,
    Star,
    Boxes,
    Calendar,
    Tag,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    X,
    Copy,
    Check,
    Heart,
    Loader2,
    AlertCircle,
    ShoppingCart,
} from "lucide-react";
import { LineChart, BarChart } from "../SubComponents/charts";
import { TemplateDarkMode } from "../../Store/TemplateSettings";
import * as productsService from "../../Services/productsService";
import * as ordersService from "../../Services/ordersService";

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
// لون المخزون
// ============================================
function getStockColor(stock) {
    const s = Number(stock) || 0;
    if (s === 0) return "text-(--color-error) bg-(--color-error)/10";
    if (s < 30) return "text-(--color-amber) bg-(--color-amber)/10";
    return "text-(--color-mint) bg-(--color-mint)/10";
}

// ============================================
// معرض الصور
// ============================================
function ImageGallery({ images = [], productName }) {
    const { t } = useTranslation();
    const [current, setCurrent] = useState(0);
    const [lightbox, setLightbox] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-2xl border border-(--bg-border) bg-(--bg-main)">
                <div className="flex flex-col items-center gap-2 text-(--text-muted)">
                    <ImageIcon size={48} />
                    <span className="text-sm">
                        {t("products.details.noImage")}
                    </span>
                </div>
            </div>
        );
    }

    const next = () => setCurrent((c) => (c + 1) % images.length);
    const prev = () =>
        setCurrent((c) => (c - 1 + images.length) % images.length);

    return (
        <>
            <div className="flex flex-col gap-3">
                {/* الصورة الرئيسية */}
                <div className="group relative aspect-square overflow-hidden rounded-2xl border border-(--bg-border) bg-(--bg-main)">
                    <img
                        src={images[current]}
                        alt={productName}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />

                    {/* زر التكبير */}
                    <button
                        type="button"
                        onClick={() => setLightbox(true)}
                        className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <Maximize2 size={16} />
                    </button>

                    {/* شارة "رئيسية" */}
                    {current === 0 && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-(--color-amber) px-2.5 py-1 text-xs font-bold text-white">
                            <Star size={11} fill="white" />
                            {t("products.details.primary")}
                        </div>
                    )}

                    {/* الأسهم */}
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={prev}
                                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-(--text-primary) opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={next}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-(--text-primary) opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </>
                    )}

                    {/* عداد */}
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
                        {current + 1} / {images.length}
                    </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setCurrent(i)}
                                className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                                    i === current
                                        ? "border-(--color-lavender) scale-105"
                                        : "border-(--bg-border) opacity-60 hover:opacity-100"
                                }`}
                            >
                                <img
                                    src={img}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setLightbox(false)}
                >
                    <button
                        type="button"
                        onClick={() => setLightbox(false)}
                        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                    >
                        <X size={22} />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    prev();
                                }}
                                className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                            >
                                <ChevronRight size={24} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    next();
                                }}
                                className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        </>
                    )}

                    <img
                        src={images[current]}
                        alt=""
                        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <div className="absolute bottom-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                        {current + 1} / {images.length}
                    </div>
                </div>
            )}
        </>
    );
}

// ============================================
// الصفحة
// ============================================
export default function ProductDetails() {
    const { id } = useParams();
    const darkMode = useSelector(TemplateDarkMode);
    const isDark = darkMode === "dark" || darkMode === true;

    const [copied, setCopied] = useState(false);
    const [favorite, setFavorite] = useState(false);

    const { t, i18n } = useTranslation();

    const [product, setProduct] = useState(null);
    usePageTitle(product?.name);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ============================================
    // جلب المنتج + المبيعات
    // ============================================
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);

            try {
                const p = await productsService.getById(id);
                if (cancelled) return;

                setProduct(p);

                // ✅ جلب المبيعات من الطلبات
                try {
                    const { data: orders } = await ordersService.getAll({
                        search: p.name,
                        pageSize: 500,
                    });

                    // تجميع حسب الشهر
                    const months = [
                        t("common.months.0"),
                        t("common.months.1"),
                        t("common.months.2"),
                        t("common.months.3"),
                        t("common.months.4"),
                        t("common.months.5"),
                    ];

                    const buckets = months.map((label) => ({
                        label,
                        value: 0,
                    }));

                    orders?.forEach((o) => {
                        const month = new Date(o.created_at).getMonth();
                        const idx = month % 6;
                        if (buckets[idx]) {
                            buckets[idx].value += Number(o.total) || 0;
                        }
                    });

                    if (!cancelled) {
                        setSales(
                            buckets.map((b) => ({
                                ...b,
                                value: Math.round(b.value),
                            }))
                        );
                    }
                } catch (salesErr) {
                    console.warn("Sales load error:", salesErr);
                    if (!cancelled) {
                        setSales(
                            [
                                t("common.months.0"),
                                t("common.months.1"),
                                t("common.months.2"),
                                t("common.months.3"),
                                t("common.months.4"),
                                t("common.months.5"),
                            ].map((label) => ({ label, value: 0 }))
                        );
                    }
                }
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

    const copySKU = () => {
        if (!product?.sku) return;
        navigator.clipboard.writeText(product.sku);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // ============================================
    // Loading
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
                        {t("products.form.loading")}
                    </p>
                </div>
            </div>
        );
    }

    // ============================================
    // Error
    // ============================================
    if (error || !product) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <Package size={48} className="text-(--text-muted)" />
                <h2 className="text-xl font-bold text-(--text-primary)">
                    {error
                        ? t("products.details.loadError")
                        : t("products.details.notFound")}
                </h2>
                {error && (
                    <p className="flex items-center gap-2 text-sm text-(--color-error)">
                        <AlertCircle size={14} />
                        {error}
                    </p>
                )}
                <Link
                    to="/products"
                    className="rounded-full bg-(--color-lavender) px-5 py-2 text-sm font-bold text-white"
                >
                    {t("products.details.back")}
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
                        to="/products"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--bg-border) text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight size={16} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {product.name}
                        </h1>
                        <div className="mt-0.5 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={copySKU}
                                className="inline-flex items-center gap-1 rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs font-mono text-(--text-secondary) transition-colors hover:text-(--color-lavender)"
                            >
                                {copied ? (
                                    <Check size={11} />
                                ) : (
                                    <Copy size={11} />
                                )}
                                {product.sku}
                            </button>
                            <span className="text-xs text-(--text-muted)">
                                • {product.category}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFavorite((f) => !f)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                            favorite
                                ? "border-(--color-error) bg-(--color-error)/10 text-(--color-error)"
                                : "border-(--bg-border) text-(--text-secondary) hover:bg-(--bg-hover)"
                        }`}
                    >
                        <Heart
                            size={16}
                            fill={favorite ? "currentColor" : "none"}
                        />
                    </button>

                    <Link
                        to={`/products/${product.id}/edit`}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Edit size={15} />
                        <span>{t("products.details.edit")}</span>
                    </Link>
                </div>
            </div>

            {/* المحتوى */}
            <div className="mb-4 grid gap-5 lg:grid-cols-2">
                <ImageGallery
                    images={product.images || []}
                    productName={product.name}
                />

                <div className="flex flex-col gap-3">
                    {/* السعر */}
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                        <span className="text-xs text-(--text-muted)">
                            {t("products.details.price")}
                        </span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-(--color-mint)">
                                {Number(product.price).toLocaleString()} ₪
                            </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-(--text-muted)">
                            <Star
                                size={14}
                                className="text-(--color-amber)"
                                fill="currentColor"
                            />
                            <span className="font-bold text-(--text-primary)">
                                {product.rating || "—"}
                            </span>
                            <span>•</span>
                            <span>
                                {Number(product.sold || 0).toLocaleString()}{" "}
                                {t("products.details.salesUnit")}
                            </span>
                        </div>
                    </div>

                    {/* بطاقات */}
                    <div className="grid grid-cols-2 gap-3">
                        <InfoCard
                            icon={TrendingUp}
                            label={t("products.details.sales")}
                            value={Number(product.sold || 0).toLocaleString()}
                            color="text-(--color-lavender) bg-(--color-lavender)/10"
                        />
                        <InfoCard
                            icon={Boxes}
                            label={t("products.details.stock")}
                            value={Number(product.stock || 0).toLocaleString()}
                            color={getStockColor(product.stock)}
                        />
                        <InfoCard
                            icon={DollarSign}
                            label={t("products.details.revenue")}
                            value={`${Number(
                                product.revenue || 0
                            ).toLocaleString()} ₪`}
                            color="text-(--color-mint) bg-(--color-mint)/10"
                        />
                        <InfoCard
                            icon={Calendar}
                            label={t("products.details.addedAt")}
                            value={
                                product.created_at
                                    ? new Date(
                                          product.created_at
                                      ).toLocaleDateString("ar-EG")
                                    : "—"
                            }
                            color="text-(--color-pink) bg-(--color-pink)/10"
                        />
                    </div>

                    {/* الوصف */}
                    {product.description && (
                        <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                            <h3 className="mb-2 text-sm font-bold text-(--text-primary)">
                                {t("products.details.description")}
                            </h3>
                            <p className="text-sm leading-relaxed text-(--text-secondary)">
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* الكلمات المفتاحية */}
                    {product.tags?.length > 0 && (
                        <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                            <h3 className="mb-2 text-sm font-bold text-(--text-primary)">
                                {t("products.details.tags")}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {product.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="rounded-full bg-(--color-lavender)/10 px-3 py-1 text-xs font-medium text-(--color-lavender)"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* الفئة */}
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                        <div className="flex items-center gap-2">
                            <Tag
                                size={16}
                                className="text-(--color-lavender)"
                            />
                            <span className="text-xs text-(--text-muted)">
                                {t("products.details.category")}
                            </span>
                            <Link
                                to={`/products?category=${product.category}`}
                                className="ms-auto rounded-full bg-(--color-lavender)/10 px-3 py-1 text-xs font-medium text-(--color-lavender) transition-colors hover:bg-(--color-lavender)/20"
                            >
                                {product.category}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* الرسوم */}
            <div className="grid gap-4 md:grid-cols-2">
                <LineChart
                    data={sales}
                    isDark={isDark}
                    title={t("products.details.monthlySales")}
                    subtitle={t("products.details.monthlySalesSubtitle")}
                    height={280}
                />
                <BarChart
                    data={sales}
                    isDark={isDark}
                    title={t("products.details.salesComparison")}
                    subtitle={t("products.details.monthlySalesSubtitle")}
                    height={280}
                />
            </div>
        </>
    );
}