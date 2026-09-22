import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Save,
    ShoppingCart,
    User,
    MapPin,
    Calendar,
    PlusIcon,
    Trash,
    Package,
    Loader2,
    CheckCircle2,
    AlertCircle,
    CreditCard,
    FileText,
} from "lucide-react";
import * as ordersService from "../../Services/ordersService";
import * as productsService from "../../Services/productsService";
import * as clientsService from "../../Services/clientsService";

// مفاتيح حالات الطلب (تتطابق مع orders.status.*)
const ORDER_STATUS_KEYS = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
];

// مفاتيح طرق الدفع (تتطابق مع orders.paymentMethods.*)
const PAYMENT_METHOD_KEYS = ["card", "paypal", "bank", "cod", "wallet"];

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
                    className={`box-border w-full rounded-xl border p-2 ${
                        Icon ? "ps-10" : "ps-3"
                    } text-sm
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
// صف منتج
// ============================================
function ItemRow({ item, index, products, onChange, onRemove, canRemove }) {
    const { t, i18n } = useTranslation();

    const product = products.find(
        (p) => Number(p.id) === Number(item.product_id)
    );
    const price = Number(product?.price || 0);
    const subtotal = price * Number(item.quantity || 0);

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3 md:flex-row md:items-end">
            <div className="flex-1">
                <Field
                    icon={Package}
                    label={t("orders.form.products")}
                    name={`product-${index}`}
                    as="select"
                    value={item.product_id || ""}
                    onChange={(e) =>
                        onChange(index, "product_id", e.target.value)
                    }
                >
                    <option value="">
                        {t("orders.form.selectProduct")}
                    </option>
                    {products.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name} —{" "}
                            {Number(p.price).toLocaleString(i18n.language)} ₪
                        </option>
                    ))}
                </Field>
            </div>

            <div className="w-full md:w-28">
                <Field
                    label={t("orders.form.quantity")}
                    name={`qty-${index}`}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                        onChange(index, "quantity", Number(e.target.value))
                    }
                />
            </div>

            <div className="w-full md:w-32">
                <Field
                    label={t("orders.form.price")}
                    value={`${price.toLocaleString(i18n.language)} ₪`}
                    readOnly
                    disabled
                />
            </div>

            <div className="w-full md:w-32">
                <Field
                    label={t("orders.form.subtotal")}
                    value={`${subtotal.toLocaleString(i18n.language)} ₪`}
                    readOnly
                    disabled
                />
            </div>

            {canRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--bg-border) text-(--color-error) transition-colors hover:bg-(--color-error) hover:text-white"
                    title={t("orders.table.options")}
                >
                    <Trash size={15} />
                </button>
            )}
        </div>
    );
}

// ============================================
// سطر في الفاتورة
// ============================================
function Row({ label, value, bold, color }) {
    return (
        <div className="flex items-center justify-between border-b border-(--bg-border) py-2 last:border-b-0">
            <span className="text-sm text-(--text-muted)">{label}</span>
            <span
                className={`text-sm ${
                    bold ? "text-base font-bold" : "font-medium"
                } ${color || "text-(--text-primary)"}`}
            >
                {value}
            </span>
        </div>
    );
}

// ============================================
// الصفحة
// ============================================
export default function OrderForm() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        client_name: "",
        address: "",
        order_date: new Date().toISOString().slice(0, 10),
        status: "pending",
        payment_method: PAYMENT_METHOD_KEYS[0],
        notes: "",
    });

    const [items, setItems] = useState([
        { product_id: "", quantity: 1, price: 0, product_name: "" },
    ]);

    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // ============================================
    // تحميل البيانات الأولية
    // ============================================
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setInitialLoading(true);
            try {
                const [productsRes, clientsRes] = await Promise.all([
                    productsService.getAll({ pageSize: 500 }),
                    clientsService.getAll({ pageSize: 500 }),
                ]);

                if (cancelled) return;

                setProducts(productsRes.data || []);
                setClients(clientsRes.data || []);

                if (isEdit) {
                    const order = await ordersService.getById(id);
                    if (cancelled) return;

                    setForm({
                        client_name: order.client_name || "",
                        address: order.address || "",
                        order_date: order.order_date || "",
                        status: order.status || "pending",
                        payment_method:
                            order.payment_method || PAYMENT_METHOD_KEYS[0],
                        notes: order.notes || "",
                    });

                    setItems(
                        order.items?.length
                            ? order.items.map((it) => ({
                                  product_id: it.product_id,
                                  product_name: it.product_name,
                                  quantity: it.quantity,
                                  price: it.price,
                              }))
                            : [
                                  {
                                      product_id: "",
                                      quantity: 1,
                                      price: 0,
                                      product_name: "",
                                  },
                              ]
                    );
                }
            } catch (err) {
                if (!cancelled)
                    setError(
                        t("orders.form.loadError", {
                            error: err.message || "",
                        })
                    );
            } finally {
                if (!cancelled) setInitialLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id, isEdit, t]);

    // ============================================
    // الإجماليات
    // ============================================
    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, it) => {
            const p = products.find(
                (x) => Number(x.id) === Number(it.product_id)
            );
            const price = Number(p?.price || 0);
            return sum + price * Number(it.quantity || 0);
        }, 0);

        const tax = Math.round(subtotal * 0.15);
        const shipping = subtotal > 0 ? 30 : 0;
        const total = subtotal + tax + shipping;

        return { subtotal, tax, shipping, total };
    }, [items, products]);

    // ============================================
    // Update helpers
    // ============================================
    const updateField = (name, value) =>
        setForm((f) => ({ ...f, [name]: value }));

    const updateItem = (index, key, value) => {
        setItems((prev) =>
            prev.map((it, i) => {
                if (i !== index) return it;

                if (key === "product_id") {
                    const product = products.find(
                        (p) => Number(p.id) === Number(value)
                    );
                    return {
                        ...it,
                        product_id: value,
                        price: Number(product?.price || 0),
                        product_name: product?.name || "",
                    };
                }

                return { ...it, [key]: value };
            })
        );
    };

    const addItem = () =>
        setItems((prev) => [
            ...prev,
            { product_id: "", quantity: 1, price: 0, product_name: "" },
        ]);

    const removeItem = (index) =>
        setItems((prev) => prev.filter((_, i) => i !== index));

    // ============================================
    // الإرسال
    // ============================================
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!form.client_name)
            return setError(t("orders.form.required.client"));
        if (!form.address)
            return setError(t("orders.form.required.address"));
        if (!form.order_date)
            return setError(t("orders.form.required.date"));

        const validItems = items
            .filter((it) => it.product_id && it.quantity > 0)
            .map((it) => {
                const p = products.find(
                    (x) => Number(x.id) === Number(it.product_id)
                );
                return {
                    product_id: Number(it.product_id),
                    product_name: p?.name || "",
                    quantity: it.quantity,
                    price: Number(p?.price || 0),
                };
            });

        if (validItems.length === 0)
            return setError(t("orders.form.required.product"));

        setLoading(true);
        try {
            const payload = {
                client_name: form.client_name,
                address: form.address,
                order_date: form.order_date,
                status: form.status,
                payment_method: form.payment_method,
                notes: form.notes,
                subtotal: totals.subtotal,
                tax: totals.tax,
                shipping: totals.shipping,
                total: totals.total,
                items: validItems,
            };

            if (isEdit) {
                await ordersService.update(id, payload);
            } else {
                await ordersService.create(payload);
            }

            setSuccess(true);
            setTimeout(() => navigate("/orders"), 1200);
        } catch (err) {
            setError(
                t("orders.form.saveFailed", {
                    error: err.message || "",
                })
            );
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
                        {t("orders.form.loading")}
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
                        <ShoppingCart
                            size={22}
                            className="text-(--color-amber)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {isEdit
                                ? t("orders.form.editTitle", { id })
                                : t("orders.newOrder")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {isEdit
                                ? t("orders.form.editSubtitle")
                                : t("orders.form.createSubtitle")}
                        </p>
                    </div>
                </div>

                <Link
                    to="/orders"
                    className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                >
                    <ArrowRight
                        size={15}
                        className={i18n.language === "ar" ? "" : "rotate-180"}
                    />
                    <span>{t("orders.form.back")}</span>
                </Link>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                {/* بيانات العميل */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("orders.form.clientInfo")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={User}
                            label={t("orders.form.client")}
                            name="client_name"
                            as="select"
                            value={form.client_name}
                            onChange={(e) =>
                                updateField("client_name", e.target.value)
                            }
                        >
                            <option value="">
                                {t("orders.form.selectClient")}
                            </option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={MapPin}
                            label={t("orders.form.address")}
                            name="address"
                            placeholder={t(
                                "orders.form.addressPlaceholder"
                            )}
                            value={form.address}
                            onChange={(e) =>
                                updateField("address", e.target.value)
                            }
                        />

                        <Field
                            icon={Calendar}
                            label={t("orders.form.orderDate")}
                            name="order_date"
                            type="date"
                            value={form.order_date}
                            onChange={(e) =>
                                updateField("order_date", e.target.value)
                            }
                        />

                        <Field
                            icon={ShoppingCart}
                            label={t("orders.form.status")}
                            name="status"
                            as="select"
                            value={form.status}
                            onChange={(e) =>
                                updateField("status", e.target.value)
                            }
                        >
                            {ORDER_STATUS_KEYS.map((key) => (
                                <option key={key} value={key}>
                                    {t(`orders.status.${key}`)}
                                </option>
                            ))}
                        </Field>
                    </div>
                </div>

                {/* المنتجات */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("orders.form.products")}
                        </h2>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-1 rounded-full border border-(--bg-border) px-3 py-1.5 text-xs font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                        >
                            <PlusIcon size={13} />
                            <span>{t("orders.form.addProduct")}</span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {items.map((it, idx) => (
                            <ItemRow
                                key={idx}
                                item={it}
                                index={idx}
                                products={products}
                                onChange={updateItem}
                                onRemove={removeItem}
                                canRemove={items.length > 1}
                            />
                        ))}
                    </div>
                </div>

                {/* الدفع والملاحظات */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("orders.form.payment")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={CreditCard}
                            label={t("orders.form.paymentMethod")}
                            name="payment_method"
                            as="select"
                            value={form.payment_method}
                            onChange={(e) =>
                                updateField("payment_method", e.target.value)
                            }
                        >
                            {PAYMENT_METHOD_KEYS.map((key) => (
                                <option key={key} value={key}>
                                    {t(`orders.paymentMethods.${key}`)}
                                </option>
                            ))}
                        </Field>
                    </div>

                    <div className="mt-4">
                        <label className="mb-1.5 block ps-1 text-xs font-medium text-(--text-secondary)">
                            {t("orders.form.notes")}
                        </label>
                        <textarea
                            rows={3}
                            value={form.notes}
                            onChange={(e) =>
                                updateField("notes", e.target.value)
                            }
                            placeholder={t(
                                "orders.form.notesPlaceholder"
                            )}
                            className="w-full rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)"
                        />
                    </div>
                </div>

                {/* الفاتورة */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-(--color-mint)" />
                        <h2 className="text-base font-semibold text-(--text-primary)">
                            {t("orders.form.invoice")}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Row
                            label={t("orders.form.subTotalLabel")}
                            value={`${totals.subtotal.toLocaleString(
                                i18n.language
                            )} ₪`}
                        />
                        <Row
                            label={t("orders.form.tax")}
                            value={`${totals.tax.toLocaleString(
                                i18n.language
                            )} ₪`}
                            color="text-(--color-amber)"
                        />
                        <Row
                            label={t("orders.form.shipping")}
                            value={`${totals.shipping.toLocaleString(
                                i18n.language
                            )} ₪`}
                            color="text-(--color-lavender)"
                        />
                        <Row
                            label={t("orders.form.totalLabel")}
                            value={`${totals.total.toLocaleString(
                                i18n.language
                            )} ₪`}
                            bold
                            color="text-(--color-mint)"
                        />
                    </div>
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
                                ? t("orders.form.successUpdate")
                                : t("orders.form.successCreate")}
                        </span>
                    </div>
                )}

                {/* الأزرار */}
                <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link
                        to="/orders"
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                    >
                        {t("orders.form.cancel")}
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
                            ? t("orders.form.update")
                            : t("orders.form.save")}
                    </button>
                </div>
            </form>
        </>
    );
}