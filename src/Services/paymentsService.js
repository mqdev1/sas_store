import { supabase } from "../lib/supabase";

// ============================================
// جلب الكل
// ============================================
export async function getAll({
    page = 0,
    pageSize = 500,
    search = "",
    status = null,
    method = null,
} = {}) {
    let query = supabase
        .from("payments")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (method) query = query.eq("method", method);
    if (search) {
        query = query.or(
            `transaction_id.ilike.%${search}%,client_name.ilike.%${search}%,reference.ilike.%${search}%`
        );
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const normalized = (data || []).map((p) => ({
        ...p,
        amount: Number(p.amount || 0),
        fee: Number(p.fee || 0),
        net: Number(p.net || 0),
    }));

    return { data: normalized, count };
}

// ============================================
// جلب واحد
// ============================================
export async function getById(id) {
    const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw new Error(error.message);

    return {
        ...data,
        amount: Number(data.amount || 0),
        fee: Number(data.fee || 0),
        net: Number(data.net || 0),
    };
}

// ============================================
// إنشاء
// ============================================
export async function create(payment) {
    const { data, error } = await supabase
        .from("payments")
        .insert(payment)
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
        .from("payments")
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
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// حذف متعدد
// ============================================
export async function removeMany(ids = []) {
    const { error } = await supabase.from("payments").delete().in("id", ids);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// إحصائيات
// ============================================
export async function getStats() {
    const { data, error } = await supabase
        .from("payments")
        .select("amount, fee, net, status");
    if (error) throw new Error(error.message);

    const completed = data.filter((p) => p.status === "completed");
    const totalAmount = data.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalFees = data.reduce((s, p) => s + Number(p.fee || 0), 0);
    const netRevenue = completed.reduce((s, p) => s + Number(p.net || 0), 0);

    return {
        total: data.length,
        totalAmount: Math.round(totalAmount),
        totalFees: Math.round(totalFees),
        netRevenue: Math.round(netRevenue),
        successRate: data.length
            ? Math.round((completed.length / data.length) * 100)
            : 0,
    };
}

// ============================================
// استرجاع
// ============================================
export async function refund(id) {
    return update(id, { status: "refunded" });
}

// ============================================
// التحقق من transaction_id فريد
// ============================================
export async function isTransactionUnique(transaction_id, excludeId = null) {
    let query = supabase
        .from("payments")
        .select("id")
        .eq("transaction_id", transaction_id);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data.length === 0;
}

// ============================================
// توليد transaction_id
// ============================================
export function generateTransactionId() {
    return `TXN-${Date.now().toString().slice(-8)}`;
}