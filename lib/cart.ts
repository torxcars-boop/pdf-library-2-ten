export type MarketCode = "EG" | "SA" | "AE" | "JO";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  size?: string;
  marketCode: MarketCode;
};

const CART_KEY = "flex-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(CART_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item.productId === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number" &&
        ["EG", "SA", "AE", "JO"].includes(
          item.marketCode
        )
    );
  } catch (error) {
    console.error("Failed to read cart:", error);
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      CART_KEY,
      JSON.stringify(items)
    );

    window.dispatchEvent(new Event("cart-updated"));
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
}

export function addToCart(item: CartItem) {
  const cart = getCart();

  /*
   * A cart can contain products from ONE market only.
   */
  if (
    cart.length > 0 &&
    cart.some(
      (cartItem) =>
        cartItem.marketCode !== item.marketCode
    )
  ) {
    return {
      success: false,
      cart,
      reason: "MARKET_MISMATCH" as const,
    };
  }

  const existing = cart.find(
    (cartItem) =>
      cartItem.productId === item.productId &&
      cartItem.size === item.size &&
      cartItem.marketCode === item.marketCode
  );

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }

  saveCart(cart);

  return {
    success: true,
    cart,
    reason: null,
  };
}

export function removeFromCart(
  productId: string,
  size?: string
) {
  const cart = getCart().filter(
    (item) =>
      !(
        item.productId === productId &&
        item.size === size
      )
  );

  saveCart(cart);

  return cart;
}

export function updateCartQuantity(
  productId: string,
  quantity: number,
  size?: string
) {
  const cart = getCart();

  const item = cart.find(
    (cartItem) =>
      cartItem.productId === productId &&
      cartItem.size === size
  );

  if (!item) return cart;

  if (quantity <= 0) {
    return removeFromCart(productId, size);
  }

  item.quantity = quantity;

  saveCart(cart);

  return cart;
}

export function clearCart() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(CART_KEY);

  window.dispatchEvent(
    new Event("cart-updated")
  );
}

export function getCartTotal(
  items: CartItem[]
) {
  return items.reduce(
    (total, item) =>
      total +
      Number(item.price) *
        Number(item.quantity),
    0
  );
}

export function getCartCount(
  items: CartItem[]
) {
  return items.reduce(
    (total, item) =>
      total + Number(item.quantity),
    0
  );
}

export function getCartMarket(
  items: CartItem[]
): MarketCode | null {
  if (items.length === 0) return null;

  return items[0].marketCode;
}
