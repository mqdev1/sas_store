import { supabase } from "../lib/supabase";

const BUCKET = "public";

// ============================================
// رفع ملف واحد
// ============================================
export async function upload(file, folder = "products") {
    // ✅ تحقق من النوع
    if (!file.type.startsWith("image/")) {
        throw new Error("يجب أن يكون الملف صورة");
    }

    // ✅ تحقق من الحجم (5MB)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error("حجم الصورة يجب أن يكون أقل من 5MB");
    }

    // ✅ اسم فريد
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error) throw new Error(error.message);

    // ✅ الرابط العام
    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

    return {
        path: fileName,
        url: urlData.publicUrl,
    };
}

// ============================================
// رفع عدة ملفات
// ============================================
export async function uploadMany(files, folder = "products") {
    const results = await Promise.all(
        Array.from(files).map((f) => upload(f, folder))
    );
    return results;
}

// ============================================
// حذف ملف
// ============================================
export async function remove(filePath) {
    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// حذف عدة ملفات
// ============================================
export async function removeMany(filePaths = []) {
    const { error } = await supabase.storage.from(BUCKET).remove(filePaths);
    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// رابط عام
// ============================================
export function getPublicUrl(path) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

// ============================================
// رابط موقّع (للملفات الخاصة)
// ============================================
export async function getSignedUrl(path, expiresIn = 3600) {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, expiresIn);
    if (error) throw new Error(error.message);
    return data.signedUrl;
}