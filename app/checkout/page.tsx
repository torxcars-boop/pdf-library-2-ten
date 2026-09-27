"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";

import {
  CartItem,
  MarketCode,
  getCart,
  clearCart,
  getCartTotal,
  getCartMarket,
} from "@/lib/cart";

type MarketInfo = {
  name: string;
  currency: string;
  currencyCode: string;
  locale: string;
  countryCode: string;
};

const MARKET_INFO: Record<MarketCode, MarketInfo> = {
  EG: {
    name: "مصر",
    currency: "ج.م",
    currencyCode: "EGP",
    locale: "ar-EG",
    countryCode: "🇪🇬",
  },
  SA: {
    name: "السعودية",
    currency: "ر.س",
    currencyCode: "SAR",
    locale: "ar-SA",
    countryCode: "🇸🇦",
  },
  AE: {
    name: "الإمارات",
    currency: "د.إ",
    currencyCode: "AED",
    locale: "ar-AE",
    countryCode: "🇦🇪",
  },
  JO: {
    name: "الأردن",
    currency: "د.أ",
    currencyCode: "JOD",
    locale: "ar-JO",
    countryCode: "🇯🇴",
  },
};

const WHATSAPP_NUMBER = "201115491611";

const GOVERNORATES: Record<MarketCode, string[]> = {
  EG: [
    "القاهرة",
    "الجيزة",
    "الإسكندرية",
    "الدقهلية",
    "البحيرة",
    "الشرقية",
    "القليوبية",
    "الغربية",
    "المنوفية",
    "كفر الشيخ",
    "دمياط",
    "بورسعيد",
    "الإسماعيلية",
    "السويس",
    "الفيوم",
    "بني سويف",
    "المنيا",
    "أسيوط",
    "سوهاج",
    "قنا",
    "الأقصر",
    "أسوان",
    "البحر الأحمر",
    "الوادي الجديد",
    "مطروح",
    "شمال سيناء",
    "جنوب سيناء",
  ],
  SA: [
    "الرياض",
    "مكة المكرمة",
    "المدينة المنورة",
    "القصيم",
    "المنطقة الشرقية",
    "عسير",
    "تبوك",
    "حائل",
    "الحدود الشمالية",
    "جازان",
    "نجران",
    "الباحة",
    "الجوف",
  ],
  AE: [
    "أبوظبي",
    "دبي",
    "الشارقة",
    "عجمان",
    "أم القيوين",
    "رأس الخيمة",
    "الفجيرة",
  ],
  JO: [
    "عمّان",
    "إربد",
    "الزرقاء",
    "البلقاء",
    "مادبا",
    "الكرك",
    "الطفيلة",
    "معان",
    "العقبة",
    "جرش",
    "عجلون",
    "المفرق",
  ],
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const cart = getCart();

      setItems(cart);
      setReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const marketCode = getCartMarket(items) || "EG";
  const market = MARKET_INFO[marketCode];

  const subtotal = getCartTotal(items);
  const shipping = 0;
  const total = subtotal + shipping;

  const formatPrice = (value: number) => {
    return `${Number(value).toLocaleString(
      market.locale
    )} ${market.currency}`;
  };

  const submitOrder = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (items.length === 0) {
      alert("السلة فارغة.");
      return;
    }

    if (!name.trim()) {
      alert("من فضلك اكتب الاسم.");
      return;
    }

    if (!phone.trim()) {
      alert("من فضلك اكتب رقم الهاتف.");
      return;
    }

    if (!governorate.trim()) {
      alert("من فضلك اختر المنطقة.");
      return;
    }

    if (!address.trim()) {
      alert("من فضلك اكتب العنوان.");
      return;
    }

    setSubmitting(true);

    const generatedOrderId = `NEXORA-${crypto
      .randomUUID()
      .split("-")[0]
      .toUpperCase()}`;

    const productsText = items
      .map((item, index) => {
        const itemTotal =
          Number(item.price) *
          Number(item.quantity);

        return [
          `${index + 1}) ${item.name}`,
          `   الكمية: ${item.quantity}`,
          item.size
            ? `   المقاس: ${item.size}`
            : null,
          `   السعر: ${formatPrice(item.price)}`,
          `   الإجمالي: ${formatPrice(itemTotal)}`,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const message = `
🛍️ *طلب شراء جديد - NEXORA*
━━━━━━━━━━━━━━━━━━

📦 *رقم الطلب:*
${generatedOrderId}

🌍 *السوق:*
${market.countryCode} ${market.name}

💱 *العملة:*
${market.currencyCode} — ${market.currency}

👤 *بيانات العميل:*

الاسم:
${name.trim()}

رقم الهاتف:
${phone.trim()}

المنطقة:
${governorate.trim()}

العنوان:
${address.trim()}

${
  notes.trim()
    ? `ملاحظات:
${notes.trim()}

`
    : ""
}━━━━━━━━━━━━━━━━━━

🛒 *المنتجات:*

${productsText}

━━━━━━━━━━━━━━━━━━

💰 *ملخص الطلب:*

قيمة المنتجات:
${formatPrice(subtotal)}

الشحن:
سيتم تحديده

*الإجمالي:*
${formatPrice(total)}

━━━━━━━━━━━━━━━━━━

🌐 تم إرسال الطلب من متجر NEXORA
`.trim();

    const whatsappUrl =
      `https://wa.me/${WHATSAPP_NUMBER}` +
      `?text=${encodeURIComponent(message)}`;

    const whatsappWindow = window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );

    if (!whatsappWindow) {
      window.open(whatsappUrl, "_self");
    }

    clearCart();

    setItems([]);
    setOrderId(generatedOrderId);
    setSubmitting(false);
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <Loader2
          size={28}
          className="animate-spin text-[#b6ff00]"
        />
      </main>
    );
  }

  if (orderId) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#050505] px-5 text-white"
      >
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 text-center sm:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#b6ff00]/10">
            <CheckCircle2
              size={52}
              className="text-[#b6ff00]"
            />
          </div>

          <div className="text-xs font-bold tracking-[0.2em] text-[#b6ff00]">
            ORDER SENT
          </div>

          <h1 className="mt-3 text-3xl font-black">
            تم إرسال طلبك بنجاح
          </h1>

          <p className="mt-4 text-sm leading-7 text-white/40">
            تم تجهيز طلبك وإرساله إلى واتساب.
            <br />
            سنتواصل معك لتأكيد التفاصيل والشحن.
          </p>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs text-white/35">
              رقم الطلب
            </div>

            <div className="mt-2 break-all font-mono text-sm font-bold text-[#b6ff00]">
              {orderId}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-white/35">
              السوق
            </div>

            <div className="mt-1 font-black">
              {market.countryCode} {market.name}
            </div>

            <div className="mt-1 text-xs text-[#b6ff00]">
              {market.currencyCode} —{" "}
              {market.currency}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#b6ff00]/20 bg-[#b6ff00]/5 p-4">
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#b6ff00]">
              <MessageCircle size={18} />
              تم إرسال الطلب عبر واتساب
            </div>
          </div>

          <Link
            href="/"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b6ff00] px-5 py-4 font-black text-black transition hover:scale-[1.01]"
          >
            العودة للمتجر
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#050505] px-5 text-white"
      >
        <div className="text-center">
          <ShoppingBag
            size={50}
            className="mx-auto mb-5 text-white/15"
          />

          <h1 className="text-2xl font-black">
            السلة فارغة
          </h1>

          <p className="mt-3 text-sm text-white/35">
            أضف منتجات إلى السلة أولًا.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#b6ff00] px-6 py-4 font-black text-black"
          >
            العودة للمتجر
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050505] text-white"
    >
      <header className="border-b border-white/10 bg-black/80">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
          >
            <ArrowRight size={18} />
            العودة للسلة
          </Link>

          <div className="text-xl font-black">
            NEXORA
          </div>

          <div className="text-sm text-white/35">
            إتمام الطلب
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="mb-10">
          <div className="text-xs font-bold tracking-[0.2em] text-[#b6ff00]">
            CHECKOUT
          </div>

          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            إتمام الطلب
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/40">
            أدخل بياناتك بدقة حتى نتمكن من التواصل
            معك وتوصيل طلبك.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-[#b6ff00]/20 bg-[#b6ff00]/5 px-5 py-3">
            <span className="text-xl">
              {market.countryCode}
            </span>

            <div>
              <div className="text-xs text-white/40">
                السوق المختار
              </div>

              <div className="font-black text-[#b6ff00]">
                {market.name}
              </div>
            </div>

            <div className="mr-2 border-r border-white/10 pr-4 text-sm text-white/40">
              {market.currencyCode}
              {" — "}
              {market.currency}
            </div>
          </div>
        </div>

        <form
          onSubmit={submitOrder}
          className="grid gap-8 lg:grid-cols-[1fr_360px]"
        >
          <div className="rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
            <h2 className="text-2xl font-black">
              بيانات العميل
            </h2>

            <div className="mt-7 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  الاسم بالكامل *
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="اكتب اسمك بالكامل"
                  className="checkout-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  رقم الهاتف *
                </label>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="01xxxxxxxxx"
                  type="tel"
                  dir="ltr"
                  className="checkout-input text-left"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  المحافظة / المنطقة *
                </label>

                <select
                  value={governorate}
                  onChange={(e) =>
                    setGovernorate(e.target.value)
                  }
                  className="checkout-input"
                  required
                >
                  <option value="">
                    اختر المحافظة / المنطقة
                  </option>

                  {GOVERNORATES[marketCode].map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  العنوان بالتفصيل *
                </label>

                <textarea
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  placeholder="المدينة، المنطقة، الشارع، رقم المنزل..."
                  rows={4}
                  className="checkout-input resize-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  ملاحظات إضافية
                </label>

                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  placeholder="أي ملاحظات خاصة بالطلب..."
                  rows={3}
                  className="checkout-input resize-none"
                />
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-6 lg:sticky lg:top-8">
            <div className="mb-6">
              <div className="text-xs font-bold text-[#b6ff00]">
                YOUR ORDER
              </div>

              <h2 className="mt-2 text-2xl font-black">
                ملخص الطلب
              </h2>
            </div>

            <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs text-white/40">
                السوق
              </div>

              <div className="mt-1 font-black">
                {market.countryCode}{" "}
                {market.name}
              </div>

              <div className="mt-1 text-xs text-[#b6ff00]">
                {market.currencyCode} —{" "}
                {market.currency}
              </div>
            </div>

            <div className="space-y-4 border-b border-white/10 pb-5">
              {items.map((item, index) => (
                <div
                  key={`${item.productId}-${item.size || "default"}-${index}`}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      {item.name}
                    </div>

                    <div className="mt-1 text-xs text-white/30">
                      الكمية: {item.quantity}

                      {item.size
                        ? ` • المقاس: ${item.size}`
                        : ""}
                    </div>
                  </div>

                  <div className="shrink-0 text-sm font-bold text-[#b6ff00]">
                    {formatPrice(
                      Number(item.price) *
                        Number(item.quantity)
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 py-5 text-sm">
              <div className="flex justify-between text-white/45">
                <span>
                  قيمة المنتجات
                </span>

                <span>
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-white/45">
                <span>الشحن</span>

                <span>
                  سيتم تحديده
                </span>
              </div>
            </div>

            <div className="mb-6 flex items-end justify-between border-t border-white/10 pt-5">
              <span className="text-sm text-white/40">
                الإجمالي
              </span>

              <div className="text-left">
                <div className="text-3xl font-black text-[#b6ff00]">
                  {subtotal.toLocaleString(
                    market.locale
                  )}
                </div>

                <div className="text-xs text-white/30">
                  {market.currency}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b6ff00] px-5 py-4 font-black text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  جاري إرسال الطلب...
                </>
              ) : (
                <>
                  <MessageCircle size={19} />
                  إرسال الطلب عبر واتساب
                </>
              )}
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-white/25">
              بالضغط على الزر سيتم فتح واتساب
              وإرسال تفاصيل الطلب مباشرة إلى خدمة
              الطلبات.
            </p>
          </aside>
        </form>
      </section>

      <style jsx global>{`
        .checkout-input {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          padding: 1rem;
          color: white;
          outline: none;
          transition: 0.2s;
        }

        .checkout-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .checkout-input:focus {
          border-color: rgba(182, 255, 0, 0.6);
          background: rgba(255, 255, 255, 0.06);
        }

        select.checkout-input option {
          background: #0a0a0a;
          color: white;
        }
      `}</style>
    </main>
  );
}
