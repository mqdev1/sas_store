import { supabase } from "../lib/supabase";

// ============================================
// جلب الكل
// ============================================
export async function getAll() {
  const { data, error } = await supabase
    .from("agents")
    .select(
      "id, name, description, provider, model, system_prompt, temperature, tools, is_active, color, created_at, updated_at",
    )
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
      "id, name, description, provider, model, system_prompt, temperature, tools, is_active, color, created_at, updated_at",
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
// إنشاء (مع تشفير API Key)
// ============================================
export async function create(agent) {
  const { api_key, ...agentData } = agent;

  // ✅ تشفير المفتاح عبر Edge Function
  let api_key_encrypted = null;
  if (api_key) {
    const { data: encData, error: encError } = await supabase.functions.invoke(
      "encrypt-key",
      {
        body: { api_key },
      },
    );
    if (encError) throw new Error(encError.message);
    api_key_encrypted = encData.encrypted;
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({ ...agentData, api_key_encrypted })
    .select(
      "id, name, description, provider, model, system_prompt, temperature, tools, is_active, color, created_at",
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

  // ✅ لو في API key جديد، شفره
  if (api_key) {
    const { data: encData, error: encError } = await supabase.functions.invoke(
      "encrypt-key",
      {
        body: { api_key },
      },
    );
    if (encError) throw new Error(encError.message);
    agentData.api_key_encrypted = encData.encrypted;
  }

  // ✅ 1. نفّذ التحديث بدون select
  const { error: updateError } = await supabase
    .from("agents")
    .update(agentData)
    .eq("id", id);

  if (updateError) throw new Error(updateError.message);

  // ✅ 2. اجلب البيانات المحدّثة بـ select منفصل
  const { data, error } = await supabase
    .from("agents")
    .select(
      "id, name, description, provider, model, system_prompt, temperature, tools, is_active, color, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    // التحديث نجح بس ما قدرناش نجيب البيانات
    throw new Error("تم التحديث لكن تعذّر جلب البيانات المحدّثة");
  }

  return {
    ...data,
    temperature: Number(data.temperature || 0.7),
  };
}

// ============================================
// حذف
// ============================================
export async function remove(id) {
  const { error } = await supabase.from("agents").delete().eq("id", id);
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
// تشغيل الوكيل
// ============================================
export async function run(agentId, messages) {
  // ✅ 1. الجلسة
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`جلسة: ${sessionError.message}`);
  }

  if (!session?.access_token) {
    throw new Error("الجلسة منتهية، الرجاء إعادة تسجيل الدخول");
  }

  // ✅ 2. استدعاء مباشر مع fetch
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-agent`;

  console.log("🔵 [run] URL:", url);
  console.log("🔵 [run] agentId:", agentId, typeof agentId);
  console.log("🔵 [run] token:", session.access_token.slice(0, 20) + "...");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      agent_id: agentId,
      messages,
    }),
  });

  // ✅ 3. اقرأ النص أولاً
  const text = await res.text();
  console.log("🔵 [run] status:", res.status);
  console.log("🔵 [run] response:", text);

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
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// ============================================
// التحقق من اسم فريد
// ============================================
export async function isNameUnique(name, excludeId = null) {
  let query = supabase.from("agents").select("id").eq("name", name);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.length === 0;
}

// ============================================
// جلب مفتاح API (مقنّع) للعرض
// ============================================
export async function getMaskedKey(agentId) {
  const { data, error } = await supabase.functions.invoke("get-agent-key", {
    body: { agent_id: agentId },
  });

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

  if (!session?.access_token) {
    throw new Error("الجلسة منتهية، الرجاء إعادة تسجيل الدخول");
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-product`;

  console.log("🔵 [generateProduct] calling with agent_id:", agent_id);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      agent_id: agent_id || null, // ✅ جديد
      name,
      category,
      keywords,
    }),
  });

  const text = await res.text();
  console.log("🔵 [generateProduct] status:", res.status);
  console.log("🔵 [generateProduct] response:", text.slice(0, 500));

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
