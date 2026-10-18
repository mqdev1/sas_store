import { supabase } from "../lib/supabase";

export async function getAll({
  page = 0,
  pageSize = 500,
  search = "",
  status = null,
  carrier = null,
} = {}) {
  let query = supabase
    .from("shipments")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (carrier) query = query.eq("carrier", carrier);
  if (search) {
    query = query.or(
      `tracking_number.ilike.%${search}%,client_name.ilike.%${search}%,city.ilike.%${search}%`
    );
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const normalized = (data || []).map((s) => ({
    ...s,
    weight: Number(s.weight || 0),
    cost: Number(s.cost || 0),
  }));

  return { data: normalized, count };
}

export async function getById(id) {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  return {
    ...data,
    weight: Number(data.weight || 0),
    cost: Number(data.cost || 0),
  };
}

export async function create(shipment) {
  const { data, error } = await supabase
    .from("shipments")
    .insert(shipment)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function update(id, updates) {
  const { data, error } = await supabase
    .from("shipments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ✅ Soft Delete
export async function remove(id) {
  const { error } = await supabase
    .from("shipments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function removeMany(ids = []) {
  const { error } = await supabase
    .from("shipments")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw new Error(error.message);
  return true;
}

export async function restore(id) {
  const { error } = await supabase
    .from("shipments")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function getDeleted() {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getStats() {
  const { data, error } = await supabase
    .from("shipments")
    .select("status, cost, weight")
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  const delivered = data.filter((s) => s.status === "delivered").length;
  const inTransit = data.filter(
    (s) => s.status === "shipped" || s.status === "in_transit"
  ).length;

  return {
    total: data.length,
    delivered,
    inTransit,
    pending: data.filter((s) => s.status === "preparing").length,
    totalCost: Math.round(
      data.reduce((s, x) => s + Number(x.cost || 0), 0)
    ),
    deliveryRate: data.length
      ? Math.round((delivered / data.length) * 100)
      : 0,
  };
}

export async function updateStatus(id, status) {
  const updates = { status };
  if (status === "delivered") {
    updates.delivered_at = new Date().toISOString().slice(0, 10);
  }
  return update(id, updates);
}

export async function isTrackingUnique(tracking, excludeId = null) {
  let query = supabase
    .from("shipments")
    .select("id")
    .eq("tracking_number", tracking)
    .is("deleted_at", null);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.length === 0;
}