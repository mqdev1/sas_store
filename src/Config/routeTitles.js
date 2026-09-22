/**
 * خريطة عناوين الصفحات حسب المسار
 *
 * القيم = مفاتيح ترجمة (translation keys)
 *
 * القاعدة:
 * - الترتيب مهم (الأطول أولاً)
 * - last match wins (الأكثر تحديدًا يفوز)
 */

export const ROUTE_TITLES = [
  // ============================================
  // شاشات رئيسية (exact match أو prefix)
  // ============================================
  { path: "/", title: "home.title" },
  { path: "/orders/cancel", title: "orders.cancel.title" },
  { path: "/orders/new", title: "orders.newOrder" },
  { path: "/orders/:id/edit", title: "orders.editOrder" },
  { path: "/orders/:id", title: "orders.details.title" },
  { path: "/orders", title: "orders.title" },

  { path: "/products/new", title: "products.newProduct" },
  { path: "/products/:id/edit", title: "products.editProduct" },
  { path: "/products/:id", title: "products.details.title" },
  { path: "/products", title: "products.title" },

  { path: "/categories/new", title: "categories.newCategory" },
  { path: "/categories/:id/edit", title: "categories.editCategory" },
  { path: "/categories/:id", title: "categories.details.title" },
  { path: "/categories", title: "categories.title" },

  { path: "/clients/new", title: "clients.newClient" },
  { path: "/clients/:id/edit", title: "clients.editClient" },
  { path: "/clients/:id", title: "clients.details.title" },
  { path: "/clients", title: "clients.title" },

  {
    path: "/shipping-carriers/new",
    title: "shippingCarriers.form.createTitle",
  },
  {
    path: "/shipping-carriers/:id/edit",
    title: "shippingCarriers.form.editTitle",
  },
  { path: "/shipping-carriers/:id", title: "shippingCarriers.details.title" },
  { path: "/shipping-carriers", title: "shippingCarriers.title" },

  { path: "/shipping/new", title: "shipping.newShipment" },
  { path: "/shipping/:id/edit", title: "shipping.editShipment" },
  { path: "/shipping/:id", title: "shipping.details.title" },
  { path: "/shipping", title: "shipping.title" },

  { path: "/payment-gateways/new", title: "paymentGateways.form.createTitle" },
  {
    path: "/payment-gateways/:id/edit",
    title: "paymentGateways.form.editTitle",
  },
  { path: "/payment-gateways/:id", title: "paymentGateways.details.title" },
  { path: "/payment-gateways", title: "paymentGateways.title" },

  { path: "/payments/new", title: "payments.newPayment" },
  { path: "/payments/:id/edit", title: "payments.editPayment" },
  { path: "/payments/:id", title: "payments.details.title" },
  { path: "/payments", title: "payments.title" },

  { path: "/users/new", title: "users.form.createTitle" },
  { path: "/users/:id/edit", title: "users.form.editTitle" },
  { path: "/users/:id", title: "users.details.title" },
  { path: "/users", title: "users.title" },

  { path: "/agents/new", title: "agents.form.createTitle" },
  { path: "/agents/:id/edit", title: "agents.form.editTitle" },
  { path: "/agents/:id", title: "agents.details.title" },
  { path: "/agents", title: "agents.title" },

  { path: "/reports", title: "reports.title" },
  { path: "/settings", title: "settings.title" },
  { path: "/profile", title: "profile.title" },
];

/**
 * إيجاد العنوان المناسب حسب المسار الحالي
 */
export function getRouteTitle(pathname) {
  // طبّع المسار (شيل الشرطة المائلة الأخيرة)
  const cleanPath = pathname.replace(/\/$/, "") || "/";

  for (const route of ROUTE_TITLES) {
    if (matchPath(route.path, cleanPath)) {
      return route.title;
    }
  }

  return null;
}

/**
 * مطابقة بسيطة للمسار مع دعم :id
 */
function matchPath(pattern, pathname) {
  // "/" بالضبط
  if (pattern === "/") return pathname === "/";

  // قسّم لأجزاء
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  // عدد الأجزاء لازم يكون متساوي
  if (patternParts.length !== pathParts.length) return false;

  // قارن كل جزء
  return patternParts.every((part, i) => {
    // :id أو :xxx → أي قيمة
    if (part.startsWith(":")) return true;
    // تطابق حرفي
    return part === pathParts[i];
  });
}
