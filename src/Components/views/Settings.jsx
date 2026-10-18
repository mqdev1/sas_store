import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
    Settings as SettingsIcon,
    Save,
    RotateCcw,
    Palette,
    Globe,
    Bell,
    Shield,
    CreditCard,
    Check,
    Sun,
    Moon,
    Monitor,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { TemplateDarkMode } from "../../Store/TemplateSettings";
import {
    DEFAULT_SETTINGS,
    LANGUAGES,
    TIMEZONES,
    DATE_FORMATS,
    CURRENCIES,
    PRIMARY_COLORS,
} from "../../data/settingsData";

const STORAGE_KEY = "app_settings";

// ============================================
// مكون Toggle
// ============================================
function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                checked
                    ? "bg-(--color-lavender)"
                    : "bg-(--bg-border)"
            }`}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                    checked ? "left-5.5" : "left-0.5"
                }`}
                style={{ left: checked ? 22 : 2 }}
            />
        </button>
    );
}

// ============================================
// مكون سطر إعداد
// ============================================
function SettingRow({ title, description, children }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-(--bg-border) py-3 last:border-b-0">
            <div className="flex flex-col">
                <span className="text-sm font-medium text-(--text-primary)">
                    {title}
                </span>
                {description && (
                    <span className="mt-0.5 text-xs text-(--text-muted)">
                        {description}
                    </span>
                )}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

// ============================================
// مكون حقل إدخال
// ============================================
function Field({ label, children }) {
    return (
        <div className="flex w-full flex-col gap-1.5">
            <label className="text-xs font-medium text-(--text-secondary)">
                {label}
            </label>
            {children}
        </div>
    );
}

const inputClass =
    "w-full rounded-xl border border-(--bg-border) bg-(--bg-elevated) p-2.5 text-sm text-(--text-primary) outline-0 transition-colors focus:border-(--color-lavender)";

// ============================================
// التبويبات
// ============================================
const TABS = [
    { key: "general", icon: Globe },
    { key: "appearance", icon: Palette },
    { key: "notifications", icon: Bell },
    { key: "security", icon: Shield },
    { key: "payments", icon: CreditCard },
];

// ============================================
// الصفحة
// ============================================
export default function Settings() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const darkMode = useSelector(TemplateDarkMode);
    const isDark = darkMode === "dark" || darkMode === true;

    const [activeTab, setActiveTab] = useState("general");
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    // ✅ تحميل الإعدادات من localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSettings((prev) => ({ ...prev, ...parsed }));
            }
        } catch (e) {
            console.warn(
                t("settings.loadFailed", { error: e.message })
            );
        }
    }, [t]);

    // ✅ تحديث حقل معيّن
    const update = (section, key, value) => {
        setSettings((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
        setSaved(false);
    };

    // ✅ حفظ
    const handleSave = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            alert(
                t("settings.saveFailed", { error: e.message })
            );
        }
    };

    // ✅ استعادة الافتراضي
    const handleReset = () => {
        if (confirm(t("settings.resetConfirm"))) {
            setSettings(DEFAULT_SETTINGS);
            localStorage.removeItem(STORAGE_KEY);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    // ✅ عدد التغييرات
    const changedCount = useMemo(() => {
        return (
            JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS)
        );
    }, [settings]);

    return (
        <>
            {/* رأس الصفحة */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        <SettingsIcon
                            size={22}
                            className="text-(--color-lavender)"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {t("settings.title")}
                        </h1>
                        <p className="mt-0.5 text-sm text-(--text-muted)">
                            {t("settings.subtitle")}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-2 rounded-full border border-(--bg-border) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-error)"
                    >
                        <RotateCcw size={14} />
                        <span>{t("settings.reset")}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!changedCount}
                        className="flex items-center gap-2 rounded-full bg-(--color-lavender) px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saved ? (
                            <CheckCircle2 size={14} />
                        ) : (
                            <Save size={14} />
                        )}
                        <span>
                            {saved
                                ? t("settings.saved")
                                : t("settings.save")}
                        </span>
                    </button>
                </div>
            </div>

            {/* تحذير التغييرات غير المحفوظة */}
            {changedCount && !saved && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-(--color-amber)/40 bg-(--color-amber)/5 p-3 text-sm">
                    <AlertCircle
                        size={18}
                        className="shrink-0 text-(--color-amber)"
                    />
                    <span className="text-(--text-primary)">
                        {t("settings.unsavedWarning")}
                    </span>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-4">
                {/* القائمة الجانبية للتبويبات */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 flex flex-col gap-1 rounded-xl border border-(--bg-border) bg-(--bg-card) p-2">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-(--color-lavender)/10 text-(--color-lavender)"
                                            : "text-(--text-secondary) hover:bg-(--bg-hover)"
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span>
                                        {t(`settings.tabs.${tab.key}`)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* محتوى التبويب */}
                <div className="lg:col-span-3">
                    {/* ═══════════════ عام ═══════════════ */}
                    {activeTab === "general" && (
                        <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                            <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                                {t("settings.general.title")}
                            </h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label={t("settings.general.siteName")}
                                >
                                    <input
                                        value={settings.general.siteName}
                                        onChange={(e) =>
                                            update(
                                                "general",
                                                "siteName",
                                                e.target.value
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </Field>

                                <Field
                                    label={t(
                                        "settings.general.siteDescription"
                                    )}
                                >
                                    <input
                                        value={
                                            settings.general.siteDescription
                                        }
                                        onChange={(e) =>
                                            update(
                                                "general",
                                                "siteDescription",
                                                e.target.value
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </Field>

                                <Field
                                    label={t("settings.general.language")}
                                >
                                    <select
                                        value={settings.general.language}
                                        onChange={(e) =>
                                            update(
                                                "general",
                                                "language",
                                                e.target.value
                                            )
                                        }
                                        className={inputClass}
                                    >
                                        {LANGUAGES.map((l) => (
                                            <option
                                                key={l.code}
                                                value={l.code}
                                            >
                                                {l.flag} {l.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field
                                    label={t("settings.general.timezone")}
                                >
                                    <select
                                        value={settings.general.timezone}
                                        onChange={(e) =>
                                            update(
                                                "general",
                                                "timezone",
                                                e.target.value
                                            )
                                        }
                                        className={inputClass}
                                    >
                                        {TIMEZONES.map((tz) => (
                                            <option key={tz} value={tz}>
                                                {tz}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field
                                    label={t(
                                        "settings.general.dateFormat"
                                    )}
                                >
                                    <select
                                        value={settings.general.dateFormat}
                                        onChange={(e) =>
                                            update(
                                                "general",
                                                "dateFormat",
                                                e.target.value
                                            )
                                        }
                                        className={inputClass}
                                    >
                                        {DATE_FORMATS.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field
                                    label={t("settings.general.currency")}
                                >
                                    <select
                                        value={settings.general.currency}
                                        onChange={(e) =>
                                            update(
                                                "general",
                                                "currency",
                                                e.target.value
                                            )
                                        }
                                        className={inputClass}
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option
                                                key={c.code}
                                                value={c.code}
                                            >
                                                {c.code} {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════ المظهر ═══════════════ */}
                    {activeTab === "appearance" && (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                                <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                                    {t("settings.appearance.title")}
                                </h2>

                                {/* الوضع */}
                                <div className="mb-4">
                                    <span className="mb-2 block text-xs font-medium text-(--text-secondary)">
                                        {t("settings.appearance.theme")}
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            {
                                                key: "light",
                                                icon: Sun,
                                                labelKey:
                                                    "settings.appearance.themeLight",
                                            },
                                            {
                                                key: "dark",
                                                icon: Moon,
                                                labelKey:
                                                    "settings.appearance.themeDark",
                                            },
                                            {
                                                key: "system",
                                                icon: Monitor,
                                                labelKey:
                                                    "settings.appearance.themeSystem",
                                            },
                                        ].map((m) => {
                                            const Icon = m.icon;
                                            const active =
                                                settings.appearance
                                                    .theme === m.key;
                                            return (
                                                <button
                                                    key={m.key}
                                                    type="button"
                                                    onClick={() =>
                                                        update(
                                                            "appearance",
                                                            "theme",
                                                            m.key
                                                        )
                                                    }
                                                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
                                                        active
                                                            ? "border-(--color-lavender) bg-(--color-lavender)/10"
                                                            : "border-(--bg-border) hover:bg-(--bg-hover)"
                                                    }`}
                                                >
                                                    <Icon
                                                        size={20}
                                                        className={
                                                            active
                                                                ? "text-(--color-lavender)"
                                                                : "text-(--text-secondary)"
                                                        }
                                                    />
                                                    <span
                                                        className={`text-xs font-medium ${
                                                            active
                                                                ? "text-(--color-lavender)"
                                                                : "text-(--text-secondary)"
                                                        }`}
                                                    >
                                                        {t(m.labelKey)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* اللون الأساسي */}
                                <div className="mb-4">
                                    <span className="mb-2 block text-xs font-medium text-(--text-secondary)">
                                        {t(
                                            "settings.appearance.primaryColor"
                                        )}
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {PRIMARY_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() =>
                                                    update(
                                                        "appearance",
                                                        "primaryColor",
                                                        c
                                                    )
                                                }
                                                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                                                    settings.appearance
                                                        .primaryColor === c
                                                        ? "border-(--text-primary)"
                                                        : "border-transparent"
                                                }`}
                                                style={{ background: c }}
                                            >
                                                {settings.appearance
                                                    .primaryColor === c && (
                                                    <Check
                                                        size={14}
                                                        className="text-white"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* حجم الخط */}
                                <Field
                                    label={t(
                                        "settings.appearance.fontSize"
                                    )}
                                >
                                    <select
                                        value={
                                            settings.appearance.fontSize
                                        }
                                        onChange={(e) =>
                                            update(
                                                "appearance",
                                                "fontSize",
                                                e.target.value
                                            )
                                        }
                                        className={inputClass}
                                    >
                                        <option value="small">
                                            {t(
                                                "settings.appearance.fontSmall"
                                            )}
                                        </option>
                                        <option value="medium">
                                            {t(
                                                "settings.appearance.fontMedium"
                                            )}
                                        </option>
                                        <option value="large">
                                            {t(
                                                "settings.appearance.fontLarge"
                                            )}
                                        </option>
                                    </select>
                                </Field>
                            </div>

                            <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                                <SettingRow
                                    title={t(
                                        "settings.appearance.sidebarCompact"
                                    )}
                                    description={t(
                                        "settings.appearance.sidebarCompactHint"
                                    )}
                                >
                                    <Toggle
                                        checked={
                                            settings.appearance
                                                .sidebarCompact
                                        }
                                        onChange={(v) =>
                                            update(
                                                "appearance",
                                                "sidebarCompact",
                                                v
                                            )
                                        }
                                    />
                                </SettingRow>

                                <SettingRow
                                    title={t(
                                        "settings.appearance.animations"
                                    )}
                                    description={t(
                                        "settings.appearance.animationsHint"
                                    )}
                                >
                                    <Toggle
                                        checked={
                                            settings.appearance.animations
                                        }
                                        onChange={(v) =>
                                            update(
                                                "appearance",
                                                "animations",
                                                v
                                            )
                                        }
                                    />
                                </SettingRow>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════ الإشعارات ═══════════════ */}
                    {activeTab === "notifications" && (
                        <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                            <h2 className="mb-2 text-base font-semibold text-(--text-primary)">
                                {t("settings.notifications.title")}
                            </h2>
                            <p className="mb-4 text-xs text-(--text-muted)">
                                {t("settings.notifications.subtitle")}
                            </p>

                            <SettingRow
                                title={t("settings.notifications.email")}
                                description={t(
                                    "settings.notifications.emailHint"
                                )}
                            >
                                <Toggle
                                    checked={settings.notifications.email}
                                    onChange={(v) =>
                                        update("notifications", "email", v)
                                    }
                                />
                            </SettingRow>

                            <SettingRow
                                title={t("settings.notifications.push")}
                                description={t(
                                    "settings.notifications.pushHint"
                                )}
                            >
                                <Toggle
                                    checked={settings.notifications.push}
                                    onChange={(v) =>
                                        update("notifications", "push", v)
                                    }
                                />
                            </SettingRow>

                            <SettingRow
                                title={t("settings.notifications.orders")}
                                description={t(
                                    "settings.notifications.ordersHint"
                                )}
                            >
                                <Toggle
                                    checked={settings.notifications.orders}
                                    onChange={(v) =>
                                        update(
                                            "notifications",
                                            "orders",
                                            v
                                        )
                                    }
                                />
                            </SettingRow>

                            <SettingRow
                                title={t("settings.notifications.payments")}
                                description={t(
                                    "settings.notifications.paymentsHint"
                                )}
                            >
                                <Toggle
                                    checked={
                                        settings.notifications.payments
                                    }
                                    onChange={(v) =>
                                        update(
                                            "notifications",
                                            "payments",
                                            v
                                        )
                                    }
                                />
                            </SettingRow>

                            <SettingRow
                                title={t("settings.notifications.shipping")}
                                description={t(
                                    "settings.notifications.shippingHint"
                                )}
                            >
                                <Toggle
                                    checked={
                                        settings.notifications.shipping
                                    }
                                    onChange={(v) =>
                                        update(
                                            "notifications",
                                            "shipping",
                                            v
                                        )
                                    }
                                />
                            </SettingRow>

                            <SettingRow
                                title={t(
                                    "settings.notifications.marketing"
                                )}
                                description={t(
                                    "settings.notifications.marketingHint"
                                )}
                            >
                                <Toggle
                                    checked={
                                        settings.notifications.marketing
                                    }
                                    onChange={(v) =>
                                        update(
                                            "notifications",
                                            "marketing",
                                            v
                                        )
                                    }
                                />
                            </SettingRow>

                            <SettingRow
                                title={t("settings.notifications.sound")}
                                description={t(
                                    "settings.notifications.soundHint"
                                )}
                            >
                                <Toggle
                                    checked={settings.notifications.sound}
                                    onChange={(v) =>
                                        update(
                                            "notifications",
                                            "sound",
                                            v
                                        )
                                    }
                                />
                            </SettingRow>
                        </div>
                    )}

                    {/* ═══════════════ الأمان ═══════════════ */}
                    {activeTab === "security" && (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                                <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                                    {t("settings.security.title")}
                                </h2>

                                <SettingRow
                                    title={t("settings.security.twoFactor")}
                                    description={t(
                                        "settings.security.twoFactorHint"
                                    )}
                                >
                                    <Toggle
                                        checked={settings.security.twoFactor}
                                        onChange={(v) =>
                                            update(
                                                "security",
                                                "twoFactor",
                                                v
                                            )
                                        }
                                    />
                                </SettingRow>

                                <SettingRow
                                    title={t(
                                        "settings.security.loginAlerts"
                                    )}
                                    description={t(
                                        "settings.security.loginAlertsHint"
                                    )}
                                >
                                    <Toggle
                                        checked={
                                            settings.security.loginAlerts
                                        }
                                        onChange={(v) =>
                                            update(
                                                "security",
                                                "loginAlerts",
                                                v
                                            )
                                        }
                                    />
                                </SettingRow>

                                <div className="border-t border-(--bg-border) pt-4">
                                    <Field
                                        label={t(
                                            "settings.security.sessionTimeout"
                                        )}
                                    >
                                        <input
                                            type="number"
                                            min={5}
                                            max={120}
                                            value={
                                                settings.security
                                                    .sessionTimeout
                                            }
                                            onChange={(e) =>
                                                update(
                                                    "security",
                                                    "sessionTimeout",
                                                    Number(e.target.value)
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>

                                <div className="mt-4">
                                    <Field
                                        label={t(
                                            "settings.security.ipWhitelist"
                                        )}
                                    >
                                        <textarea
                                            rows={3}
                                            placeholder={t(
                                                "settings.security.ipWhitelistPlaceholder"
                                            )}
                                            value={
                                                settings.security
                                                    .ipWhitelist
                                            }
                                            onChange={(e) =>
                                                update(
                                                    "security",
                                                    "ipWhitelist",
                                                    e.target.value
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════ المدفوعات ═══════════════ */}
                    {activeTab === "payments" && (
                        <div className="rounded-xl border border-(--bg-border) bg-(--bg-card) p-4">
                            <h2 className="mb-4 text-base font-semibold text-(--text-primary)">
                                {t("settings.payments.title")}
                            </h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label={t("settings.payments.taxRate")}
                                >
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.1"
                                        value={
                                            settings.payments.taxRate
                                        }
                                        onChange={(e) =>
                                            update(
                                                "payments",
                                                "taxRate",
                                                Number(e.target.value)
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </Field>

                                <Field
                                    label={t(
                                        "settings.payments.processingFee"
                                    )}
                                >
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.1"
                                        value={
                                            settings.payments
                                                .processingFee
                                        }
                                        onChange={(e) =>
                                            update(
                                                "payments",
                                                "processingFee",
                                                Number(e.target.value)
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </Field>

                                <Field
                                    label={t(
                                        "settings.payments.minOrder"
                                    )}
                                >
                                    <input
                                        type="number"
                                        min={0}
                                        value={
                                            settings.payments.minOrder
                                        }
                                        onChange={(e) =>
                                            update(
                                                "payments",
                                                "minOrder",
                                                Number(e.target.value)
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </Field>
                            </div>

                            <div className="mt-4 border-t border-(--bg-border) pt-4">
                                <SettingRow
                                    title={t(
                                        "settings.payments.autoRefund"
                                    )}
                                    description={t(
                                        "settings.payments.autoRefundHint"
                                    )}
                                >
                                    <Toggle
                                        checked={
                                            settings.payments.autoRefund
                                        }
                                        onChange={(v) =>
                                            update(
                                                "payments",
                                                "autoRefund",
                                                v
                                            )
                                        }
                                    />
                                </SettingRow>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}