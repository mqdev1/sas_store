import { supabase } from "../lib/supabase";

// ============================================
// جلب كل الطلبات (يستثني المحذوف)
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
    .is("deleted_at", null)
    .order("order_date", { ascending: false });

  if (status) query = query.eq("status", status);
  if (search) {
    query = query.or(
      `client.ilike.%${search}%,product.ilike.%${search}%,address.ilike.%${search}%`
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
// جلب طلب واحد (يجيب حتى المحذوف)
// ============================================
export async function getById(id) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        id, product_id, product_name, quantity, price, subtotal
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

// ============================================
// إنشاء طلب
// ============================================
export async function create(orderData) {
  const { items = [], ...order } = orderData;
  const order_number = `ORD-${String(Date.now()).slice(-8)}`;

  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({ ...order, order_number })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

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
      await supabase.from("orders").delete().eq("id", newOrder.id);
      throw new Error(itemsError.message);
    }
  }

  return newOrder;
}

// ============================================
// تحديث طلب
// ============================================
export async function update(id, orderData) {
  const { items, ...order } = orderData;

  const { data, error } = await supabase
    .from("orders")
    .update(order)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

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
// ✅ حذف طلب (Soft Delete)
// ============================================
export async function remove(id) {
  const { error } = await supabase
    .from("orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// ✅ حذف متعدد
export async function removeMany(ids = []) {
  const { error } = await supabase
    .from("orders")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw new Error(error.message);
  return true;
}

// ============================================
// ✅ استرجاع
// ============================================
export async function restore(id) {
  const { error } = await supabase
    .from("orders")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// ✅ جلب المحذوفات
export async function getDeleted() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// ============================================
// إحصائيات (تستثني المحذوف)
// ============================================
export async function getStats() {
  const { data, error } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .is("deleted_at", null);
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
    .is("deleted_at", null)
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
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// استعادة طلب ملغي (status)
// ============================================
export async function restoreCancelled(id) {
  return update(id, { status: "pending" });
}

export async function getDashboardStats() {
  const { data, error } = await supabase.rpc("get_dashboard_stats");
  if (error) throw new Error(error.message);
  return data;
}