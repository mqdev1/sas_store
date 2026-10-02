import { supabase } from "../lib/supabase";

export async function getAll() {
  const { data, error } = await supabase
    .from("shipping_carriers")
    .select(
      "id, name, code, logo_url, tracking_url_pattern, api_enabled, api_endpoint, is_active, sort_order, created_at, updated_at"
    )
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getById(id) {
  if (!id) throw new Error("ID is required");
  const { data, error } = await supabase
    .from("shipping_carriers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Carrier not found");
  return data;
}

export async function create(carrier) {
  const { api_key, api_secret, ...carrierData } = carrier;
  const payload = {
    ...carrierData,
    api_key: api_key || null,
    api_secret: api_secret || null,
  };

  const { data, error } = await supabase
    .from("shipping_carriers")
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function update(id, updates) {
  if (!id) throw new Error("ID is required");
  const { api_key, api_secret, ...carrierData } = updates;

  if (api_key) carrierData.api_key = api_key;
  if (api_secret) carrierData.api_secret = api_secret;
  carrierData.updated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("shipping_carriers")
    .update(carrierData)
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);

  const { data, error } = await supabase
    .from("shipping_carriers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ✅ Soft Delete
export async function remove(id) {
  const { error } = await supabase
    .from("shipping_carriers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function restore(id) {
  const { error } = await supabase
    .from("shipping_carriers")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function getDeleted() {
  const { data, error } = await supabase
    .from("shipping_carriers")
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
    .from("shipping_carriers")
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
    .from("shipping_carriers")
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
    "test-carrier-connection",
    { body: { carrier_id: id } }
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}