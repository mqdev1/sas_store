import { supabase } from "../lib/supabase";

export async function getAll() {
  const { data, error } = await supabase
    .from("payment_gateways")
    .select(
      "id, name, code, logo_url, mode, api_endpoint, supported_currencies, fees_percentage, fees_fixed, is_active, created_at, updated_at"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

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

// ✅ Soft Delete
export async function remove(id) {
  const { error } = await supabase
    .from("payment_gateways")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function restore(id) {
  const { error } = await supabase
    .from("payment_gateways")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function getDeleted() {
  const { data, error } = await supabase
    .from("payment_gateways")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function toggleActive(id, is_active) {
  return update(id, { is_active });
}

export async function isNameUnique(name, excludeId = null) {
  let query = supabase
    .from("payment_gateways")
    .select("id")
    .eq("name", name)
    .is("deleted_at", null);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.length === 0;
}

export async function isCodeUnique(code, excludeId = null) {
  let query = supabase
    .from("payment_gateways")
    .select("id")
    .eq("code", code)
    .is("deleted_at", null);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.length === 0;
}

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

export async function createCheckout({
  gateway_id,
  order_id,
  amount,
  currency,
}) {
  const { data, error } = await supabase.functions.invoke(
    "payment-checkout",
    { body: { gateway_id, order_id, amount, currency } }
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}