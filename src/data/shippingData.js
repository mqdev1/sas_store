import { CHART_COLORS, CLIENTS, ADDRESSES } from "./dashboardData";

// ============================================
// شركات الشحن
// ============================================
export const CARRIERS = ["Aramex", "DHL", "FedEx", "UPS", "Local Express"];

// ============================================
// حالات الشحن
// ============================================
export const SHIPPING_STATUSES = [
  "قيد التحضير",
  "تم الشحن",
  "في الطريق",
  "تم التسليم",
  "مؤجل",
  "ملغي",
];

// ============================================
// طرق الشحن
// ============================================
export const SHIPPING_METHODS = [
  "عادي",
  "سريع",
  "توصيل اليوم",
  "استلام من الفرع",
];

// ============================================
// توليد الشحنات
// ============================================
export function generateShipments(count = 60) {
  return Array.from({ length: count }, (_, i) => {
    const client = CLIENTS[i % CLIENTS.length];
    const address = ADDRESSES[i % ADDRESSES.length];
    const [country, city] = address.split("-");

    const status =
      SHIPPING_STATUSES[Math.floor(Math.random() * SHIPPING_STATUSES.length)];
    const carrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
    const method =
      SHIPPING_METHODS[Math.floor(Math.random() * SHIPPING_METHODS.length)];

    const weight = +(Math.random() * 20 + 0.5).toFixed(2);
    const cost = Math.round(weight * 15 + Math.random() * 50);

    // تواريخ
    const shippedAt = new Date(
      2024,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1,
    );
    const deliveredAt = new Date(
      shippedAt.getTime() + (Math.random() * 7 + 1) * 86400000,
    );

    return {
      id: i + 1,
      tracking: `TRK-${String(i + 1).padStart(5, "0")}`,
      client,
      carrier,
      method,
      status,
      weight,
      cost,
      country,
      city,
      address,
      shipped_at: shippedAt.toISOString().slice(0, 10),
      delivered_at:
        status === "تم التسليم" ? deliveredAt.toISOString().slice(0, 10) : null,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
}

// ============================================
// إحصائيات الشحن
// ============================================
export function getShippingStats(shipments) {
  const total = shipments.length;
  const delivered = shipments.filter((s) => s.status === "تم التسليم").length;
  const inTransit = shipments.filter(
    (s) => s.status === "في الطريق" || s.status === "تم الشحن",
  ).length;
  const pending = shipments.filter((s) => s.status === "قيد التحضير").length;
  const delayed = shipments.filter((s) => s.status === "مؤجل").length;
  const cancelled = shipments.filter((s) => s.status === "ملغي").length;

  const totalCost = shipments.reduce((s, x) => s + x.cost, 0);
  const totalWeight = shipments.reduce((s, x) => s + x.weight, 0);

  return {
    total,
    delivered,
    inTransit,
    pending,
    delayed,
    cancelled,
    totalCost: Math.round(totalCost),
    totalWeight: +totalWeight.toFixed(2),
    deliveryRate: total ? Math.round((delivered / total) * 100) : 0,
  };
}

// ============================================
// حالة الشحن → لون
// ============================================
export function getShippingStatusColor(status) {
  switch (status) {
    case "تم التسليم":
      return "text-(--color-mint) bg-(--color-mint)/10";
    case "في الطريق":
      return "text-(--color-lavender) bg-(--color-lavender)/10";
    case "تم الشحن":
      return "text-(--color-amber) bg-(--color-amber)/10";
    case "قيد التحضير":
      return "text-(--color-pink) bg-(--color-pink)/10";
    case "مؤجل":
      return "text-(--color-error) bg-(--color-error)/10";
    case "ملغي":
      return "text-(--text-muted) bg-(--bg-hover)";
    default:
      return "text-(--text-muted) bg-(--bg-hover)";
  }
}

// ============================================
// توزيع الحالات (للـ Donut)
// ============================================
export function getStatusDistribution(shipments) {
  const grouped = shipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([label, value], i) => ({
    id: i,
    label,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

// ============================================
// الشحنات حسب شركة الشحن (Bar)
// ============================================
export function getShipmentsByCarrier(shipments) {
  const grouped = shipments.reduce((acc, s) => {
    acc[s.carrier] = (acc[s.carrier] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .map((item, i) => ({
      ...item,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}
