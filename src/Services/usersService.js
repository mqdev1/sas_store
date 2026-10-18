import { supabase } from "../lib/supabase";

export async function getAll({
  page = 0,
  pageSize = 500,
  search = "",
  role = null,
  status = null,
} = {}) {
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (role) query = query.eq("role", role);
  if (status) query = query.eq("status", status);
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
    );
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const normalized = (data || []).map((u) => ({
    ...u,
    name:
      `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
      u.username ||
      "مستخدم",
  }));

  return { data: normalized, count };
}

export async function getById(id) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  return {
    ...data,
    name:
      `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
      data.username ||
      "مستخدم",
  };
}

export async function update(id, updates) {
  const { data, error } = await supabase
    .from("profiles")
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
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function restore(id) {
  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function getDeleted() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateRole(id, role) {
  return update(id, { role });
}

export async function updatePermissions(id, permissions) {
  return update(id, { permissions });
}

export async function updateStatus(id, status) {
  return update(id, { status });
}

export async function getStats() {
  const { data, error } = await supabase
    .from("profiles")
    .select("status, role")
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  return {
    total: data.length,
    active: data.filter((u) => u.status === "active").length,
    inactive: data.filter((u) => u.status === "inactive").length,
    admins: data.filter(
      (u) => u.role === "admin" || u.role === "manager"
    ).length,
  };
}

export async function inviteUser({
  email,
  first_name,
  last_name,
  username,
  role,
  department,
  permissions,
}) {
  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: {
      email,
      first_name,
      last_name,
      username,
      role,
      department,
      permissions,
    },
  });
  if (error) throw new Error(error.message);
  return data;
}