"use client";

import {
  ChangeEvent,
  useMemo,
  useState,
} from "react";
import {
  Bot,
  Check,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

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

type ApplyProduct = {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  category_id: string;
  features: string[];
  sizes: string[];
  images: string[];
};

type Props = {
  categories: Category[];
  onApply: (product: ApplyProduct) => void;
  onClose: () => void;
};

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 1600;

        let width = image.width;
        let height = image.height;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(
            maxSize / width,
            maxSize / height
          );

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("تعذر معالجة الصورة."));
          return;
        }

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        resolve(
          canvas.toDataURL(
            "image/jpeg",
            0.78
          )
        );
      };

      image.onerror = () =>
        reject(
          new Error("تعذر قراءة الصورة.")
        );

      image.src = String(reader.result);
    };

    reader.onerror = () =>
      reject(
        new Error("تعذر قراءة الملف.")
      );

    reader.readAsDataURL(file);
  });
}

export default function AIProductCreator({
  categories,
  onApply,
  onClose,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] =
    useState<GeneratedProduct | null>(null);
  const [error, setError] = useState("");

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) =>
          category.id ===
          generated?.category_id
      ),
    [categories, generated?.category_id]
  );

  async function handleFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected = Array.from(
      event.target.files || []
    ).slice(0, 10);

    if (!selected.length) return;

    const invalid = selected.find(
      (file) =>
        !file.type.startsWith("image/")
    );

    if (invalid) {
      setError("كل الملفات يجب أن تكون صورًا.");
      return;
    }

    const tooLarge = selected.find(
      (file) =>
        file.size > 8 * 1024 * 1024
    );

    if (tooLarge) {
      setError(
        `الصورة ${tooLarge.name} أكبر من 8MB.`
      );
      return;
    }

    try {
      setError("");

      const converted: string[] = [];

      for (const file of selected) {
        converted.push(
          await resizeImage(file)
        );
      }

      setFiles(selected);
      setPreviews(converted);
      setGenerated(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر تجهيز الصور."
      );
    }
  }

  function removeImage(index: number) {
    setFiles((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );

    setPreviews((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );

    setGenerated(null);
  }

  async function generate() {
    if (!previews.length) {
      setError("ارفع صورة واحدة على الأقل.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/ai-product",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images: previews,
            categories,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "تعذر إنشاء المنتج."
        );
      }

      setGenerated(data.product);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ غير متوقع."
      );
    } finally {
      setLoading(false);
    }
  }

  function applyProduct() {
    if (!generated) return;

    onApply({
      name_ar:
        generated.name_ar || "",
      name_en:
        generated.name_en || "",
      description_ar:
        generated.description_ar || "",
      description_en:
        generated.description_en || "",
      category_id:
        generated.category_id || "",
      features:
        generated.features || [],
      sizes:
        generated.sizes || [],
      images: [],
    });
  }

  return (
    <section className="mb-10 rounded-[2rem] border border-[#b6ff00]/20 bg-[#0a0a0a] p-5 shadow-2xl sm:p-8">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#b6ff00]">
            <Sparkles size={17} />
            NEXORA AI
          </div>

          <h2 className="text-2xl font-black sm:text-3xl">
            إنشاء منتج بالذكاء الاصطناعي
          </h2>

          <p className="mt-2 text-sm text-white/45">
            ارفع صور المنتج ودع الذكاء الاصطناعي
            يقترح بيانات المنتج والقسم المناسب.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 p-2 text-white/50 transition hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-white/10 px-5 py-10 text-center transition hover:border-[#b6ff00]/40">
          <ImagePlus
            size={36}
            className="mb-3 text-[#b6ff00]"
          />

          <span className="font-black">
            رفع صور المنتج
          </span>

          <span className="mt-1 text-xs text-white/35">
            من 1 إلى 10 صور — الحد الأقصى 8MB للصورة
          </span>

          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </label>

        {previews.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {previews.map(
              (preview, index) => (
                <div
                  key={`${preview}-${index}`}
                  className="group relative overflow-hidden rounded-xl border border-white/10"
                >
                  <img
                    src={preview}
                    alt={`Product ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(index)
                    }
                    className="absolute right-2 top-2 rounded-lg bg-black/80 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={
            loading ||
            previews.length === 0
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b6ff00] px-5 py-4 font-black text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />
              جاري تحليل الصور...
            </>
          ) : generated ? (
            <>
              <RefreshCw size={18} />
              إعادة إنشاء البيانات
            </>
          ) : (
            <>
              <Bot size={18} />
              تحليل وإنشاء المنتج
            </>
          )}
        </button>
      </div>

      {generated && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Check
                size={18}
                className="text-[#b6ff00]"
              />
              <h3 className="font-black">
                النتيجة المقترحة
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs text-white/40">
                  الاسم بالعربية
                </label>

                <input
                  value={generated.name_ar}
                  onChange={(event) =>
                    setGenerated({
                      ...generated,
                      name_ar:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#b6ff00]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/40">
                  English Name
                </label>

                <input
                  value={generated.name_en}
                  onChange={(event) =>
                    setGenerated({
                      ...generated,
                      name_en:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#b6ff00]/50"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs text-white/40">
                  الوصف العربي
                </label>

                <textarea
                  value={
                    generated.description_ar
                  }
                  onChange={(event) =>
                    setGenerated({
                      ...generated,
                      description_ar:
                        event.target.value,
                    })
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#b6ff00]/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/40">
                  English Description
                </label>

                <textarea
                  value={
                    generated.description_en
                  }
                  onChange={(event) =>
                    setGenerated({
                      ...generated,
                      description_en:
                        event.target.value,
                    })
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#b6ff00]/50"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <label className="mb-2 block text-sm font-bold">
              القسم المقترح
            </label>

            <select
              value={generated.category_id}
              onChange={(event) =>
                setGenerated({
                  ...generated,
                  category_id:
                    event.target.value,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none"
            >
              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name_ar} —{" "}
                    {category.name_en}
                  </option>
                )
              )}
            </select>

            {selectedCategory && (
              <p className="mt-2 text-xs text-white/35">
                تم اختيار:{" "}
                {selectedCategory.name_ar}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <label className="mb-2 block text-sm font-bold">
              المميزات
            </label>

            <textarea
              value={generated.features.join(
                ", "
              )}
              onChange={(event) =>
                setGenerated({
                  ...generated,
                  features:
                    event.target.value
                      .split(",")
                      .map((item) =>
                        item.trim()
                      )
                      .filter(Boolean),
                })
              }
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none"
            />

            <p className="mt-2 text-xs text-white/30">
              افصل بين كل ميزة والأخرى بفاصلة.
            </p>
          </div>

          <div className="rounded-2xl border border-[#b6ff00]/20 bg-[#b6ff00]/[0.03] p-5">
            <h3 className="mb-3 font-black">
              SEO المقترح
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-white/35">
                  SEO Title:
                </span>{" "}
                {generated.seo_title_ar}
              </div>

              <div>
                <span className="text-white/35">
                  SEO Description:
                </span>{" "}
                {generated.seo_description_ar}
              </div>

              <div>
                <span className="text-white/35">
                  Keywords:
                </span>{" "}
                {generated.keywords.join(
                  "، "
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.03] p-4 text-sm text-yellow-200/80">
            السعر والسعر القديم والمخزون لن يقوم
            الذكاء الاصطناعي بتخمينهم. سيتم إدخالهم
            يدويًا في فورم المنتج بعد تطبيق البيانات.
          </div>

          <button
            type="button"
            onClick={applyProduct}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b6ff00] px-5 py-4 font-black text-black"
          >
            <Check size={18} />
            استخدام البيانات في فورم المنتج
          </button>
        </div>
      )}
    </section>
  );
}
