import { supabase } from "../lib/supabase";

// ============================================
// جلب الكل
// ============================================
export async function getAll({
    page = 0,
    pageSize = 500,
    search = "",
    role = null,
    status = null,
} = {}) {
    let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);
    if (search) {
        query = query.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
        );
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    // ✅ دمج الاسم الكامل
    const normalized = (data || []).map((u) => ({
        ...u,
        name:
            `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
            u.username ||
            "مستخدم",
    }));

    return { data: normalized, count };
}

// ============================================
// جلب واحد
// ============================================
export async function getById(id) {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw new Error(error.message);

    return {
        ...data,
        name:
            `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
            data.username ||
            "مستخدم",
    };
}

// ============================================
// تحديث (الملف الشخصي فقط)
// ============================================
export async function update(id, updates) {
    const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============================================
// حذف (من profiles فقط — Auth user يحتاج admin API)
// ============================================
export async function remove(id) {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// تحديث الدور
// ============================================
export async function updateRole(id, role) {
    return update(id, { role });
}

// ============================================
// تحديث الصلاحيات
// ============================================
export async function updatePermissions(id, permissions) {
    return update(id, { permissions });
}

// ============================================
// تحديث الحالة
// ============================================
export async function updateStatus(id, status) {
    return update(id, { status });
}

// ============================================
// إحصائيات
// ============================================
export async function getStats() {
    const { data, error } = await supabase
        .from("profiles")
        .select("status, role");
    if (error) throw new Error(error.message);

    return {
        total: data.length,
        active: data.filter((u) => u.status === "active").length,
        inactive: data.filter((u) => u.status === "inactive").length,
        admins: data.filter(
            (u) => u.role === "admin" || u.role === "manager"
        ).length,
    };
}

// ============================================
// دعوة مستخدم جديد (Edge Function)
// ============================================
export async function inviteUser({
    email,
    first_name,
    last_name,
    username,
    role,
    department,
    permissions,
}) {
    const { data, error } = await supabase.functions.invoke(
        "invite-user",
        {
            body: {
                email,
                first_name,
                last_name,
                username,
                role,
                department,
                permissions,
            },
        }
    );
    if (error) throw new Error(error.message);
    return data;
}