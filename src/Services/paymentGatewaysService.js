import { supabase } from "../lib/supabase";

// ============================================
// جلب الكل
// ============================================
export async function getAll() {
    const { data, error } = await supabase
        .from("payment_gateways")
        .select(
            "id, name, code, logo_url, mode, api_endpoint, supported_currencies, fees_percentage, fees_fixed, is_active, created_at, updated_at"
        )
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

// ============================================
// جلب واحد
// ============================================
export async function getById(id) {
    if (!id) throw new Error("ID is required");

    const { data, error } = await supabase
        .from("payment_gateways")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Gateway not found");

    return data;
}

// ============================================
// إنشاء
// ============================================
export async function create(gateway) {
    const { api_key, api_secret, ...gatewayData } = gateway;

    const payload = {
        ...gatewayData,
        api_key: api_key || null,
        api_secret: api_secret || null,
    };

    const { data, error } = await supabase
        .from("payment_gateways")
        .insert(payload)
        .select()
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
}

// ============================================
// تحديث
// ============================================
export async function update(id, updates) {
    if (!id) throw new Error("ID is required");

    const { api_key, api_secret, ...gatewayData } = updates;

    if (api_key) gatewayData.api_key = api_key;
    if (api_secret) gatewayData.api_secret = api_secret;

    gatewayData.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
        .from("payment_gateways")
        .update(gatewayData)
        .eq("id", id);

    if (updateError) throw new Error(updateError.message);

    const { data, error } = await supabase
        .from("payment_gateways")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
}

// ============================================
// حذف
// ============================================
export async function remove(id) {
    const { error } = await supabase
        .from("payment_gateways")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
    return true;
}

// ============================================
// تفعيل/تعطيل
// ============================================
export async function toggleActive(id, is_active) {
    return update(id, { is_active });
}

// ============================================
// التحقق من اسم فريد
// ============================================
export async function isNameUnique(name, excludeId = null) {
    let query = supabase
        .from("payment_gateways")
        .select("id")
        .eq("name", name);

    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data.length === 0;
}

// ============================================
// التحقق من كود فريد
// ============================================
export async function isCodeUnique(code, excludeId = null) {
    let query = supabase
        .from("payment_gateways")
        .select("id")
        .eq("code", code);

    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data.length === 0;
}

// ============================================
// اختبار الاتصال
// ============================================
export async function testConnection(id) {
    if (!id) throw new Error("ID is required");

    const { data, error } = await supabase.functions.invoke(
        "test-gateway-connection",
        { body: { gateway_id: id } }
    );

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
}

// ============================================
// توليد رابط الدفع
// ============================================
export async function createCheckout({ gateway_id, order_id, amount, currency }) {
    const { data, error } = await supabase.functions.invoke(
        "payment-checkout",
        {
            body: {
                gateway_id,
                order_id,
                amount,
                currency,
            },
        }
    );

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data; // { checkout_url, transaction_id }
}