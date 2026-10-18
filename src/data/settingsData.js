// ============================================
// الإعدادات الافتراضية
// ============================================
export const DEFAULT_SETTINGS = {
    // عام
    general: {
        siteName: "Dashboard",
        siteDescription: "لوحة تحكم متكاملة لإدارة أعمالك",
        language: "ar",
        timezone: "Asia/Gaza",
        dateFormat: "DD/MM/YYYY",
        currency: "₪",
    },

    // المظهر
    appearance: {
        theme: "system", // light | dark | system
        primaryColor: "#6366F1",
        accentColor: "#8B5CF6",
        fontSize: "medium", // small | medium | large
        sidebarCompact: false,
        animations: true,
    },

    // الإشعارات
    notifications: {
        email: true,
        push: true,
        orders: true,
        payments: true,
        shipping: true,
        marketing: false,
        sound: true,
    },

    // الأمان
    security: {
        twoFactor: false,
        sessionTimeout: 30,
        ipWhitelist: "",
        loginAlerts: true,
    },

    // المدفوعات
    payments: {
        taxRate: 15,
        processingFee: 2.5,
        minOrder: 50,
        autoRefund: false,
    },
};

// ============================================
// اللغات
// ============================================
export const LANGUAGES = [
    { code: "ar", label: "العربية", flag: "🇵🇸" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

// ============================================
// المناطق الزمنية
// ============================================
export const TIMEZONES = [
    "Asia/Gaza",
    "Asia/Riyadh",
    "Asia/Dubai",
    "Africa/Cairo",
    "Europe/London",
    "Europe/Paris",
    "America/New_York",
];

// ============================================
// صيغ التاريخ
// ============================================
export const DATE_FORMATS = [
    "DD/MM/YYYY",
    "MM/DD/YYYY",
    "YYYY-MM-DD",
    "DD-MM-YYYY",
];

// ============================================
// العملات
// ============================================
export const CURRENCIES = [
    { code: "₪", label: "شيكل" },
    { code: "$", label: "دولار" },
    { code: "€", label: "يورو" },
    { code: "£", label: "جنيه" },
];

// ============================================
// الألوان الأساسية
// ============================================
export const PRIMARY_COLORS = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F43F5E",
    "#F59E0B",
    "#10B981",
    "#06B6D4",
    "#3B82F6",
];