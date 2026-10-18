// ============================================
// Mock AI Service — يولّد بيانات منتج
// استبدلها بـ OpenAI/Gemini API
// ============================================
export async function generateProductWithAI({ name, category, keywords }) {
  // محاكاة استدعاء API
  await new Promise((r) => setTimeout(r, 1800));

  const PRICE_RANGES = {
    إلكترونيات: [600, 3000],
    كمبيوتر: [1500, 5000],
    ملحقات: [30, 500],
    صوتيات: [150, 1500],
    شبكات: [100, 800],
    تصوير: [500, 2500],
  };

  const [min, max] = PRICE_RANGES[category] || [100, 2000];
  const price = Math.round((Math.random() * (max - min) + min) / 10) * 10;

  // وصف مولّد
  const descriptions = [
    `منتج ${name} عالي الجودة من فئة ${category}. يتميز بأداء ممتاز وتصميم عصري يلبي احتياجاتك اليومية. مصنوع من مواد متينة تضمن لك عمرًا طويلاً.`,
    `${name} الاحترافي - الحل الأمثل للاستخدام اليومي. يجمع بين الأداء القوي والسعر المناسب، مع ضمان الجودة والموثوقية.`,
    `اكتشف ${name} من ${category}، المنتج الذي يجمع بين التقنية الحديثة والتصميم الأنيق. مثالي للمستخدمين الذين يبحثون عن القيمة مقابل المال.`,
  ];

  const tags = [
    "جديد",
    "الأكثر مبيعًا",
    "موصى به",
    "عرض خاص",
    keywords || "عالي الجودة",
  ];

  return {
    name,
    sku: `AI-${Date.now().toString().slice(-6)}`,
    category,
    price,
    stock: Math.floor(Math.random() * 100) + 10,
    rating: (Math.random() * 1 + 4).toFixed(1),
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    tags,
    suggestedImages: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
    ],
  };
}

// ============================================
// Mock AI لتوليد وصف فقط
// ============================================
export async function generateDescriptionWithAI({ name, category }) {
  await new Promise((r) => setTimeout(r, 1000));
  return `${name} من فئة ${category} — منتج احترافي بأداء ممتاز، مصمم ليلبي احتياجاتك اليومية بأعلى معايير الجودة.`;
}
