import { supabase } from "../lib/supabase";

// ============================================
// جلب كل الطلبات (مع pagination)
// ============================================
export async function getAll({
  page = 0,
  pageSize = 50,
  search = "",
  status = null,
} = {}) {
  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("order_date", { ascending: false });

  if (status) query = query.eq("status", status);
  if (search) {
    query = query.or(
      `client.ilike.%${search}%,product.ilike.%${search}%,address.ilike.%${search}%`,
    );
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data, count, page, pageSize };
}

// ============================================
// جلب طلب واحد مع عناصره
// ============================================
export async function getById(id) {
    const { data, error } = await supabase
        .from("orders")
        .select(
            `
            *,
            order_items (
                id,
                product_id,
                product_name,
                quantity,
                price,
                subtotal
            )
        `
        )
        .eq("id", id)
        .single();

    if (error) throw new Error(error.message);

    return {
        ...data,
        total: Number(data.total || 0),
        subtotal: Number(data.subtotal || 0),
        tax: Number(data.tax || 0),
        shipping: Number(data.shipping || 0),
        items: (data.order_items || []).map((it) => ({
            id: it.id,
            product_id: it.product_id,
            product_name: it.product_name,
            quantity: Number(it.quantity || 1),
            price: Number(it.price || 0),
            subtotal: Number(it.subtotal || 0),
        })),
    };
}

export async function create(orderData) {
    const { items = [], ...order } = orderData;

    // ✅ توليد رقم طلب
    const order_number = `ORD-${String(Date.now()).slice(-8)}`;

    // ✅ 1. إنشاء الطلب
    const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({ ...order, order_number })
        .select()
        .single();

    if (orderError) throw new Error(orderError.message);

    // ✅ 2. إضافة العناصر
    if (items.length > 0) {
        const orderItems = items.map((it) => ({
            order_id: newOrder.id,
            product_id: it.product_id || null,
            product_name: it.product_name,
            quantity: it.quantity,
            price: it.price,
            subtotal: it.price * it.quantity,
        }));

        const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

        if (itemsError) {
            // rollback
            await supabase.from("orders").delete().eq("id", newOrder.id);
            throw new Error(itemsError.message);
        }
    }

    return newOrder;
}

// ============================================
// تحديث طلب (مع العناصر)
// ============================================
export async function update(id, orderData) {
    const { items, ...order } = orderData;

    // ✅ 1. تحديث الطلب
    const { data, error } = await supabase
        .from("orders")
        .update(order)
        .eq("id", id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    // ✅ 2. تحديث العناصر (حذف + إضافة)
    if (Array.isArray(items)) {
        await supabase.from("order_items").delete().eq("order_id", id);

        if (items.length > 0) {
            const orderItems = items.map((it) => ({
                order_id: id,
                product_id: it.product_id || null,
                product_name: it.product_name,
                quantity: it.quantity,
                price: it.price,
                subtotal: it.price * it.quantity,
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems);
            if (itemsError) throw new Error(itemsError.message);
        }
    }

    return data;
}

// ============================================
// حذف طلب
// ============================================
export async function remove(id) {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// ============================================
// حذف عدة طلبات
// ============================================
export async function removeMany(ids = []) {
  const { error } = await supabase.from("orders").delete().in("id", ids);
  if (error) throw new Error(error.message);
  return true;
}

// ============================================
// إحصائيات الطلبات
// ============================================
export async function getStats() {
  const { data, error } = await supabase
    .from("orders")
    .select("total, status, created_at");
  if (error) throw new Error(error.message);

  const total = data.reduce((sum, o) => sum + (o.total || 0), 0);
  return {
    count: data.length,
    revenue: Math.round(total),
    avg: data.length ? Math.round(total / data.length) : 0,
    pending: data.filter((o) => o.status === "pending").length,
    shipped: data.filter((o) => o.status === "shipped").length,
    delivered: data.filter((o) => o.status === "delivered").length,
    cancelled: data.filter((o) => o.status === "cancelled").length,
  };
}

// ============================================
// آخر N طلبات
// ============================================
export async function getRecent(limit = 5) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// الطلبات الملغية
// ============================================
export async function getCancelled() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// استعادة طلب ملغي
// ============================================
export async function restore(id) {
  return update(id, { status: "pending" });
}


export async function getDashboardStats() {
  const { data, error } = await supabase.rpc("get_dashboard_stats");
  if (error) throw new Error(error.message);
  return data;
}