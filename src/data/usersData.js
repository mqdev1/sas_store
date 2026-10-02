// src/data/usersData.js

// ============================================
// الأدوار (لازم تتوافق مع check constraint في DB)
// ============================================
export const ROLES = [
    { key: "admin", label: "مدير عام" },
    { key: "manager", label: "مدير" },
    { key: "supervisor", label: "مشرف" },
    { key: "staff", label: "موظف" },
    { key: "accountant", label: "محاسب" },
    { key: "support", label: "دعم فني" },
];

// ============================================
// الصلاحيات
// ============================================
export const PERMISSIONS = [
    { key: "dashboard.view", label: "عرض لوحة التحكم", group: "عام" },
    { key: "products.view", label: "عرض المنتجات", group: "المنتجات" },
    { key: "products.create", label: "إضافة منتجات", group: "المنتجات" },
    { key: "products.edit", label: "تعديل منتجات", group: "المنتجات" },
    { key: "products.delete", label: "حذف منتجات", group: "المنتجات" },
    { key: "orders.view", label: "عرض الطلبات", group: "الطلبات" },
    { key: "orders.create", label: "إنشاء طلبات", group: "الطلبات" },
    { key: "orders.edit", label: "تعديل الطلبات", group: "الطلبات" },
    { key: "orders.delete", label: "حذف الطلبات", group: "الطلبات" },
    { key: "clients.view", label: "عرض العملاء", group: "العملاء" },
    { key: "clients.edit", label: "تعديل العملاء", group: "العملاء" },
    { key: "clients.delete", label: "حذف العملاء", group: "العملاء" },
    { key: "payments.view", label: "عرض المدفوعات", group: "المدفوعات" },
    { key: "payments.refund", label: "استرجاع المدفوعات", group: "المدفوعات" },
    { key: "shipping.view", label: "عرض الشحن", group: "الشحن" },
    { key: "shipping.edit", label: "تعديل الشحن", group: "الشحن" },
    { key: "users.view", label: "عرض المستخدمين", group: "المستخدمون" },
    { key: "users.create", label: "إضافة مستخدمين", group: "المستخدمون" },
    { key: "users.edit", label: "تعديل المستخدمين", group: "المستخدمون" },
    { key: "users.delete", label: "حذف المستخدمين", group: "المستخدمون" },
    { key: "settings.edit", label: "تعديل الإعدادات", group: "الإعدادات" },
    { key: "reports.view", label: "عرض التقارير", group: "التقارير" },
];

// ============================================
// الصلاحيات الافتراضية لكل دور
// ============================================
export function getDefaultPermissions(roleKey) {
    switch (roleKey) {
        case "admin":
            return PERMISSIONS.map((p) => p.key);
        case "manager":
            return PERMISSIONS.filter(
                (p) => !p.key.startsWith("users.") && p.key !== "settings.edit"
            ).map((p) => p.key);
        case "supervisor":
            return PERMISSIONS.filter(
                (p) =>
                    p.key.endsWith(".view") ||
                    p.key === "orders.edit" ||
                    p.key === "products.edit" ||
                    p.key === "clients.edit"
            ).map((p) => p.key);
        case "accountant":
            return [
                "dashboard.view",
                "orders.view",
                "payments.view",
                "payments.refund",
                "reports.view",
            ];
        case "support":
            return [
                "dashboard.view",
                "orders.view",
                "clients.view",
                "shipping.view",
            ];
        case "staff":
        default:
            return ["dashboard.view", "orders.view", "products.view"];
    }
}

// ============================================
// ألوان وحالات
// ============================================
export function getUserStatusColor(status) {
    return status === "active"
        ? "text-(--color-mint) bg-(--color-mint)/10"
        : "text-(--text-muted) bg-(--bg-hover)";
}

export function getRoleColor(role) {
    switch (role) {
        case "admin":
            return "text-(--color-error) bg-(--color-error)/10";
        case "manager":
            return "text-(--color-pink) bg-(--color-pink)/10";
        case "supervisor":
            return "text-(--color-lavender) bg-(--color-lavender)/10";
        case "accountant":
            return "text-(--color-mint) bg-(--color-mint)/10";
        case "support":
            return "text-(--color-amber) bg-(--color-amber)/10";
        default:
            return "text-(--text-muted) bg-(--bg-hover)";
    }
}

export function getRoleLabel(roleKey) {
    const role = ROLES.find((r) => r.key === roleKey);
    return role ? role.label : roleKey;
}