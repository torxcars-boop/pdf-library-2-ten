import { NextResponse } from "next/server";
import OpenAI from "openai";

type Category = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
};

type GeneratedProduct = {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  features: string[];
  sizes: string[];
  category_id: string;
  seo_title_ar: string;
  seo_title_en: string;
  seo_description_ar: string;
  seo_description_en: string;
  keywords: string[];
};

function getClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://nexora-online.vercel.app",
      "X-Title": "NEXORA AI Product Creator",
    },
  });
}

function cleanJson(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const images = Array.isArray(body?.images)
      ? body.images.filter(
          (image: unknown) =>
            typeof image === "string" &&
            image.startsWith("data:image/")
        )
      : [];

    const categories: Category[] = Array.isArray(body?.categories)
      ? body.categories
          .filter(
            (category: any) =>
              category &&
              typeof category.id === "string" &&
              typeof category.name_ar === "string" &&
              typeof category.name_en === "string"
          )
          .map((category: any) => ({
            id: category.id,
            name_ar: category.name_ar,
            name_en: category.name_en,
            slug: category.slug || "",
          }))
      : [];

    if (images.length === 0) {
      return NextResponse.json(
        {
          error: "يجب رفع صورة واحدة على الأقل.",
        },
        { status: 400 }
      );
    }

    if (images.length > 10) {
      return NextResponse.json(
        {
          error: "الحد الأقصى 10 صور.",
        },
        { status: 400 }
      );
    }

    if (categories.length === 0) {
      return NextResponse.json(
        {
          error: "لا توجد أقسام متاحة.",
        },
        { status: 400 }
      );
    }

    const categoryCatalog = categories.map((category) => ({
      id: category.id,
      name_ar: category.name_ar,
      name_en: category.name_en,
      slug: category.slug,
    }));

    const prompt = `
أنت خبير إنشاء منتجات لمتجر إلكتروني اسمه NEXORA.

حلل صور المنتج المرفقة بدقة.

مهمتك إنشاء بيانات منتج احترافية اعتمادًا فقط على ما يمكن استنتاجه بوضوح من الصور.

قواعد مهمة جدًا:

1. لا تخترع ماركة غير ظاهرة.
2. لا تخترع سعرًا.
3. لا تخترع خصمًا.
4. لا تخترع مقاسات غير واضحة.
5. لا تخترع خامة أو مواصفات تقنية غير ظاهرة أو مؤكدة.
6. لا تدّعي خصائص طبية أو علاجية.
7. لا تكتب ادعاءات غير مؤكدة.
8. الاسم يكون تسويقيًا لكن واضحًا.
9. الوصف العربي باللهجة العربية التجارية الاحترافية.
10. الوصف الإنجليزي احترافي وطبيعي.
11. features تكون نقاط قصيرة ومفيدة.
12. sizes:
   - إذا كانت المقاسات واضحة من الصورة اكتبها.
   - إذا لم تكن واضحة أرجع [].
13. اختر أفضل قسم موجود فقط من قائمة الأقسام المرسلة.
14. ممنوع إنشاء category_id جديد.
15. SEO يجب أن يكون مرتبطًا بالمنتج فعلًا.
16. keywords كلمات بحث حقيقية مرتبطة بالمنتج.
17. إذا لم تستطع معرفة معلومة، اتركها فارغة بدل اختراعها.

الأقسام المتاحة:

${JSON.stringify(categoryCatalog)}

أرجع JSON فقط بهذا الشكل:

{
  "name_ar": "",
  "name_en": "",
  "description_ar": "",
  "description_en": "",
  "features": [],
  "sizes": [],
  "category_id": "",
  "seo_title_ar": "",
  "seo_title_en": "",
  "seo_description_ar": "",
  "seo_description_en": "",
  "keywords": []
}
`;

    const content: any[] = [
      {
        type: "text",
        text: prompt,
      },
      ...images.map((image: string) => ({
        type: "image_url",
        image_url: {
          url: image,
        },
      })),
    ];

    const client = getClient();

    const response = await client.chat.completions.create({
      model: "openrouter/free",
      messages: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
    });

    const output =
      response.choices?.[0]?.message?.content?.trim() || "";

    if (!output) {
      return NextResponse.json(
        {
          error: "الذكاء الاصطناعي لم يرجع نتيجة.",
        },
        { status: 502 }
      );
    }

    let result: GeneratedProduct;

    try {
      result = JSON.parse(cleanJson(output));
    } catch {
      console.error("AI PRODUCT INVALID JSON:", output);

      return NextResponse.json(
        {
          error: "تعذر قراءة نتيجة الذكاء الاصطناعي.",
        },
        { status: 502 }
      );
    }

    const validCategory = categories.find(
      (category) => category.id === result.category_id
    );

    if (!validCategory) {
      const normalizedName =
        `${result.name_ar || ""} ${result.name_en || ""}`.toLowerCase();

      const fallback = categories.find((category) => {
        const words = [
          category.name_ar,
          category.name_en,
          category.slug,
        ]
          .join(" ")
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean);

        return words.some((word) => normalizedName.includes(word));
      });

      result.category_id = fallback?.id || categories[0].id;
    }

    result.features = Array.isArray(result.features)
      ? result.features
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 12)
      : [];

    result.sizes = Array.isArray(result.sizes)
      ? result.sizes
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];

    result.keywords = Array.isArray(result.keywords)
      ? result.keywords
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];

    return NextResponse.json({
      product: result,
    });
  } catch (error) {
    console.error("AI PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء إنشاء المنتج.",
      },
      { status: 500 }
    );
  }
}
