import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Save,
    Package,
    Tag,
    DollarSign,
    Boxes,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Image as ImageIcon,
    RefreshCw,
} from "lucide-react";
import ImageUploader from "../SubComponents/ImageUploader";
import AIGenerateModal from "../SubComponents/AIGenerateModal";

import * as productsService from "../../Services/productsService";
import * as categoriesService from "../../Services/categoriesService";
import * as storageService from "../../Services/storageService";

// ============================================
// حقل إدخال موحّد
// ============================================
function Field({
    icon: Icon,
    label,
    error,
    as: Component = "input",
    children,
    ...inputProps
}) {
    const isInput = Component === "input";

    return (
        <div className="flex w-full flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={inputProps.name}
                    className="ps-1 text-xs font-medium text-(--text-secondary)"
                >
                    {label}
                </label>
            )}

            <div className="relative flex w-full items-center">
                {Icon && (
                    <Icon
                        size={17}
                        className="pointer-events-none absolute inset-s-3 text-(--text-muted)"
                    />
                )}

                {/* ✅ لو input → self-closing */}
                {isInput ? (
                    <input
                        {...inputProps}
                        id={inputProps.name}
                        className={`box-border w-full rounded-xl border p-2 ps-10 text-sm
                            bg-(--bg-elevated) text-(--text-primary)
                            placeholder:text-(--text-muted)
                            outline-0 transition-colors
                            disabled:opacity-60
                            ${error
                                ? "border-(--color-error) focus:border-(--color-error)"
                                : "border-(--bg-border) focus:border-(--color-lavender)"
                            }`}
                    />
                ) : (
                    <Component
                        {...inputProps}
                        id={inputProps.name}
                        className={`box-border w-full rounded-xl border p-2 ps-10 text-sm
                            bg-(--bg-elevated) text-(--text-primary)
                            placeholder:text-(--text-muted)
                            outline-0 transition-colors
                            disabled:opacity-60
                            ${error
                                ? "border-(--color-error) focus:border-(--color-error)"
                                : "border-(--bg-border) focus:border-(--color-lavender)"
                            }`}
                    >
                        {children}
                    </Component>
                )}
            </div>

            {error && (
                <span className="ps-1 text-xs text-(--color-error)">
                    {error}
                </span>
            )}
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const { t } = useTranslation();

    const [form, setForm] = useState({
        name: "",
        sku: "",
        category: "",
        price: "",
        stock: "",
        rating: "4.5",
        description: "",
        images: [],
        tags: [],
    });

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [aiOpen, setAiOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    // ============================================
    // تحميل الفئات + المنتج (لو تعديل)
    // ============================================
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setInitialLoading(true);
            try {
                // ✅ جلب الفئات
                const catsRes = await categoriesService.getAll({
                    isActive: true,
                });
                if (cancelled) return;

                const cats = catsRes.data || [];
                setCategories(cats);

                // ✅ القيمة الافتراضية للفئة
                const defaultCategory = cats[0]?.name || "";

                // ✅ لو تعديل، جلب المنتج
                if (isEdit) {
                    const p = await productsService.getById(id);
                    if (cancelled) return;

                    setForm({
                        name: p.name || "",
                        sku: p.sku || "",
                        category: p.category || defaultCategory,
                        price: String(p.price ?? ""),
                        stock: String(p.stock ?? ""),
                        rating: String(p.rating ?? "4.5"),
                        description: p.description || "",
                        images: p.images || [],
                        tags: p.tags || [],
                    });
                } else {
                    setForm((f) => ({
                        ...f,
                        category: defaultCategory,
                    }));
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setInitialLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    const updateField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    // ============================================
    // استقبال نتيجة AI
    // ============================================
    const handleAIApprove = (data) => {
        setForm((f) => ({
            ...f,
            name: data.name,
            sku: data.sku,
            category: data.category,
            price: String(data.price),
            stock: String(data.stock),
            rating: String(data.rating || "4.5"),
            description: data.description,
            tags: data.tags || [],
            images: data.suggestedImages || f.images,
        }));
    };

    // ============================================
    // رفع الصور
    // ============================================
    const handleImagesChange = async (newImages) => {
        const filesToUpload = newImages.filter(
            (img) => typeof img !== "string"
        );

        if (filesToUpload.length === 0) {
            setForm((f) => ({ ...f, images: newImages }));
            return;
        }

        const existingUrls = newImages.filter(
            (img) => typeof img === "string"
        );

        setUploading(true);
        setError("");
        try {
            const results = await storageService.uploadMany(
                filesToUpload,
                "products"
            );
            const newUrls = results.map((r) => r.url);
            setForm((f) => ({
                ...f,
                images: [...existingUrls, ...newUrls].slice(0, 8),
            }));
        } catch (err) {
            setError(
                t("products.form.imageUploadFailed", { error: err.message })
            );
        } finally {
            setUploading(false);
        }
    };

    // ============================================
    // الإرسال
    // ============================================
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        // Validation
        if (!form.name.trim())
            return setError(t("products.form.required.name"));
        if (!form.sku.trim())
            return setError(t("products.form.required.sku"));
        if (!form.category)
            return setError(t("products.form.required.category"));
        if (!form.price || Number(form.price) <= 0)
            return setError(t("products.form.required.price"));
        if (form.stock === "" || Number(form.stock) < 0)
            return setError(t("products.form.required.stock"));

        setLoading(true);
        try {
            // ✅ تحقق من SKU فريد
            const unique = await productsService.isSkuUnique(
                form.sku.trim(),
                isEdit ? Number(id) : null
            );
            if (!unique) {
                setError(t("products.form.required.skuUnique"));
                setLoading(false);
                return;
            }

            const stockNum = Number(form.stock);
            const payload = {
                name: form.name.trim(),
                sku: form.sku.trim(),
                category: form.category,
                price: Number(form.price),
                stock: stockNum,
                rating: Number(form.rating) || 4.5,
                description: form.description.trim(),
                images: form.images,
                tags: form.tags || [],
                status:
                    stockNum === 0
                        ? "out"
                        : stockNum < 30
                            ? "low"
                            : "available",
            };

            if (isEdit) {
                await productsService.update(id, payload);
            } else {
                await productsService.create(payload);
            }

            setSuccess(true);
            setTimeout(() => navigate("/products"), 1200);
        } catch (err) {
            setError(err.message || "حدث خطأ");
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // Loading
    // ============================================
    if (initialLoading) {
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

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <Package
                            size={22}
                            className="text-(--color-mint)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {isEdit
                                ? t("products.editProduct")
                                : t("products.newProduct")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {isEdit
                                ? t("products.form.updateHint")
                                : t("products.form.createHint")}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setAiOpen(true)}
                        disabled={loading || uploading}
                        className="flex items-center gap-2 rounded-full bg-linear-to-r from-(--color-lavender) to-(--color-pink) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        <Sparkles size={15} />
                        <span>{t("products.form.aiGenerate")}</span>
                    </button>

                    <Link
                        to="/products"
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                    >
                        <ArrowRight size={15} />
                        <span>{t("products.form.back")}</span>
                    </Link>
                </div>
            </div>

            <form
                onSubmit={submit}
                className="flex flex-col gap-5"
                noValidate
            >
                {/* المعلومات الأساسية */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("products.form.basicInfo")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* اسم المنتج */}
                        <Field
                            icon={Package}
                            label={t("products.form.productName")}
                            placeholder={t(
                                "products.form.productNamePlaceholder"
                            )}
                            name="name"
                            value={form.name}
                            onChange={updateField("name")}
                            disabled={loading}
                        />

                        {/* SKU */}
                        <Field
                            icon={Tag}
                            label={t("products.form.sku")}
                            placeholder={t("products.form.skuPlaceholder")}
                            name="sku"
                            value={form.sku}
                            onChange={updateField("sku")}
                            disabled={loading}
                        />

                        {/* ✅ الفئة — select صحيح */}
                        <Field
                            icon={Tag}
                            as="select"
                            label={t("products.form.category")}
                            name="category"
                            value={form.category}
                            onChange={updateField("category")}
                            disabled={loading || categories.length === 0}
                        >
                            {categories.length === 0 ? (
                                <option value="">
                                    {t("products.form.noCategories")}
                                </option>
                            ) : (
                                categories.map((c) => (
                                    <option key={c.id} value={c.name}>
                                        {c.name}
                                    </option>
                                ))
                            )}
                        </Field>

                        {/* السعر */}
                        <Field
                            icon={DollarSign}
                            label={t("products.form.price")}
                            name="price"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={form.price}
                            onChange={updateField("price")}
                            disabled={loading}
                        />

                        {/* المخزون */}
                        <Field
                            icon={Boxes}
                            label={t("products.form.stock")}
                            name="stock"
                            type="number"
                            min={0}
                            placeholder="0"
                            value={form.stock}
                            onChange={updateField("stock")}
                            disabled={loading}
                        />

                        {/* التقييم */}
                        <Field
                            icon={Tag}
                            label={t("products.form.rating")}
                            name="rating"
                            type="number"
                            min={0}
                            max={5}
                            step="0.1"
                            placeholder="4.5"
                            value={form.rating}
                            onChange={updateField("rating")}
                            disabled={loading}
                        />
                    </div>

                    {/* الوصف */}
                    <div className="mt-4 flex flex-col gap-1.5">
                        <label className="ps-1 text-xs font-medium text-(--text-secondary)">
                            {t("products.form.description")}
                        </label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    description: e.target.value,
                                }))
                            }
                            placeholder={t(
                                "products.form.descriptionPlaceholder"
                            )}
                            disabled={loading}
                            className="w-full rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 transition-colors placeholder:text-(--text-muted) focus:border-(--color-lavender) disabled:opacity-60"
                        />
                    </div>
                </div>

                {/* الصور */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-4 flex items-center gap-2">
                        <ImageIcon
                            size={18}
                            className="text-(--color-lavender)"
                        />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("products.form.images")}
                        </h2>
                        <span className="rounded-full bg-(--bg-hover) px-2 py-0.5 text-xs text-(--text-secondary)">
                            {form.images.length}
                        </span>
                        {uploading && (
                            <span className="flex items-center gap-1 text-xs text-(--color-lavender)">
                                <RefreshCw
                                    size={11}
                                    className="animate-spin"
                                />
                                {t("products.form.uploading")}
                            </span>
                        )}
                    </div>

                    <ImageUploader
                        images={form.images}
                        onChange={handleImagesChange}
                        maxImages={8}
                        primaryIndex={0}
                        disabled={loading || uploading}
                    />
                </div>

                {/* رسائل */}
                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                        <AlertCircle
                            size={18}
                            className="shrink-0 text-(--color-error)"
                        />
                        <span className="text-(--text-primary)">
                            {error}
                        </span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 rounded-xl border border-(--color-success)/40 bg-(--color-success)/5 p-3 text-sm">
                        <CheckCircle2
                            size={18}
                            className="shrink-0 text-(--color-success)"
                        />
                        <span className="text-(--text-primary)">
                            {isEdit
                                ? t("products.form.successUpdate")
                                : t("products.form.successCreate")}
                        </span>
                    </div>
                )}

                {/* أزرار */}
                <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link
                        to="/products"
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                    >
                        {t("products.form.cancel")}
                    </Link>

                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isEdit
                            ? t("products.form.update")
                            : t("products.form.save")}
                    </button>
                </div>
            </form>

            {/* Modal AI */}
            <AIGenerateModal
                open={aiOpen}
                onClose={() => setAiOpen(false)}
                onApprove={handleAIApprove}
            />
        </>
    );
}