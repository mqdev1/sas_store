import { supabase } from "../lib/supabase";

// ============================================
// إعدادات الضريبة العامة
// ============================================
export async function getTaxSettings() {
  const { data, error } = await supabase
    .from("tax_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  // ✅ fallback لو الجدول فاضي
  if (!data) {
    return {
      id: 1,
      tax_enabled: true,
      prices_include_tax: false,
      show_tax_breakdown: true,
      default_tax_name: "VAT",
    };
  }

  return data;
}

export async function updateTaxSettings(updates) {
  const { data, error } = await supabase
    .from("tax_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// المناطق الضريبية
// ============================================
export async function getAllRegions() {
  const { data, error } = await supabase
    .from("tax_regions")
    .select("*")
    .order("country_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getRegionByCountry(countryCode) {
  const { data, error } = await supabase
    .from("tax_regions")
    .select("*")
    .eq("country_code", countryCode)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getDefaultRegion() {
  const { data, error } = await supabase
    .from("tax_regions")
    .select("*")
    .eq("is_default", true)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createRegion(region) {
  const { data, error } = await supabase
    .from("tax_regions")
    .insert(region)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRegion(id, updates) {
  const { data, error } = await supabase
    .from("tax_regions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeRegion(id) {
  const { error } = await supabase.from("tax_regions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// ============================================
// ✅ حساب الضريبة لطلب
// ============================================
export async function calculateTax({
  countryCode,
  subtotal,
  taxClass = "standard",
}) {
  // 1. جلب الإعدادات
  const settings = await getTaxSettings();

  // 2. لو الضريبة معطلة → 0
  if (!settings.tax_enabled) {
    return { rate: 0, amount: 0, region: null };
  }

  // 3. جلب المنطقة
  let region = null;
  if (countryCode) {
    region = await getRegionByCountry(countryCode);
  }
  if (!region) {
    region = await getDefaultRegion();
  }

  // 4. حساب النسبة
  let rate = region?.tax_rate || 0;

  // 5. تصنيف المنتج (اختياري)
  if (taxClass === "zero" || taxClass === "exempt") {
    rate = 0;
  }

  // 6. حساب المبلغ
  const amount = (Number(subtotal) * rate) / 100;

  return {
    rate,
    amount: Math.round(amount * 100) / 100,
    region: region
      ? {
          country_code: region.country_code,
          country_name: region.country_name, // ← جديد
          tax_name: region.tax_name,
        }
      : null,
  };
}

// ============================================
// قائمة الدول (ISO 3166-1)
// ============================================
export const COUNTRIES = [
  { code: "SAU", name: "السعودية", nameEn: "Saudi Arabia" },
  { code: "ARE", name: "الإمارات", nameEn: "UAE" },
  { code: "EGY", name: "مصر", nameEn: "Egypt" },
  { code: "PSE", name: "فلسطين", nameEn: "Palestine" },
  { code: "JOR", name: "الأردن", nameEn: "Jordan" },
  { code: "KWT", name: "الكويت", nameEn: "Kuwait" },
  { code: "QAT", name: "قطر", nameEn: "Qatar" },
  { code: "BHR", name: "البحرين", nameEn: "Bahrain" },
  { code: "OMN", name: "عمان", nameEn: "Oman" },
  { code: "USA", name: "أمريكا", nameEn: "USA" },
  { code: "GBR", name: "بريطانيا", nameEn: "UK" },
  { code: "DEU", name: "ألمانيا", nameEn: "Germany" },
  { code: "FRA", name: "فرنسا", nameEn: "France" },
  { code: "TUR", name: "تركيا", nameEn: "Turkey" },
];
