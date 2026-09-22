import { supabase } from "../lib/supabase";

// ============================================
// جلب الكل
// ============================================
export async function getAll({
    page = 0,
    pageSize = 500,
    search = "",
    isActive = null,
} = {}) {
    let query = supabase
        .from("categories")
        .select("*", { count: "exact" })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    if (isActive !== null) query = query.eq("is_active", isActive);
    if (search) {
        query = query.or(
            `name.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`
        );
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: data || [], count };
}

// ============================================
// جلب واحد
// ============================================
export async function getById(id) {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============================================
// إنشاء
// ============================================
export async function create(category) {
    const { data, error } = await supabase
        .from("categories")
        .insert(category)
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
        .from("categories")
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
    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// حذف متعدد
// ============================================
export async function removeMany(ids = []) {
    const { error } = await supabase
        .from("categories")
        .delete()
        .in("id", ids);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// إحصائيات
// ============================================
export async function getStats() {
    const { data, error } = await supabase
        .from("categories")
        .select("is_active");
    if (error) throw new Error(error.message);

    const active = data.filter((c) => c.is_active).length;
    return {
        total: data.length,
        active,
        inactive: data.length - active,
    };
}

// ============================================
// التحقق من الاسم فريد
// ============================================
export async function isNameUnique(name, excludeId = null) {
    let query = supabase
        .from("categories")
        .select("id")
        .eq("name", name);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data.length === 0;
}

// ============================================
// توليد slug من الاسم
// ============================================
export function generateSlug(name) {
    return name
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
}

// ============================================
// عدد المنتجات في الفئة
// ============================================
export async function getProductCount(categoryName) {
    const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category", categoryName);
    if (error) throw new Error(error.message);
    return count || 0;
}