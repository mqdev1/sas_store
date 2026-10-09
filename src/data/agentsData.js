// src/data/agentsData.js

// ✅ القائمة ثابتة (لتُخزّن كـ IDs في DB)
export const AVAILABLE_TOOLS = [
  {
    id: "query_orders",
    name: "تحليل الطلبات",
    description: "البحث وتصفية الطلبات",
  },
  {
    id: "analyze_products",
    name: "تحليل المنتجات",
    description: "إحصائيات المنتجات والمخزون",
  },
  {
    id: "manage_clients",
    name: "إدارة العملاء",
    description: "عرض بيانات العملاء",
  },
  {
    id: "generate_report",
    name: "توليد التقارير",
    description: "إنشاء تقارير المبيعات",
  },
  {
    id: "check_shipping",
    name: "تتبع الشحن",
    description: "الاستعلام عن حالة الشحنات",
  },
  {
    id: "process_payments",
    name: "معالجة المدفوعات",
    description: "الاستعلام عن المدفوعات",
  },
  {
    id: "generate_product",
    name: "توليد منتجات",
    description: "توليد بيانات منتج بالذكاء الاصطناعي",
  },
];

// ✅ قائمة النماذج المتاحة حسب المزود
export const PROVIDERS = [
  { key: "groq", label: "Groq" },
  { key: "gemini", label: "Gemini" },
  { key: "openrouter", label: "OpenRouter" },
  { key: "openai", label: "OpenAI" },
  { key: "anthropic", label: "Anthropic" },
];

export const MODELS_BY_PROVIDER = {
  groq: [
    "openai/gpt-oss-20b", // ⭐ الأفضل — مجاني + Tool Calling
    "openai/gpt-oss-120b", // أقوى
    "qwen/qwen3.6-27b", // متعدد الوسائط (Preview)
  ],
  gemini: ["gemini-1.5-flash", "gemini-1.5-pro"],
  openrouter: ["qwen/qwen3.6-plus:free", "openai/gpt-oss-20b:free"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  anthropic: ["claude-3-5-sonnet", "claude-3-opus"],
};

// ============================================
// قوالب System Prompts جاهزة
// ============================================
export const PROMPT_TEMPLATES = [
  {
    id: "orders_specialist",
    name: "متخصص الطلبات",
    description: "يجيب على أسئلة الطلبات فقط",
    prompt: `أنت مساعد ذكي في متجر إلكتروني فقط ومتخصص في تحليل الطلبات.
لا تجيب على أي مواضيع خارجية أبداً.
فقط الأمور الخاصة بالطلبات الموجودة في المتجر.
أجب بالعربية بدقة واختصار.`,
    tools: ["query_orders", "generate_report"],
  },
  {
    id: "products_specialist",
    name: "متخصص المنتجات",
    description: "يجيب على أسئلة المنتجات والمخزون",
    prompt: `أنت مساعد ذكي في متجر إلكتروني، متخصص حصرياً في المنتجات والمخزون.
لا تجيب على أي موضوع خارج نطاق المنتجات.
قدم معلومات دقيقة عن الأسعار، المخزون، والمبيعات.
أجب بالعربية بدقة واختصار.`,
    tools: ["analyze_products", "query_orders"],
  },
  {
    id: "clients_specialist",
    name: "متخصص العملاء",
    description: "يجيب على أسئلة العملاء",
    prompt: `أنت مساعد ذكي في متجر إلكتروني، متخصص فقط في بيانات العملاء.
لا تجيب على أي موضوع خارج نطاق العملاء.
قدم معلومات دقيقة عن العملاء، طلباتهم، ومشترياتهم.
أجب بالعربية بدقة واختصار.`,
    tools: ["manage_clients", "query_orders"],
  },
  {
    id: "shipping_specialist",
    name: "متخصص الشحن",
    description: "يتابع حالة الشحنات",
    prompt: `أنت مساعد ذكي في متجر إلكتروني، متخصص فقط في الشحنات والتوصيل.
لا تجيب على أي موضوع خارج نطاق الشحن.
قدم معلومات دقيقة عن حالة الشحنات ومواعيد التوصيل.
أجب بالعربية بدقة واختصار.`,
    tools: ["check_shipping", "query_orders"],
  },
  {
    id: "payments_specialist",
    name: "متخصص المدفوعات",
    description: "يجيب على أسئلة المدفوعات",
    prompt: `أنت مساعد ذكي في متجر إلكتروني، متخصص فقط في المدفوعات والمعاملات المالية.
لا تجيب على أي موضوع خارج نطاق المدفوعات.
قدم معلومات دقيقة عن المعاملات، العمولات، والمبالغ.
أجب بالعربية بدقة واختصار.`,
    tools: ["process_payments", "generate_report"],
  },
  {
    id: "reports_specialist",
    name: "متخصص التقارير",
    description: "يولّد تقارير وإحصائيات",
    prompt: `أنت مساعد ذكي في متجر إلكتروني، متخصص فقط في التقارير والإحصائيات.
لا تجيب على أي موضوع خارج نطاق التقارير.
قدم تحليلات دقيقة بأرقام وإحصائيات واضحة.
أجب بالعربية بدقة واختصار.`,
    tools: ["generate_report", "query_orders", "analyze_products"],
  },
  {
    id: "general_manager",
    name: "مدير عام شامل",
    description: "يجيب على كل أسئلة المتجر",
    prompt: `أنت مساعد ذكي شامل في متجر إلكتروني.
لديك صلاحية الوصول لكل بيانات المتجر: الطلبات، المنتجات، العملاء، الشحن، والمدفوعات.
قدم إجابات دقيقة ومختصرة بالعربية.
لا تجيب على مواضيع خارج نطاق المتجر أبداً.`,
    tools: [
      "query_orders",
      "analyze_products",
      "manage_clients",
      "generate_report",
      "check_shipping",
      "process_payments",
    ],
  },
  {
    id: "product_generator",
    name: "مولّد المنتجات",
    description: "متخصص في توليد بيانات المنتجات",
    prompt: `أنت كاتب محتوى تسويقي احترافي متخصص في المنتجات.

مهمتك: توليد بيانات منتج كاملة بالعربية.

قواعد إلزامية:
1. الوصف: 150-250 كلمة بالعربية بنبرة تسويقية جذابة.
   - ابدأ بجملة ترويجية قوية.
   - اذكر 3-4 ميزات تقنية بأرقام محددة.
   - اذكر الجمهور المستهدف.
   - اختتم بدعوة للشراء.
2. الكلمات المفتاحية: 5-7 كلمات خاصة بالموديل المحدد.

لا تكتب وصفاً قصيراً أبداً.
لا تولّد صوراً ولا روابط صور.
أعد JSON فقط.`,
    tools: ["generate_product"],
  },
];
