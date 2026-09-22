import { supabase } from "../lib/supabase";

// ============================================
// جلب الكل
// ============================================
export async function getAll({ page = 0, pageSize = 500, search = "", status = null } = {}) {
    let query = supabase
        .from("clients")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (search) {
        query = query.or(
            `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        );
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    // ✅ normalization
    const normalized = (data || []).map((c) => ({
        ...c,
        orders: Number(c.orders || 0),
        spent: Number(c.spent || 0),
    }));

    return { data: normalized, count };
}

// ============================================
// جلب واحد
// ============================================
export async function getById(id) {
    const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw new Error(error.message);

    return {
        ...data,
        orders: Number(data.orders || 0),
        spent: Number(data.spent || 0),
    };
}

// ============================================
// إنشاء
// ============================================
export async function create(client) {
    const { data, error } = await supabase
        .from("clients")
        .insert(client)
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
        .from("clients")
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
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// حذف متعدد
// ============================================
export async function removeMany(ids = []) {
    const { error } = await supabase.from("clients").delete().in("id", ids);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// إحصائيات
// ============================================
export async function getStats() {
    const { data, error } = await supabase
        .from("clients")
        .select("status, spent");
    if (error) throw new Error(error.message);

    const totalSpent = data.reduce((s, c) => s + Number(c.spent || 0), 0);
    const active = data.filter((c) => c.status === "active").length;

    return {
        count: data.length,
        active,
        inactive: data.length - active,
        totalSpent: Math.round(totalSpent),
    };
}

// ============================================
// التحقق من بريد فريد
// ============================================
export async function isEmailUnique(email, excludeId = null) {
    let query = supabase.from("clients").select("id").eq("email", email);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data.length === 0;
}

// ============================================
// طلبات العميل (للتفاصيل)
// ============================================
export async function getClientOrders(clientName, limit = 500) {
    const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, order_date, created_at")
        .eq("client_name", clientName)
        .order("created_at", { ascending: false })
        .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
}