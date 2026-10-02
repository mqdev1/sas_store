import { supabase } from "../lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";

// ============================================
// الأخطاء المعروفة (لترجمتها في الفرونت)
// ============================================
const KNOWN_ERRORS = {
    PROMPT_REQUIRED: "promptRequired",
    PROMPT_TOO_SHORT: "promptTooShort",
    AGENT_NOT_FOUND: "agentNotFound",
    AGENT_INACTIVE: "agentInactive",
    NO_API_KEY: "noApiKey",
    OUT_OF_SCOPE: "outOfScope",
    AI_ERROR: "aiError",
    INVALID_RESPONSE: "invalidResponse",
    NETWORK_ERROR: "networkError",
    UNKNOWN: "unknown",
};

// ============================================
// استخراج رسالة الخطأ الحقيقية من Edge Function
// ============================================
async function extractFunctionError(error) {
    // 1. FunctionsHttpError = الـ Function ردت بـ status != 2xx
    if (error instanceof FunctionsHttpError) {
        try {
            const status = error.context?.status;
            const body = await error.context.json();
            const message =
                body?.error ||
                body?.message ||
                `HTTP ${status}`;

            console.error(
                `🔴 [Edge Function] status=${status} message=${message}`,
                body
            );

            return { status, message, body };
        } catch (parseErr) {
            console.error(
                "🔴 [Edge Function] failed to parse error body",
                parseErr
            );
            return {
                status: error.context?.status,
                message: error.message || "Unknown function error",
                body: null,
            };
        }
    }

    // 2. أخطاء تانية (Relay, Fetch, ...)
    return {
        status: null,
        message: error?.message || "Unknown error",
        body: null,
    };
}

// ============================================
// توليد تقرير بالـ AI
// ============================================
export async function generateAIReport({ prompt, agent_id }) {
    // 1. Validation أساسي في الفرونت
    if (!prompt || !prompt.trim()) {
        throw createError(
            "PROMPT_REQUIRED",
            "Prompt is required",
            "الرجاء كتابة طلبك أولاً"
        );
    }

    if (prompt.trim().length < 3) {
        throw createError(
            "PROMPT_TOO_SHORT",
            "Prompt too short",
            "الطلب قصير جدًا، اكتب طلبًا أوضح"
        );
    }

    if (!agent_id) {
        throw createError(
            "AGENT_NOT_FOUND",
            "Agent ID is required",
            "الرجاء اختيار وكيل"
        );
    }

    // 2. استدعاء Edge Function
    let data, error;

    try {
        const res = await supabase.functions.invoke("generate-report", {
            body: {
                prompt: prompt.trim(),
                agent_id,
            },
        });
        data = res.data;
        error = res.error;
    } catch (err) {
        // ✅ لو الخطأ من invoke مباشرة (نادر)
        console.error("🔴 [reportsAIService] invoke threw:", err);
        throw createError(
            "NETWORK_ERROR",
            err.message || "Network error",
            "فشل الاتصال بالخدمة، تحقق من الإنترنت"
        );
    }

    // 3. معالجة أخطاء Edge Function
    if (error) {
        const { status, message } = await extractFunctionError(error);

        // ✅ لو الرد جاي بـ JSON فيه error
        const code = detectErrorCode(message);

        throw createError(
            code,
            `[${status || "??"}] ${message}`,
            translateFunctionError(message)
        );
    }

    // 4. تحقق من البيانات الراجعة
    if (!data) {
        throw createError(
            "INVALID_RESPONSE",
            "Empty response",
            "لم يتم استلام أي رد من الخدمة"
        );
    }

    if (data.error) {
        const code = detectErrorCode(data.error);
        throw createError(
            code,
            data.error,
            translateFunctionError(data.error)
        );
    }

    if (!data.report) {
        throw createError(
            "INVALID_RESPONSE",
            "No report in response",
            "التقرير غير مكتمل، حاول مرة أخرى"
        );
    }

    // 5. تطبيع التقرير (حماية ضد بيانات ناقصة)
    return normalizeReport(data.report);
}

// ============================================
// توليد تقرير مع retry
// ============================================
export async function generateAIReportWithRetry(
    params,
    { maxRetries = 2, delay = 1500 } = {}
) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await generateAIReport(params);
        } catch (err) {
            lastError = err;

            // لا نعيد المحاولة لأخطاء المستخدم
            if (
                [
                    "PROMPT_REQUIRED",
                    "PROMPT_TOO_SHORT",
                    "AGENT_NOT_FOUND",
                    "AGENT_INACTIVE",
                    "NO_API_KEY",
                    "OUT_OF_SCOPE",
                ].includes(err.code)
            ) {
                throw err;
            }

            // انتظر قبل إعادة المحاولة
            if (attempt < maxRetries) {
                await sleep(delay * (attempt + 1));
            }
        }
    }

    throw lastError;
}

// ============================================
// Helpers
// ============================================

function createError(code, message, userMessage) {
    const err = new Error(message);
    err.code = code;
    err.userMessage = userMessage;
    return err;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function detectErrorCode(message = "") {
    const lower = message.toLowerCase();

    if (lower.includes("prompt")) return "PROMPT_REQUIRED";
    if (lower.includes("agent") && lower.includes("not found"))
        return "AGENT_NOT_FOUND";
    if (lower.includes("inactive")) return "AGENT_INACTIVE";
    if (lower.includes("api key") || lower.includes("api_key"))
        return "NO_API_KEY";
    if (
        lower.includes("out of scope") ||
        lower.includes("خارج نطاق") ||
        lower.includes("outside")
    )
        return "OUT_OF_SCOPE";

    return "AI_ERROR";
}

function translateFunctionError(message = "") {
    const code = detectErrorCode(message);

    const translations = {
        ar: {
            PROMPT_REQUIRED: "الرجاء كتابة طلبك",
            PROMPT_TOO_SHORT: "الطلب قصير جدًا",
            AGENT_NOT_FOUND: "الوكيل غير موجود",
            AGENT_INACTIVE: "الوكيل غير مفعّل",
            NO_API_KEY: "مفتاح API مفقود، تحقق من إعدادات الوكيل",
            OUT_OF_SCOPE:
                "هذا الطلب خارج نطاق التقارير، جرّب طلبًا عن المتجر",
            AI_ERROR: "حدث خطأ في الذكاء الاصطناعي",
            INVALID_RESPONSE: "الرد غير صالح، حاول مرة أخرى",
            NETWORK_ERROR: "فشل الاتصال، تحقق من الإنترنت",
            UNKNOWN: "حدث خطأ غير متوقع",
        },
        en: {
            PROMPT_REQUIRED: "Please type your request",
            PROMPT_TOO_SHORT: "Request is too short",
            AGENT_NOT_FOUND: "Agent not found",
            AGENT_INACTIVE: "Agent is inactive",
            NO_API_KEY: "API key missing, check agent settings",
            OUT_OF_SCOPE:
                "This request is outside the reports scope, try a store-related request",
            AI_ERROR: "AI error occurred",
            INVALID_RESPONSE: "Invalid response, try again",
            NETWORK_ERROR: "Connection failed, check your internet",
            UNKNOWN: "Unexpected error occurred",
        },
    };

    // كشف اللغة من رسالة الخطأ (عربي فيه حروف عربية)
    const isArabic = /[\u0600-\u06FF]/.test(message);
    const lang = isArabic ? "ar" : "en";

    return translations[lang][code] || translations[lang].UNKNOWN;
}

// ============================================
// تطبيع التقرير
// ============================================
function normalizeReport(report) {
    return {
        title: report.title || "تقرير",
        subtitle: report.subtitle || "",
        generated_at: report.generated_at || new Date().toISOString(),
        summary: report.summary || "",
        sections: (report.sections || [])
            .filter((s) => s && s.type)
            .map((section) => normalizeSection(section)),
    };
}

function normalizeSection(section) {
    const base = {
        type: section.type,
        title: section.title || "",
    };

    if (section.type === "stats") {
        return {
            ...base,
            items: (section.items || []).map((item) => ({
                label: item.label || "",
                value: item.value ?? 0,
                color: item.color || "mint",
            })),
        };
    }

    if (section.type === "table") {
        return {
            ...base,
            columns: section.columns || [],
            rows: section.rows || [],
        };
    }

    if (section.type === "chart") {
        return {
            ...base,
            chartType: ["bar", "line", "donut"].includes(section.chartType)
                ? section.chartType
                : "bar",
            data: (section.data || []).map((d) => ({
                label: d.label || "",
                value: Number(d.value) || 0,
            })),
        };
    }

    if (section.type === "text") {
        return {
            ...base,
            content: section.content || "",
        };
    }

    return base;
}

// ============================================
// التحقق من النطاق قبل الإرسال (Optional pre-check)
// ============================================
export function isLikelyInScope(prompt) {
    if (!prompt || prompt.trim().length < 3) return false;

    const outOfScopeKeywords = [
        "طقس",
        "weather",
        "أخبار",
        "news",
        "سياسة",
        "politics",
        "رياضة",
        "sports",
        "موسيقى",
        "music",
        "فيلم",
        "movie",
        "برمجة",
        "coding",
        "طبخ",
        "cooking",
        "ترجمة",
        "translate",
    ];

    const lower = prompt.toLowerCase();
    return !outOfScopeKeywords.some((kw) => lower.includes(kw));
}

// ============================================
// Export الأخطاء المعروفة
// ============================================
export { KNOWN_ERRORS };