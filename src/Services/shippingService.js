import { supabase } from "../lib/supabase";

// ============================================
// جلب الكل
// ============================================
export async function getAll({
    page = 0,
    pageSize = 500,
    search = "",
    status = null,
    carrier = null,
} = {}) {
    let query = supabase
        .from("shipments")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (carrier) query = query.eq("carrier", carrier);
    if (search) {
        query = query.or(
            `tracking_number.ilike.%${search}%,client_name.ilike.%${search}%,city.ilike.%${search}%`
        );
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const normalized = (data || []).map((s) => ({
        ...s,
        weight: Number(s.weight || 0),
        cost: Number(s.cost || 0),
    }));

    return { data: normalized, count };
}

// ============================================
// جلب واحد
// ============================================
export async function getById(id) {
    const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw new Error(error.message);

    return {
        ...data,
        weight: Number(data.weight || 0),
        cost: Number(data.cost || 0),
    };
}

// ============================================
// إنشاء
// ============================================
export async function create(shipment) {
    const { data, error } = await supabase
        .from("shipments")
        .insert(shipment)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============================================
// تحديث
// ============================================
export async function update(id, updates) {
    const { data, error } = await supabase
        .from("shipments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============================================
// حذف
// ============================================
export async function remove(id) {
    const { error } = await supabase.from("shipments").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// حذف متعدد
// ============================================
export async function removeMany(ids = []) {
    const { error } = await supabase.from("shipments").delete().in("id", ids);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// إحصائيات
// ============================================
export async function getStats() {
    const { data, error } = await supabase
        .from("shipments")
        .select("status, cost, weight");
    if (error) throw new Error(error.message);

    const delivered = data.filter((s) => s.status === "delivered").length;
    const inTransit = data.filter(
        (s) => s.status === "shipped" || s.status === "in_transit"
    ).length;

    return {
        total: data.length,
        delivered,
        inTransit,
        pending: data.filter((s) => s.status === "preparing").length,
        totalCost: Math.round(
            data.reduce((s, x) => s + Number(x.cost || 0), 0)
        ),
        deliveryRate: data.length
            ? Math.round((delivered / data.length) * 100)
            : 0,
    };
}

// ============================================
// تحديث الحالة
// ============================================
export async function updateStatus(id, status) {
    const updates = { status };
    if (status === "delivered") {
        updates.delivered_at = new Date().toISOString().slice(0, 10);
    }
    return update(id, updates);
}

// ============================================
// التحقق من tracking فريد
// ============================================
export async function isTrackingUnique(tracking, excludeId = null) {
    let query = supabase
        .from("shipments")
        .select("id")
        .eq("tracking_number", tracking);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data.length === 0;
}