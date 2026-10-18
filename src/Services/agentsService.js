import { supabase } from "../lib/supabase";

// ============================================
// جلب الكل
// ============================================
export async function getAll() {
  const { data, error } = await supabase
    .from("agents")
    .select(
      "id, name, description, provider, model, system_prompt, temperature, tools, is_active, color, created_at, updated_at"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map((a) => ({
    ...a,
    temperature: Number(a.temperature || 0.7),
  }));
}

// ============================================
// جلب واحد
// ============================================
export async function getById(id) {
  const { data, error } = await supabase
    .from("agents")
    .select(
      "id, name, description, provider, model, system_prompt, temperature, tools, is_active, color, created_at, updated_at"
    )
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  return {
    ...data,
    temperature: Number(data.temperature || 0.7),
  };
}

// ============================================
// إنشاء
// ============================================
export async function create(agent) {
  const { api_key, ...agentData } = agent;

  let api_key_encrypted = null;
  if (api_key) {
    const { data: encData, error: encError } =
      await supabase.functions.invoke("encrypt-key", {
        body: { api_key },
      });
    if (encError) throw new Error(encError.message);
    api_key_encrypted = encData.encrypted;
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({ ...agentData, api_key_encrypted })
    .select(
      "id, name, description, provider, model, system_prompt, temperature, tools, is_active, color, created_at"
    )
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// تحديث
// ============================================
export async function update(id, updates) {
  const { api_key, ...agentData } = updates;

  if (api_key) {
    const { data: encData, error: encError } =
      await supabase.functions.invoke("encrypt-key", {
        body: { api_key },
      });
    if (encError) throw new Error(encError.message);
    agentData.api_key_encrypted = encData.encrypted;
  }

  const { error: updateError } = await supabase
    .from("agents")
    .update(agentData)
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);

  const { data, error } = await supabase
    .from("agents")
    .select(
      "id, name, description, provider, model, system_prompt, temperature, tools, is_active, color, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("تم التحديث لكن تعذّر جلب البيانات المحدّثة");

  return {
    ...data,
    temperature: Number(data.temperature || 0.7),
  };
}

// ============================================
// ✅ حذف (Soft Delete)
// ============================================
export async function remove(id) {
  const { error } = await supabase
    .from("agents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// ✅ حذف متعدد
export async function removeMany(ids = []) {
  const { error } = await supabase
    .from("agents")
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
    .from("agents")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

// ✅ جلب المحذوفات
export async function getDeleted() {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// ============================================
// تفعيل/تعطيل
// ============================================
export async function toggleActive(id, is_active) {
  return update(id, { is_active });
}

// ============================================
// تشغيل الوكيل
// ============================================
export async function run(agentId, messages) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw new Error(`جلسة: ${sessionError.message}`);
  if (!session?.access_token)
    throw new Error("الجلسة منتهية، الرجاء إعادة تسجيل الدخول");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-agent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ agent_id: agentId, messages }),
  });

  const text = await res.text();

  if (!res.ok) {
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || json.message || `HTTP ${res.status}`);
    } catch (e) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
  }

  return JSON.parse(text);
}

// ============================================
// سجل الوكلاء
// ============================================
export async function getLogs(agentId, limit = 50) {
  const { data, error } = await supabase
    .from("agent_logs")
    .select("*")
    .eq("agent_id", agentId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// التحقق من اسم فريد
// ============================================
export async function isNameUnique(name, excludeId = null) {
  let query = supabase
    .from("agents")
    .select("id")
    .eq("name", name)
    .is("deleted_at", null);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.length === 0;
}

// ============================================
// جلب مفتاح API (مقنّع)
// ============================================
export async function getMaskedKey(agentId) {
  const { data, error } = await supabase.functions.invoke(
    "get-agent-key",
    { body: { agent_id: agentId } }
  );
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// توليد منتج بالذكاء الاصطناعي
// ============================================
export async function generateProduct({ agent_id, name, category, keywords }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token)
    throw new Error("الجلسة منتهية، الرجاء إعادة تسجيل الدخول");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-product`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      agent_id: agent_id || null,
      name,
      category,
      keywords,
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || json.message || `HTTP ${res.status}`);
    } catch (e) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
  }

  return JSON.parse(text);
}