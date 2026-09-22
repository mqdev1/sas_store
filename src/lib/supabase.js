import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log(supabaseUrl);


if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Missing Supabase env vars. Check .env for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

// ✅ Helper: يرمي خطأ لو في مشكلة
export function handleError(error, context = "") {
    if (!error) return null;
    console.error(`[Supabase${context ? ` - ${context}` : ""}]`, error);
    throw new Error(error.message || "حدث خطأ غير متوقع");
}

// ✅ Helper: يرجّع { data, error } بشكل موحّد
export async function runQuery(promise, context = "") {
    const { data, error } = await promise;
    if (error) handleError(error, context);
    return data;
}