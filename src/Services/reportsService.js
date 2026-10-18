import { supabase } from "../lib/supabase";

// ============================================
// بيانات التقارير (تجميع يومي)
// ============================================
export async function getData(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("orders")
    .select("id, total, order_date, status, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const grouped = data.reduce((acc, order) => {
    const day = order.created_at.slice(0, 10);
    if (!acc[day]) acc[day] = { date: day, orders: 0, revenue: 0 };
    acc[day].orders += 1;
    acc[day].revenue += Number(order.total || 0);
    return acc;
  }, {});

  return Object.values(grouped).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("ar-EG", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));
}

// ============================================
// KPIs
// ============================================
export async function getKPIs(days = 30) {
  const data = await getData(days);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);
  const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;

  const half = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, half).reduce((s, d) => s + d.revenue, 0);
  const secondHalf = data.slice(half).reduce((s, d) => s + d.revenue, 0);
  const growth = firstHalf
    ? +(((secondHalf - firstHalf) / firstHalf) * 100).toFixed(1)
    : 0;

  return {
    totalRevenue: Math.round(totalRevenue),
    totalOrders,
    avgOrder: Math.round(avgOrder),
    growth,
  };
}

// ============================================
// المبيعات اليومية (RPC)
// ============================================
export async function getDailySales(days = 30) {
  const { data, error } = await supabase.rpc("get_daily_sales", {
    days_count: days,
  });
  if (error) throw new Error(error.message);

  return (data || []).map((d) => ({
    label: new Date(d.day).toLocaleDateString("ar-EG", {
      day: "2-digit",
      month: "2-digit",
    }),
    value: Number(d.revenue || 0),
  }));
}

// ============================================
// أعلى المنتجات مبيعاً (RPC)
// ============================================
export async function getTopProducts(limit = 5) {
  const { data, error } = await supabase.rpc("get_top_products", {
    limit_count: limit,
  });
  if (error) throw new Error(error.message);

  return (data || []).map((p) => ({
    id: p.id,
    label: p.name,
    value: Number(p.revenue || 0),
    color: p.color || "#6366F1",
    sold: p.sold,
  }));
}

// ============================================
// المبيعات حسب الدولة (RPC)
// ============================================
export async function getSalesByCountry(limit = 5) {
  const { data, error } = await supabase.rpc("get_sales_by_country", {
    limit_count: limit,
  });
  if (error) throw new Error(error.message);

  return (data || []).map((c, i) => ({
    id: i,
    label: c.country_name, // ← تغيّر من country
    value: Number(c.total_revenue || 0),
  }));
}

// ============================================
// حالات الطلبات
// ============================================
export async function getOrdersByStatus() {
  const { data, error } = await supabase.from("orders").select("status");
  if (error) throw new Error(error.message);

  const grouped = data.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const COLORS = {
    pending: "#F59E0B",
    processing: "#8B5CF6",
    shipped: "#3B82F6",
    delivered: "#10B981",
    cancelled: "#EF4444",
    refunded: "#EC4899",
  };

  const LABELS = {
    pending: "قيد المعالجة",
    processing: "قيد التنفيذ",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
    refunded: "مسترجع",
  };

  return Object.entries(grouped).map(([key, value]) => ({
    label: LABELS[key] || key,
    value,
    color: COLORS[key] || "#6366F1",
  }));
}

// ============================================
// أعلى العملاء
// ============================================
export async function getTopClients(limit = 5) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, spent")
    .order("spent", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#F59E0B"];

  return (data || []).map((c, i) => ({
    ...c,
    total: Number(c.spent || 0),
    color: COLORS[i % COLORS.length],
  }));
}

// ============================================
// المبيعات حسب الفئة
// ============================================
export async function getSalesByCategory() {
  const { data, error } = await supabase
    .from("products")
    .select("category, revenue");
  if (error) throw new Error(error.message);

  const grouped = data.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + Number(p.revenue || 0);
    return acc;
  }, {});

  return Object.entries(grouped).map(([label, value], i) => ({
    id: i,
    label,
    value: Math.round(value),
  }));
}

// ============================================
// طرق الدفع
// ============================================
export async function getPaymentsBreakdown() {
  const { data, error } = await supabase.from("payments").select("method");
  if (error) throw new Error(error.message);

  const grouped = data.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + 1;
    return acc;
  }, {});

  const COLORS = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F43F5E",
    "#F59E0B",
    "#10B981",
  ];

  return Object.entries(grouped).map(([label, value], i) => ({
    id: i,
    label,
    value,
    color: COLORS[i % COLORS.length],
  }));
}

// ============================================
// المقارنة السنوية
// ============================================
export async function getYearlyComparison() {
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const { data, error } = await supabase
    .from("orders")
    .select("total, created_at");
  if (error) throw new Error(error.message);

  const buckets = months.map((label) => ({ label, value: 0 }));

  (data || []).forEach((o) => {
    const month = new Date(o.created_at).getMonth();
    if (buckets[month]) {
      buckets[month].value += Number(o.total || 0);
    }
  });

  return buckets.map((b) => ({
    label: b.label,
    value: Math.round(b.value),
  }));
}
