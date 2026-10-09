import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Percent,
    Plus,
    Trash2,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Globe,
    Settings2,
} from "lucide-react";
import { useDialogContext } from "../../Context/DialogContext";
import * as taxService from "../../Services/taxService";

// ============================================
// Field
// ============================================
function Field({ label, children, error }) {
    return (
        <div className="flex w-full flex-col gap-1.5">
            {label && (
                <label className="ps-1 text-xs font-medium text-(--text-secondary)">
                    {label}
                </label>
            )}
            {children}
            {error && (
                <span className="ps-1 text-xs text-(--color-error)">
                    {error}
                </span>
            )}
        </div>
    );
}

const inputClass =
    "w-full rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 focus:border-(--color-lavender)";

// ============================================
// Toggle
// ============================================
function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-(--color-lavender)" : "bg-(--bg-border)"
                }`}
        >
            <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
                style={{ left: checked ? 22 : 2 }}
            />
        </button>
    );
}

// ============================================
// الصفحة
// ============================================
export default function TaxSettings() {
    const { t } = useTranslation();
    const dialog = useDialogContext();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        tax_enabled: true,
        prices_include_tax: false,
        show_tax_breakdown: true,
        default_tax_name: "VAT",
    });

    const [regions, setRegions] = useState([]);
    const [editingRegion, setEditingRegion] = useState(null);
    const [newRegion, setNewRegion] = useState({
        country_code: "",
        country_name: "",
        tax_name: "VAT",
        tax_rate: 0,
        is_active: true,
        is_default: false,
    });

    // ============================================
    // تحميل
    // ============================================
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [settingsRes, regionsRes] = await Promise.all([
                taxService.getTaxSettings(),
                taxService.getAllRegions(),
            ]);
            setSettings(settingsRes);
            setRegions(regionsRes);
        } catch (err) {
            console.error(err);
            dialog.alert(err.message);
        } finally {
            setLoading(false);
        }
    }, [dialog]);

    useEffect(() => {
        load();
    }, [load]);

    // ============================================
    // حفظ الإعدادات
    // ============================================
    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await taxService.updateTaxSettings(settings);
            dialog.alert(t("tax.savedSuccess"));
        } catch (err) {
            dialog.alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // إضافة منطقة
    // ============================================
    const handleAddRegion = async () => {
        if (!newRegion.country_code || !newRegion.country_name) {
            dialog.alert(t("tax.required.country"));
            return;
        }

        try {
            await taxService.createRegion({
                ...newRegion,
                tax_rate: Number(newRegion.tax_rate) || 0,
            });
            setNewRegion({
                country_code: "",
                country_name: "",
                tax_name: "VAT",
                tax_rate: 0,
                is_active: true,
                is_default: false,
            });
            await load();
        } catch (err) {
            dialog.alert(err.message);
        }
    };

    // ============================================
    // حذف منطقة
    // ============================================
    const handleDeleteRegion = async (region) => {
        const ok = await dialog.confirm(
            t("tax.confirmDelete", { name: region.country_name })
        );
        if (!ok) return;

        try {
            await taxService.removeRegion(region.id);
            await load();
        } catch (err) {
            dialog.alert(err.message);
        }
    };

    // ============================================
    // تحديث منطقة (inline)
    // ============================================
    const handleUpdateRegion = async (region) => {
        try {
            await taxService.updateRegion(region.id, {
                tax_rate: Number(region.tax_rate),
                tax_name: region.tax_name,
                is_active: region.is_active,
                is_default: region.is_default,
            });
            setEditingRegion(null);
            await load();
        } catch (err) {
            dialog.alert(err.message);
        }
    };

    // ============================================
    // Loading
    // ============================================
    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2
                    size={32}
                    className="animate-spin text-(--color-lavender)"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* رأس الصفحة */}
            <div className="flex items-center gap-3">
                <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2.5">
                    <Percent
                        size={24}
                        className="text-(--color-amber)"
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-(--text-primary)">
                        {t("tax.title")}
                    </h1>
                    <p className="mt-1 text-sm text-(--text-muted)">
                        {t("tax.subtitle")}
                    </p>
                </div>
            </div>

            {/* ============================================
                الإعدادات العامة
            ============================================ */}
            <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                <div className="mb-4 flex items-center gap-2">
                    <Settings2
                        size={18}
                        className="text-(--color-lavender)"
                    />
                    <h2 className="text-base font-semibold text-(--text-primary)">
                        {t("tax.generalSettings")}
                    </h2>
                </div>

                <div className="flex flex-col gap-4">
                    {/* تفعيل الضريبة */}
                    <div className="flex items-center justify-between rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3">
                        <div>
                            <span className="text-sm font-medium text-(--text-primary)">
                                {t("tax.enableTax")}
                            </span>
                            <p className="text-xs text-(--text-muted)">
                                {t("tax.enableTaxHint")}
                            </p>
                        </div>
                        <Toggle
                            checked={settings.tax_enabled}
                            onChange={(v) =>
                                setSettings((s) => ({
                                    ...s,
                                    tax_enabled: v,
                                }))
                            }
                        />
                    </div>

                    {/* الأسعار شاملة الضريبة */}
                    <div className="flex items-center justify-between rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3">
                        <div>
                            <span className="text-sm font-medium text-(--text-primary)">
                                {t("tax.pricesIncludeTax")}
                            </span>
                            <p className="text-xs text-(--text-muted)">
                                {t("tax.pricesIncludeTaxHint")}
                            </p>
                        </div>
                        <Toggle
                            checked={settings.prices_include_tax}
                            onChange={(v) =>
                                setSettings((s) => ({
                                    ...s,
                                    prices_include_tax: v,
                                }))
                            }
                        />
                    </div>

                    {/* إظهار التفصيل */}
                    <div className="flex items-center justify-between rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3">
                        <div>
                            <span className="text-sm font-medium text-(--text-primary)">
                                {t("tax.showBreakdown")}
                            </span>
                            <p className="text-xs text-(--text-muted)">
                                {t("tax.showBreakdownHint")}
                            </p>
                        </div>
                        <Toggle
                            checked={settings.show_tax_breakdown}
                            onChange={(v) =>
                                setSettings((s) => ({
                                    ...s,
                                    show_tax_breakdown: v,
                                }))
                            }
                        />
                    </div>

                    {/* اسم الضريبة الافتراضي */}
                    <Field label={t("tax.defaultTaxName")}>
                        <input
                            type="text"
                            value={settings.default_tax_name}
                            onChange={(e) =>
                                setSettings((s) => ({
                                    ...s,
                                    default_tax_name: e.target.value,
                                }))
                            }
                            placeholder="VAT / GST / Sales Tax"
                            className={inputClass}
                        />
                    </Field>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {t("common.save")}
                    </button>
                </div>
            </div>

            {/* ============================================
                المناطق الضريبية
            ============================================ */}
            <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                <div className="mb-4 flex items-center gap-2">
                    <Globe
                        size={18}
                        className="text-(--color-mint)"
                    />
                    <h2 className="text-base font-semibold text-(--text-primary)">
                        {t("tax.regions")}
                    </h2>
                </div>

                <p className="mb-4 text-xs text-(--text-muted)">
                    {t("tax.regionsHint")}
                </p>

                {/* إضافة منطقة جديدة */}
                <div className="mb-4 grid gap-3 rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3 md:grid-cols-5">
                    <input
                        type="text"
                        placeholder={t("tax.countryCode")}
                        value={newRegion.country_code}
                        onChange={(e) =>
                            setNewRegion((r) => ({
                                ...r,
                                country_code: e.target.value
                                    .toUpperCase()
                                    .slice(0, 3),
                            }))
                        }
                        className={inputClass}
                    />
                    <input
                        type="text"
                        placeholder={t("tax.countryName")}
                        value={newRegion.country_name}
                        onChange={(e) =>
                            setNewRegion((r) => ({
                                ...r,
                                country_name: e.target.value,
                            }))
                        }
                        className={inputClass}
                    />
                    <input
                        type="text"
                        placeholder={t("tax.taxName")}
                        value={newRegion.tax_name}
                        onChange={(e) =>
                            setNewRegion((r) => ({
                                ...r,
                                tax_name: e.target.value,
                            }))
                        }
                        className={inputClass}
                    />
                    <input
                        type="number"
                        placeholder={t("tax.rate")}
                        min={0}
                        max={100}
                        step="0.01"
                        value={newRegion.tax_rate}
                        onChange={(e) =>
                            setNewRegion((r) => ({
                                ...r,
                                tax_rate: e.target.value,
                            }))
                        }
                        className={inputClass}
                    />
                    <button
                        type="button"
                        onClick={handleAddRegion}
                        className="flex items-center justify-center gap-2 rounded-xl bg-(--color-lavender) px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    >
                        <Plus size={15} />
                        {t("common.add")}
                    </button>
                </div>

                {/* قائمة المناطق */}
                <div className="flex flex-col gap-2">
                    {regions.length === 0 ? (
                        <p className="py-6 text-center text-sm text-(--text-muted)">
                            {t("tax.noRegions")}
                        </p>
                    ) : (
                        regions.map((region) => (
                            <div
                                key={region.id}
                                className="flex flex-wrap items-center gap-2 rounded-xl border border-(--bg-border) bg-(--bg-main)/40 p-3"
                            >
                                <span className="rounded-full bg-(--bg-hover) px-2 py-0.5 font-mono text-[10px] text-(--text-muted)">
                                    {region.country_code}
                                </span>
                                <span className="flex-1 text-sm font-medium text-(--text-primary)">
                                    {region.country_name}
                                </span>
                                <span className="rounded-full bg-(--color-lavender)/10 px-2 py-0.5 text-[10px] font-medium text-(--color-lavender)">
                                    {region.tax_name}
                                </span>
                                <span className="text-sm font-bold text-(--color-mint)">
                                    {region.tax_rate}%
                                </span>

                                {region.is_default && (
                                    <span className="rounded-full bg-(--color-amber)/10 px-2 py-0.5 text-[10px] font-bold text-(--color-amber)">
                                        Default
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDeleteRegion(region)
                                    }
                                    className="rounded-full p-1.5 text-(--color-error) transition-colors hover:bg-(--color-error)/10"
                                    title={t("common.delete")}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}