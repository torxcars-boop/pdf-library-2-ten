"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ShoppingCart,
  Plus,
  Minus,
  Loader2,
  Package,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  addToCart,
  getCart,
  getCartMarket,
  MarketCode,
} from "@/lib/cart";

type Product = {
  id: string;
  name: string | null;
  name_ar: string | null;
  name_en: string | null;
  description: string | null;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  old_price: number | null;
  category: string | null;
  category_ar: string | null;
  category_en: string | null;
  market_code: MarketCode;
  image_url: string | null;
  images: string[] | null;
  sizes: string[] | null;
  features: string[] | null;
  stock: number;
  active: boolean;
};

const MARKET_INFO: Record<
  MarketCode,
  {
    name: string;
    currency: string;
    currencyCode: string;
    locale: string;
    flag: string;
  }
> = {
  EG: {
    name: "مصر",
    currency: "ج.م",
    currencyCode: "EGP",
    locale: "ar-EG",
    flag: "🇪🇬",
  },
  SA: {
    name: "السعودية",
    currency: "ر.س",
    currencyCode: "SAR",
    locale: "ar-SA",
    flag: "🇸🇦",
  },
  AE: {
    name: "الإمارات",
    currency: "د.إ",
    currencyCode: "AED",
    locale: "ar-AE",
    flag: "🇦🇪",
  },
  JO: {
    name: "الأردن",
    currency: "د.أ",
    currencyCode: "JOD",
    locale: "ar-JO",
    flag: "🇯🇴",
  },
};

export default function ProductPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [quantity, setQuantity] =
    useState(1);

  const [selectedSize, setSelectedSize] =
    useState<string | undefined>(
      undefined
    );

  const [added, setAdded] =
    useState(false);

  const [cartCount, setCartCount] =
    useState(0);

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  const [marketCode, setMarketCode] =
    useState<MarketCode>("EG");

  const [marketMismatch, setMarketMismatch] =
    useState(false);

  /*
   * تحميل السوق الحالي من localStorage.
   */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedMarket =
        window.localStorage.getItem(
          "nexora-market"
        );

      if (
        savedMarket === "EG" ||
        savedMarket === "SA" ||
        savedMarket === "AE" ||
        savedMarket === "JO"
      ) {
        setMarketCode(savedMarket);
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  /*
   * تحميل المنتج حسب السوق الحالي.
   *
   * مهم:
   * لا نكتفي بـ id فقط.
   * المنتج يجب أن يكون تابعًا للسوق المختار.
   */
  useEffect(() => {
    if (!id) return;

    async function loadProduct() {
      try {
        setLoading(true);
        setMarketMismatch(false);

        const { data, error } =
          await supabase
            .from("products")
            .select("*")
            .eq("id", id)
            .eq("active", true)
            .eq("market_code", marketCode)
            .maybeSingle();

        if (error) {
          console.error(
            "PRODUCT LOAD ERROR:",
            error
          );

          setProduct(null);
          return;
        }

        if (!data) {
          setProduct(null);
          return;
        }

        const item = data as Product;

        setProduct(item);
        setSelectedImageIndex(0);

        if (
          item.sizes &&
          item.sizes.length > 0
        ) {
          setSelectedSize(item.sizes[0]);
        } else {
          setSelectedSize(undefined);
        }

        setQuantity(1);
      } catch (error) {
        console.error(
          "PRODUCT ERROR:",
          error
        );

        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id, marketCode]);

  /*
   * تجهيز الصور.
   */
  const productImages = useMemo(() => {
    if (!product) {
      return [];
    }

    const images = Array.isArray(
      product.images
    )
      ? product.images.filter(
          (image): image is string =>
            typeof image === "string" &&
            image.trim().length > 0
        )
      : [];

    if (images.length > 0) {
      return Array.from(
        new Set(images)
      );
    }

    if (
      typeof product.image_url ===
        "string" &&
      product.image_url.trim().length > 0
    ) {
      return [product.image_url];
    }

    return [];
  }, [product]);

  const safeImageIndex =
    productImages.length > 0
      ? Math.min(
          selectedImageIndex,
          productImages.length - 1
        )
      : 0;

  /*
   * تحديث عداد السلة.
   */
  useEffect(() => {
    function updateCartCount() {
      try {
        const cart = getCart();

        const count = cart.reduce(
          (total, item) =>
            total + item.quantity,
          0
        );

        setCartCount(count);
      } catch (error) {
        console.error(
          "CART COUNT ERROR:",
          error
        );
      }
    }

    updateCartCount();

    window.addEventListener(
      "cart-updated",
      updateCartCount
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        updateCartCount
      );
    };
  }, []);

  /*
   * الصورة الحالية.
   */
  const currentImage =
    productImages[safeImageIndex] ||
    productImages[0] ||
    null;

  /*
   * معلومات السوق.
   */
  const market =
    MARKET_INFO[marketCode];

  /*
   * إضافة المنتج للسلة.
   */
  function handleAddToCart() {
    if (!product) {
      return;
    }

    setMarketMismatch(false);

    /*
     * التأكد من المقاس.
     */
    if (
      product.sizes &&
      product.sizes.length > 0 &&
      !selectedSize
    ) {
      alert(
        "من فضلك اختر المقاس أولًا."
      );
      return;
    }

    /*
     * التأكد من المخزون.
     */
    if (product.stock <= 0) {
      alert(
        "هذا المنتج غير متوفر حاليًا."
      );
      return;
    }

    /*
     * التأكد من الكمية.
     */
    const safeQuantity = Math.min(
      Math.max(quantity, 1),
      product.stock
    );

    /*
     * إضافة المنتج.
     */
    const result = addToCart({
      productId: product.id,
      name:
        product.name_ar ||
        product.name ||
        product.name_en ||
        "منتج",
      price: Number(product.price),
      imageUrl:
        product.image_url ||
        currentImage,
      quantity: safeQuantity,
      size: selectedSize,
      marketCode:
        product.market_code ||
        marketCode,
    });

    /*
     * منع خلط الأسواق.
     */
    if (
      !result.success &&
      result.reason ===
        "MARKET_MISMATCH"
    ) {
      setMarketMismatch(true);

      alert(
        "السلة تحتوي بالفعل على منتجات من سوق مختلف. أفرغ السلة أولًا أو استخدم نفس السوق."
      );

      return;
    }

    /*
     * نجاح الإضافة.
     */
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  /*
   * الصورة التالية.
   */
  function nextImage() {
    if (productImages.length <= 1)
      return;

    setSelectedImageIndex(
      (current) =>
        current >=
        productImages.length - 1
          ? 0
          : current + 1
    );
  }

  /*
   * الصورة السابقة.
   */
  function previousImage() {
    if (productImages.length <= 1)
      return;

    setSelectedImageIndex(
      (current) =>
        current <= 0
          ? productImages.length - 1
          : current - 1
    );
  }

  /*
   * زيادة الكمية.
   */
  function increaseQuantity() {
    if (!product) return;

    setQuantity((current) =>
      Math.min(
        current + 1,
        Math.max(product.stock, 1)
      )
    );
  }

  /*
   * تقليل الكمية.
   */
  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  }

  /*
   * Loading.
   */
  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#050505] text-white"
      >
        <Loader2
          size={32}
          className="animate-spin text-[#b6ff00]"
        />
      </main>
    );
  }

  /*
   * المنتج غير موجود في السوق الحالي.
   */
  if (!product) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#050505] px-5 py-20 text-white"
      >
        <div className="mx-auto max-w-xl text-center">
          <Package
            size={50}
            className="mx-auto mb-5 text-white/20"
          />

          <h1 className="text-3xl font-black">
            المنتج غير متاح في هذا السوق
          </h1>

          <p className="mt-4 leading-7 text-white/35">
            هذا المنتج غير متوفر حاليًا داخل سوق{" "}
            <span className="font-bold text-[#b6ff00]">
              {market.flag} {market.name}
            </span>
            .
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-white/35">
              السوق الحالي
            </div>

            <div className="mt-2 font-black">
              {market.flag} {market.name}
            </div>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#b6ff00] px-6 py-3 font-black text-black"
          >
            العودة للمتجر
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  /*
   * أسماء المنتج.
   */
  const nameAr =
    product.name_ar ||
    product.name ||
    "منتج";

  const nameEn =
    product.name_en ||
    product.name ||
    "Product";

  /*
   * وصف المنتج.
   */
  const descriptionAr =
    product.description_ar ||
    product.description ||
    "";

  const descriptionEn =
    product.description_en ||
    product.description ||
    "";

  /*
   * التصنيف.
   */
  const categoryAr =
    product.category_ar ||
    product.category ||
    "";

  const categoryEn =
    product.category_en ||
    product.category ||
    "";

  /*
   * السعر.
   */
  const price =
    Number(product.price) || 0;

  const oldPrice =
    product.old_price !== null
      ? Number(product.old_price)
      : null;

  const formatPrice = (
    value: number
  ) =>
    `${Number(value).toLocaleString(
      market.locale
    )} ${market.currency}`;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050505] text-white"
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            NEXORA
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-white/50 sm:block">
              {market.flag} {market.name}
            </div>

            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70 transition hover:border-white/20 hover:text-white"
            >
              <ShoppingCart size={18} />

              <span>
                السلة
              </span>

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#b6ff00] px-1 text-[11px] font-black text-black">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* PRODUCT */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/40 transition hover:text-white"
        >
          <ArrowRight size={17} />
          العودة للمتجر
        </Link>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* IMAGE GALLERY */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a]">
              <div className="aspect-square bg-black">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={`${nameAr} - صورة ${
                      safeImageIndex + 1
                    }`}
                    className="h-full w-full object-contain p-4 sm:p-8"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/20">
                    <Package size={50} />
                  </div>
                )}
              </div>

              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="الصورة السابقة"
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur transition hover:border-[#b6ff00]/50 hover:bg-black"
                >
                  <ChevronRight size={20} />
                </button>
              )}

              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="الصورة التالية"
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur transition hover:border-[#b6ff00]/50 hover:bg-black"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs font-bold text-white/70 backdrop-blur">
                  {safeImageIndex + 1} /{" "}
                  {productImages.length}
                </div>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                {productImages.map(
                  (image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImageIndex(
                          index
                        )
                      }
                      aria-label={`عرض الصورة ${
                        index + 1
                      }`}
                      className={`relative aspect-square overflow-hidden rounded-xl border bg-[#0a0a0a] transition ${
                        safeImageIndex === index
                          ? "border-[#b6ff00] ring-2 ring-[#b6ff00]/20"
                          : "border-white/10 opacity-70 hover:border-white/30 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${nameAr} - صورة مصغرة ${
                          index + 1
                        }`}
                        className="h-full w-full object-cover"
                      />

                      {safeImageIndex ===
                        index && (
                        <div className="absolute inset-0 bg-[#b6ff00]/10" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="lg:pt-6">
            {/* MARKET */}
            <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-[#b6ff00]/20 bg-[#b6ff00]/5 px-4 py-2">
              <span className="text-lg">
                {market.flag}
              </span>

              <span className="text-xs font-black text-[#b6ff00]">
                {market.name}
              </span>

              <span className="text-xs text-white/30">
                {market.currencyCode}
              </span>
            </div>

            {/* CATEGORY */}
            {(categoryAr ||
              categoryEn) && (
              <div className="mb-4">
                <span className="rounded-full bg-[#b6ff00]/10 px-4 py-2 text-xs font-black text-[#b6ff00]">
                  {categoryAr ||
                    categoryEn}
                </span>
              </div>
            )}

            {/* TITLE */}
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              {nameAr}
            </h1>

            {nameEn &&
              nameEn !== nameAr && (
                <div
                  dir="ltr"
                  className="mt-2 text-lg font-medium text-white/25"
                >
                  {nameEn}
                </div>
              )}

            {/* DESCRIPTION */}
            {(descriptionAr ||
              descriptionEn) && (
              <div className="mt-8 space-y-4">
                {descriptionAr && (
                  <p className="text-base leading-8 text-white/55">
                    {descriptionAr}
                  </p>
                )}

                {descriptionEn && (
                  <p
                    dir="ltr"
                    className="text-sm leading-7 text-white/30"
                  >
                    {descriptionEn}
                  </p>
                )}
              </div>
            )}

            {/* PRICE */}
            <div className="mt-8 flex flex-wrap items-end gap-3">
              <span className="text-4xl font-black text-[#b6ff00]">
                {formatPrice(price)}
              </span>

              {oldPrice !== null &&
                oldPrice > price && (
                  <span className="mb-1 text-lg text-white/25 line-through">
                    {formatPrice(
                      oldPrice
                    )}
                  </span>
                )}
            </div>

            {/* SIZES */}
            {product.sizes &&
              product.sizes.length > 0 && (
                <div className="mt-9">
                  <div className="mb-3 text-sm font-black">
                    اختر المقاس
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(
                      (size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setSelectedSize(
                              size
                            )
                          }
                          className={`min-w-14 rounded-xl border px-4 py-3 text-sm font-black transition ${
                            selectedSize ===
                            size
                              ? "border-[#b6ff00] bg-[#b6ff00] text-black"
                              : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {size}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* QUANTITY */}
            <div className="mt-8">
              <div className="mb-3 text-sm font-black">
                الكمية
              </div>

              <div className="flex w-fit items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <button
                  type="button"
                  onClick={
                    decreaseQuantity
                  }
                  disabled={
                    quantity <= 1
                  }
                  className="p-4 text-white/50 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={17} />
                </button>

                <span className="min-w-12 text-center font-black">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={
                    increaseQuantity
                  }
                  disabled={
                    product.stock <= 0 ||
                    quantity >=
                      product.stock
                  }
                  className="p-4 text-white/50 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>

            {/* STOCK */}
            <div className="mt-5 text-sm">
              {product.stock > 0 ? (
                <span className="text-[#b6ff00]">
                  متوفر في المخزون
                </span>
              ) : (
                <span className="text-red-400">
                  غير متوفر حاليًا
                </span>
              )}
            </div>

            {/* MARKET MISMATCH */}
            {marketMismatch && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm leading-7 text-red-300">
                السلة تحتوي على منتجات من سوق
                مختلف. لا يمكن دمج منتجات من
                أسواق مختلفة في نفس الطلب.
              </div>
            )}

            {/* ADD TO CART */}
            <button
              type="button"
              onClick={
                handleAddToCart
              }
              disabled={
                product.stock <= 0 ||
                added
              }
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#b6ff00] px-6 py-5 text-lg font-black text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {added ? (
                <>
                  <CheckCircle2
                    size={21}
                  />
                  تمت الإضافة إلى السلة ✓
                </>
              ) : (
                <>
                  <ShoppingCart
                    size={21}
                  />

                  {product.stock <= 0
                    ? "غير متوفر حاليًا"
                    : "أضف إلى السلة"}
                </>
              )}
            </button>

            {/* VIEW CART */}
            <Link
              href="/cart"
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/10 px-6 py-4 text-sm font-bold text-white/60 transition hover:border-white/25 hover:text-white"
            >
              عرض السلة وإتمام الطلب
            </Link>
          </div>
        </div>

        {/* FEATURES */}
        {product.features &&
          product.features.length > 0 && (
            <section className="mt-16 border-t border-white/10 pt-12">
              <h2 className="text-2xl font-black">
                مميزات المنتج
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {product.features.map(
                  (
                    feature,
                    index
                  ) => (
                    <div
                      key={`${feature}-${index}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm font-bold text-white/65"
                    >
                      <span className="mr-2 text-[#b6ff00]">
                        ✓
                      </span>

                      {feature}
                    </div>
                  )
                )}
              </div>
            </section>
          )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-7xl px-5 text-center text-xs text-white/25 sm:px-8">
          جميع الحقوق محفوظة ©{" "}
          {new Date().getFullYear()}{" "}
          NEXORA
        </div>
      </footer>
    </main>
  );
}
