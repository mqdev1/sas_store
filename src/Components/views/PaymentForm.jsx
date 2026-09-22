import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Save,
    CreditCard,
    User,
    DollarSign,
    Hash,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Receipt,
} from "lucide-react";
import * as paymentsService from "../../Services/paymentsService";
import * as clientsService from "../../Services/clientsService";
import * as ordersService from "../../Services/ordersService";

// ============================================
// ثوابت
// ============================================
const PAYMENT_METHOD_KEYS = ["card", "paypal", "bank", "cod", "wallet"];

const PAYMENT_STATUS_KEYS = [
    "pending",
    "processing",
    "completed",
    "failed",
    "refunded",
];

const STATUS_KEY_MAP = {
    pending: "pending",
    processing: "processing",
    completed: "success",
    failed: "failed",
    refunded: "refunded",
};

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
                    className={`box-border w-full rounded-xl border p-2 ${Icon ? "ps-10" : "ps-3"
                        } text-sm
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
export default function PaymentForm() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const isRTL = i18n.language === "ar";

    const [form, setForm] = useState({
        transaction_id: "",
        client_name: "",
        order_id: "",
        method: PAYMENT_METHOD_KEYS[0],
        status: "pending",
        amount: "",
        fee: "0",
        reference: "",
        created_at: new Date().toISOString().slice(0, 10),
    });

    const [clients, setClients] = useState([]);
    const [orders, setOrders] = useState([]);
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
                const [clientsRes, ordersRes] = await Promise.all([
                    clientsService.getAll({ pageSize: 500 }),
                    ordersService.getAll({ pageSize: 500 }),
                ]);

                if (cancelled) return;

                setClients(clientsRes.data || []);
                setOrders(ordersRes.data || []);

                if (isEdit) {
                    const p = await paymentsService.getById(id);
                    if (cancelled) return;

                    setForm({
                        transaction_id: p.transaction_id || "",
                        client_name: p.client_name || "",
                        order_id: p.order_id ? String(p.order_id) : "",
                        method: p.method || PAYMENT_METHOD_KEYS[0],
                        status: p.status || "pending",
                        amount: String(p.amount || ""),
                        fee: String(p.fee || 0),
                        reference: p.reference || "",
                        created_at:
                            p.created_at?.slice(0, 10) ||
                            new Date().toISOString().slice(0, 10),
                    });
                } else {
                    setForm((f) => ({
                        ...f,
                        transaction_id:
                            paymentsService.generateTransactionId(),
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

    // ✅ عند اختيار طلب → املأ client و amount
    const handleOrderChange = (e) => {
        const orderId = e.target.value;
        const order = orders.find((o) => String(o.id) === orderId);
        if (order) {
            setForm((f) => ({
                ...f,
                order_id: orderId,
                client_name: order.client_name || f.client_name,
                amount: String(order.total || f.amount),
            }));
        } else {
            setForm((f) => ({ ...f, order_id: orderId }));
        }
    };

    // ✅ الصافي
    const net = Math.max(
        0,
        (Number(form.amount) || 0) - (Number(form.fee) || 0)
    );

    // ============================================
    // الإرسال
    // ============================================
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!form.client_name)
            return setError(t("payments.form.required.client"));
        if (!form.transaction_id.trim())
            return setError(t("payments.form.required.transaction"));
        if (!form.amount || Number(form.amount) <= 0)
            return setError(t("payments.form.required.amount"));

        setLoading(true);
        try {
            const unique = await paymentsService.isTransactionUnique(
                form.transaction_id.trim(),
                isEdit ? Number(id) : null
            );
            if (!unique) {
                setError(t("payments.form.required.transactionUnique"));
                setLoading(false);
                return;
            }

            const payload = {
                transaction_id: form.transaction_id.trim(),
                client_name: form.client_name,
                order_id: form.order_id ? Number(form.order_id) : null,
                method: form.method,
                status: form.status,
                amount: Number(form.amount),
                fee: Number(form.fee || 0),
                net,
                currency: "ILS",
                reference: form.reference.trim() || null,
                created_at: form.created_at,
            };

            if (isEdit) {
                await paymentsService.update(id, payload);
            } else {
                await paymentsService.create(payload);
            }

            setSuccess(true);
            setTimeout(() => navigate("/payments"), 1200);
        } catch (err) {
            setError(err.message || t("payments.form.genericError"));
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
                        {t("payments.form.loading")}
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
                        <CreditCard
                            size={22}
                            className="text-(--color-mint)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {isEdit
                                ? t("payments.form.editTitle")
                                : t("payments.form.createTitle")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {isEdit
                                ? t("payments.form.editSubtitle")
                                : t("payments.form.createSubtitle")}
                        </p>
                    </div>
                </div>

                <Link
                    to="/payments"
                    className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                >
                    <ArrowRight
                        size={15}
                        className={isRTL ? "" : "rotate-180"}
                    />
                    <span>{t("payments.form.back")}</span>
                </Link>
            </div>

            <form
                onSubmit={submit}
                className="flex flex-col gap-5"
                noValidate
            >
                {/* المعلومات الأساسية */}
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("payments.form.basicInfo")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={Hash}
                            label={t("payments.form.transactionId")}
                            name="transaction_id"
                            placeholder={t(
                                "payments.form.transactionPlaceholder"
                            )}
                            value={form.transaction_id}
                            onChange={updateField("transaction_id")}
                            disabled={loading}
                        />

                        <Field
                            icon={User}
                            label={t("payments.form.client")}
                            name="client_name"
                            as="select"
                            value={form.client_name}
                            onChange={updateField("client_name")}
                            disabled={loading}
                        >
                            <option value="">
                                {t("payments.form.selectClient")}
                            </option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={Receipt}
                            label={t("payments.form.orderOptional")}
                            name="order_id"
                            as="select"
                            value={form.order_id}
                            onChange={handleOrderChange}
                            disabled={loading}
                        >
                            <option value="">
                                {t("payments.form.noOrder")}
                            </option>
                            {orders.slice(0, 100).map((o) => (
                                <option key={o.id} value={o.id}>
                                    #{o.id} — {o.client_name} —{" "}
                                    {Number(o.total).toLocaleString(
                                        i18n.language
                                    )}{" "}
                                    ₪
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={CreditCard}
                            label={t("payments.form.method")}
                            name="method"
                            as="select"
                            value={form.method}
                            onChange={updateField("method")}
                            disabled={loading}
                        >
                            {PAYMENT_METHOD_KEYS.map((key) => (
                                <option key={key} value={key}>
                                    {t(`payments.methods.${key}`)}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={Receipt}
                            label={t("payments.form.status")}
                            name="status"
                            as="select"
                            value={form.status}
                            onChange={updateField("status")}
                            disabled={loading}
                        >
                            {PAYMENT_STATUS_KEYS.map((key) => (
                                <option key={key} value={key}>
                                    {t(
                                        `payments.status.${STATUS_KEY_MAP[key]}`
                                    )}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={DollarSign}
                            label={t("payments.form.amount")}
                            name="amount"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={form.amount}
                            onChange={updateField("amount")}
                            disabled={loading}
                        />

                        <Field
                            icon={Receipt}
                            label={t("payments.form.fee")}
                            name="fee"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={form.fee}
                            onChange={updateField("fee")}
                            disabled={loading}
                        />

                        <Field
                            icon={Hash}
                            label={t("payments.form.reference")}
                            name="reference"
                            placeholder={t(
                                "payments.form.referencePlaceholder"
                            )}
                            value={form.reference}
                            onChange={updateField("reference")}
                            disabled={loading}
                        />

                        <Field
                            icon={Calendar}
                            label={t("payments.form.date")}
                            name="created_at"
                            type="date"
                            value={form.created_at}
                            onChange={updateField("created_at")}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* الملخص */}
                <div className="flex flex-col items-end gap-3 rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <div className="grid w-full gap-3 md:grid-cols-3">
                        <div className="flex flex-col">
                            <span className="text-xs text-(--text-muted)">
                                {t("payments.form.amountLabel")}
                            </span>
                            <span className="text-lg font-bold text-(--text-primary)">
                                {(Number(form.amount) || 0).toLocaleString(
                                    i18n.language
                                )}{" "}
                                ₪
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-(--text-muted)">
                                {t("payments.form.feeLabel")}
                            </span>
                            <span className="text-lg font-bold text-(--color-error)">
                                -{(Number(form.fee) || 0).toLocaleString(
                                    i18n.language
                                )}{" "}
                                ₪
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-(--text-muted)">
                                {t("payments.form.netLabel")}
                            </span>
                            <span className="text-lg font-bold text-(--color-mint)">
                                {net.toLocaleString(i18n.language)} ₪
                            </span>
                        </div>
                    </div>
                </div>

                {/* الرسائل */}
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
                                ? t("payments.form.successUpdate")
                                : t("payments.form.successCreate")}
                        </span>
                    </div>
                )}

                {/* الأزرار */}
                <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link
                        to="/payments"
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                    >
                        {t("payments.form.cancel")}
                    </Link>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isEdit
                            ? t("payments.form.update")
                            : t("payments.form.save")}
                    </button>
                </div>
            </form>
        </>
    );
}