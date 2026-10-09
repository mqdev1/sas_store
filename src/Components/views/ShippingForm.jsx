import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    Save,
    Truck,
    Package,
    MapPin,
    DollarSign,
    Weight,
    Building2,
    Route,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Calendar,
} from "lucide-react";
import * as shippingService from "../../Services/shippingService";
import * as clientsService from "../../Services/clientsService";

// ============================================
// ثوابت
// ============================================
const CARRIERS = ["Aramex", "DHL", "FedEx", "UPS", "Local Express"];

const SHIPPING_STATUS_KEYS = [
    "preparing",
    "shipped",
    "in_transit",
    "delivered",
    "delayed",
    "cancelled",
];

const SHIPPING_METHOD_KEYS = ["normal", "express", "same_day", "pickup"];

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
export default function ShippingForm() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const isRTL = i18n.language === "ar";

    const [form, setForm] = useState({
        tracking_number: "",
        client_name: "",
        address: "",
        country: "",
        city: "",
        carrier: CARRIERS[0],
        method: SHIPPING_METHOD_KEYS[0],
        status: "preparing",
        weight: "",
        cost: "",
        shipped_at: new Date().toISOString().slice(0, 10),
    });

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
            try {
                // ✅ جلب العملاء
                const clientsRes = await clientsService.getAll({
                    pageSize: 500,
                });
                if (cancelled) return;
                setClients(clientsRes.data || []);

                // ✅ لو تعديل، جلب الشحنة
                if (isEdit) {
                    const s = await shippingService.getById(id);
                    if (cancelled) return;

                    setForm({
                        tracking_number: s.tracking_number || "",
                        client_name: s.client_name || "",
                        address: s.address || "",
                        country: s.country || "",
                        city: s.city || "",
                        carrier: s.carrier || CARRIERS[0],
                        method: s.method || SHIPPING_METHOD_KEYS[0],
                        status: s.status || "preparing",
                        weight: String(s.weight || ""),
                        cost: String(s.cost || ""),
                        shipped_at: s.shipped_at || "",
                    });
                } else {
                    // ✅ توليد tracking تلقائي
                    setForm((f) => ({
                        ...f,
                        tracking_number: `TRK-${String(
                            Date.now()
                        ).slice(-8)}`,
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

    // ✅ عند اختيار عميل، املأ العنوان
    const handleClientChange = (e) => {
        const name = e.target.value;
        const client = clients.find((c) => c.name === name);
        setForm((f) => ({
            ...f,
            client_name: name,
            country: client?.country || f.country,
            city: client?.city || f.city,
            address: client?.address || f.address,
        }));
    };

    // ============================================
    // الإرسال
    // ============================================
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!form.tracking_number.trim())
            return setError(t("shipping.form.required.tracking"));
        if (!form.client_name)
            return setError(t("shipping.form.required.client"));
        if (!form.weight || Number(form.weight) <= 0)
            return setError(t("shipping.form.required.weight"));
        if (!form.cost || Number(form.cost) < 0)
            return setError(t("shipping.form.required.cost"));

        setLoading(true);
        try {
            // ✅ التحقق من tracking فريد
            const unique = await shippingService.isTrackingUnique(
                form.tracking_number.trim(),
                isEdit ? Number(id) : null
            );
            if (!unique) {
                setError(t("shipping.form.required.trackingUnique"));
                setLoading(false);
                return;
            }

            const payload = {
                tracking_number: form.tracking_number.trim(),
                client_name: form.client_name,
                address: form.address.trim(),
                country: form.country.trim(),
                city: form.city.trim(),
                carrier: form.carrier,
                method: form.method,
                status: form.status,
                weight: Number(form.weight),
                cost: Number(form.cost),
                shipped_at: form.shipped_at,
                delivered_at:
                    form.status === "delivered"
                        ? new Date().toISOString().slice(0, 10)
                        : null,
            };

            if (isEdit) {
                await shippingService.update(id, payload);
            } else {
                await shippingService.create(payload);
            }

            setSuccess(true);
            setTimeout(() => navigate("/shipping"), 1200);
        } catch (err) {
            setError(err.message || t("shipping.form.genericError"));
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
                        {t("shipping.form.loading")}
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
                        <Truck
                            size={22}
                            className="text-(--color-amber)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {isEdit
                                ? t("shipping.form.editTitle")
                                : t("shipping.newShipment")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {isEdit
                                ? t("shipping.form.editSubtitle")
                                : t("shipping.form.createSubtitle")}
                        </p>
                    </div>
                </div>

                <Link
                    to="/shipping"
                    className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-lavender)"
                >
                    <ArrowRight
                        size={15}
                        className={isRTL ? "" : "rotate-180"}
                    />
                    <span>{t("shipping.form.back")}</span>
                </Link>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                    <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                        {t("shipping.form.basicInfo")}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            icon={Package}
                            label={t("shipping.form.trackingNumber")}
                            name="tracking_number"
                            placeholder={t(
                                "shipping.form.trackingPlaceholder"
                            )}
                            value={form.tracking_number}
                            onChange={updateField("tracking_number")}
                            disabled={loading}
                        />

                        <Field
                            icon={Package}
                            label={t("shipping.form.client")}
                            name="client_name"
                            as="select"
                            value={form.client_name}
                            onChange={handleClientChange}
                            disabled={loading}
                        >
                            <option value="">
                                {t("shipping.form.selectClient")}
                            </option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={MapPin}
                            label={t("shipping.form.address")}
                            name="address"
                            placeholder={t(
                                "shipping.form.addressPlaceholder"
                            )}
                            value={form.address}
                            onChange={updateField("address")}
                            disabled={loading}
                        />

                        <Field
                            icon={MapPin}
                            label={t("shipping.form.country")}
                            name="country"
                            placeholder={t(
                                "shipping.form.countryPlaceholder"
                            )}
                            value={form.country}
                            onChange={updateField("country")}
                            disabled={loading}
                        />

                        <Field
                            icon={MapPin}
                            label={t("shipping.form.city")}
                            name="city"
                            placeholder={t("shipping.form.cityPlaceholder")}
                            value={form.city}
                            onChange={updateField("city")}
                            disabled={loading}
                        />

                        <Field
                            icon={Building2}
                            label={t("shipping.form.carrier")}
                            name="carrier"
                            as="select"
                            value={form.carrier}
                            onChange={updateField("carrier")}
                            disabled={loading}
                        >
                            {CARRIERS.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={Route}
                            label={t("shipping.form.method")}
                            name="method"
                            as="select"
                            value={form.method}
                            onChange={updateField("method")}
                            disabled={loading}
                        >
                            {SHIPPING_METHOD_KEYS.map((key) => (
                                <option key={key} value={key}>
                                    {t(`shipping.methods.${key}`)}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={Truck}
                            label={t("shipping.form.status")}
                            name="status"
                            as="select"
                            value={form.status}
                            onChange={updateField("status")}
                            disabled={loading}
                        >
                            {SHIPPING_STATUS_KEYS.map((key) => (
                                <option key={key} value={key}>
                                    {t(`shipping.status.${key}`)}
                                </option>
                            ))}
                        </Field>

                        <Field
                            icon={Weight}
                            label={t("shipping.form.weight")}
                            name="weight"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={form.weight}
                            onChange={updateField("weight")}
                            disabled={loading}
                        />

                        <Field
                            icon={DollarSign}
                            label={t("shipping.form.cost")}
                            name="cost"
                            type="number"
                            min={0}
                            placeholder="0"
                            value={form.cost}
                            onChange={updateField("cost")}
                            disabled={loading}
                        />

                        <Field
                            icon={Calendar}
                            label={t("shipping.form.shippedAt")}
                            name="shipped_at"
                            type="date"
                            value={form.shipped_at}
                            onChange={updateField("shipped_at")}
                            disabled={loading}
                        />
                    </div>
                </div>

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
                                ? t("shipping.form.successUpdate")
                                : t("shipping.form.successCreate")}
                        </span>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link
                        to="/shipping"
                        className="rounded-full border border-(--bg-border) px-5 py-2.5 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                    >
                        {t("shipping.form.cancel")}
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
                            ? t("shipping.form.update")
                            : t("shipping.form.save")}
                    </button>
                </div>
            </form>
        </>
    );
}