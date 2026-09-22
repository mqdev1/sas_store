import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Save,
    FolderTree,
    FileText,
    Palette,
    Hash,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import * as categoriesService from "../../Services/categoriesService";

// ============================================
// ألوان جاهزة
// ============================================
const COLORS = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F43F5E",
    "#F59E0B",
    "#10B981",
    "#06B6D4",
    "#3B82F6",
];

// ============================================
// حقل موحّد
// ============================================
function Field({
    icon: Icon,
    label,
    error,
    as: Component = "input",
    children,
    ...inputProps
}) {
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
                <Component
                    {...inputProps}
                    id={inputProps.name}
                    className={`box-border w-full rounded-xl border p-2 ps-10 text-sm
                        bg-(--bg-elevated) text-(--text-primary)
                        placeholder:text-(--text-muted)
                        outline-0 transition-colors
                        disabled:opacity-60
                        ${
                            error
                                ? "border-(--color-error) focus:border-(--color-error)"
                                : "border-(--bg-border) focus:border-(--color-lavender)"
                        }`}
                >
                    {children}
                </Component>
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
export default function CategoryForm() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const isRTL = i18n.language === "ar";

    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        color: COLORS[0],
        sort_order: 0,
        is_active: true,
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // تحميل عند التعديل
    useEffect(() => {
        if (!isEdit) return;

        let cancelled = false;
        (async () => {
            try {
                const c = await categoriesService.getById(id);
                if (cancelled) return;

                setForm({
                    name: c.name || "",
                    slug: c.slug || "",
                    description: c.description || "",
                    color: c.color || COLORS[0],
                    sort_order: c.sort_order || 0,
                    is_active: c.is_active ?? true,
                });
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

    // عند تغيير الاسم → توليد slug
    const handleNameChange = (e) => {
        const name = e.target.value;
        setForm((f) => ({
            ...f,
            name,
            slug: f.slug || categoriesService.generateSlug(name),
        }));
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
            return setError(t("categories.form.required.name"));

        setLoading(true);
        try {
            // تحقق من الاسم فريد
            const unique = await categoriesService.isNameUnique(
                form.name.trim(),
                isEdit ? Number(id) : null
            );
            if (!unique) {
                setError(t("categories.form.required.nameUnique"));
                setLoading(false);
                return;
            }

            const payload = {
                name: form.name.trim(),
                slug:
                    form.slug.trim() ||
                    categoriesService.generateSlug(form.name),
                description: form.description.trim(),
                color: form.color,
                sort_order: Number(form.sort_order) || 0,
                is_active: form.is_active,
            };

            if (isEdit) {
                await categoriesService.update(id, payload);
            } else {
                await categoriesService.create(payload);
            }

            setSuccess(true);
            setTimeout(() => navigate("/categories"), 1200);
        } catch (err) {
            setError(err.message || t("categories.form.genericError"));
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
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
                            {isEdit
                                ? t("categories.form.editTitle")
                                : t("categories.newCategory")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {isEdit
                                ? t("categories.form.editSubtitle")
                                : t("categories.form.createSubtitle")}
                        </p>
                    </div>
                </div>

                <Link
                    to="/categories"
                    className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                >
                    <ArrowRight
                        size={15}
                        className={isRTL ? "" : "rotate-180"}
                    />
                    <span>{t("categories.form.back")}</span>
                </Link>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                {/* المعلومات الأساسية */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("categories.form.basicInfo")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={FolderTree}
                            label={t("categories.form.name")}
                            name="name"
                            placeholder={t(
                                "categories.form.namePlaceholder"
                            )}
                            value={form.name}
                            onChange={handleNameChange}
                            disabled={loading}
                        />

                        <Field
                            icon={Hash}
                            label={t("categories.form.slug")}
                            name="slug"
                            placeholder={t(
                                "categories.form.slugPlaceholder"
                            )}
                            value={form.slug}
                            onChange={updateField("slug")}
                            disabled={loading}
                        />

                        <Field
                            icon={Hash}
                            label={t("categories.form.sortOrder")}
                            name="sort_order"
                            type="number"
                            min={0}
                            value={form.sort_order}
                            onChange={updateField("sort_order")}
                            disabled={loading}
                        />

                        <Field
                            icon={Palette}
                            label={t("categories.form.color")}
                            name="color"
                            as="select"
                            value={form.color}
                            onChange={updateField("color")}
                            disabled={loading}
                        >
                            {COLORS.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </Field>
                    </div>

                    <div className="mt-4">
                        <label className="mb-1.5 block ps-1 text-xs font-medium text-(--text-secondary)">
                            {t("categories.form.description")}
                        </label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={updateField("description")}
                            placeholder={t(
                                "categories.form.descriptionPlaceholder"
                            )}
                            disabled={loading}
                            className="w-full rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                        />
                    </div>

                    {/* معاينة اللون */}
                    <div className="mt-4 flex items-center gap-3">
                        <span className="text-xs font-medium text-(--text-secondary)">
                            {t("categories.form.colorPreview")}:
                        </span>
                        <div
                            className="h-8 w-24 rounded-lg border border-(--bg-border)"
                            style={{ background: form.color }}
                        />
                    </div>

                    {/* الحالة */}
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3">
                        <div>
                            <span className="text-sm font-medium text-(--text-primary)">
                                {t("categories.form.activate")}
                            </span>
                            <p className="text-xs text-(--text-muted)">
                                {t("categories.form.activateHint")}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setForm((f) => ({
                                    ...f,
                                    is_active: !f.is_active,
                                }))
                            }
                            className={`relative h-6 w-11 rounded-full transition-colors ${
                                form.is_active
                                    ? "bg-(--color-lavender)"
                                    : "bg-(--bg-border)"
                            }`}
                        >
                            <span
                                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
                                style={{ left: form.is_active ? 22 : 2 }}
                            />
                        </button>
                    </div>
                </div>

                {/* رسائل */}
                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-(--color-error)/40 bg-(--color-error)/5 p-3 text-sm">
                        <AlertCircle
                            size={18}
                            className="shrink-0 text-(--color-error)"
                        />
                        <span className="text-(--text-primary)">{error}</span>
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
                                ? t("categories.form.successUpdate")
                                : t("categories.form.successCreate")}
                        </span>
                    </div>
                )}

                {/* أزرار */}
                <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link
                        to="/categories"
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                    >
                        {t("categories.form.cancel")}
                    </Link>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isEdit
                            ? t("categories.form.update")
                            : t("categories.form.save")}
                    </button>
                </div>
            </form>
        </>
    );
}