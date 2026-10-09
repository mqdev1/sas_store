import { supabase } from "../lib/supabase";

// ============================================
// جلب إعدادات المستخدم
// ============================================
export async function get(userId) {
    const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
}

// ============================================
// حفظ/تحديث الإعدادات
// ============================================
export async function save(userId, settings) {
    const { data, error } = await supabase
        .from("settings")
        .upsert({ user_id: userId, ...settings }, { onConflict: "user_id" })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============================================
// حذف الإعدادات
// ============================================
export async function remove(userId) {
    const { error } = await supabase
        .from("settings")
        .delete()
        .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
}