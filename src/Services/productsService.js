// src/Services/productsService.js

import { supabase } from "../lib/supabase";

// ✅ جلب الكل (يستثني المحذوف)
export async function getAll({
  page = 0,
  pageSize = 50,
  search = "",
  category = null,
} = {}) {
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data, count };
}

// ✅ إحصائيات (تستثني المحذوف)
export async function getStats() {
  const { data, error } = await supabase
    .from("products")
    .select("stock, price, sold, revenue")
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  const totalRevenue = data.reduce((s, p) => s + Number(p.revenue || 0), 0);
  const totalSold = data.reduce((s, p) => s + Number(p.sold || 0), 0);

  return {
    count: data.length,
    totalRevenue: Math.round(totalRevenue),
    totalSold,
    lowStock: data.filter((p) => p.stock > 0 && p.stock < 30).length,
    outOfStock: data.filter((p) => p.stock === 0).length,
  };
}

// ============================================
// ✅ حذف (Soft Delete)
// ============================================
export async function remove(id) {
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// ✅ حذف متعدد (Soft Delete)
export async function removeMany(ids = []) {
  const { error } = await supabase
    .from("products")
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
    .from("products")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// ============================================
// ✅ جلب المحذوفات
// ============================================
export async function getDeleted() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// ============================================
// جلب منتج واحد (يجيب حتى المحذوف)
// ============================================
export async function getById(id) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  return {
    ...data,
    price: Number(data.price),
    stock: Number(data.stock),
    sold: Number(data.sold),
    revenue: Number(data.revenue),
    rating: Number(data.rating),
  };
}

// ============================================
// إنشاء منتج
// ============================================
export async function create(product) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// تحديث منتج
// ============================================
export async function update(id, updates) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// التحقق من SKU فريد
// ============================================
export async function isSkuUnique(sku, excludeId = null) {
  let query = supabase
    .from("products")
    .select("id")
    .eq("sku", sku)
    .is("deleted_at", null);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.length === 0;
}

// ============================================
// عدد المنتجات الكلي (يستثني المحذوف)
// ============================================
export async function getCount() {
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  return count || 0;
}

// ============================================
// توليد منتج بالذكاء الاصطناعي
// ============================================
export async function generateProduct({ name, category, keywords }) {
  const { data, error } = await supabase.functions.invoke(
    "generate-product",
    { body: { name, category, keywords } }
  );
  if (error) throw new Error(error.message);
  return data;
}