import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Guest-first shopping state.
 *
 * Cart and wishlist live in localStorage under `guest_cart` / `guest_wishlist`
 * so a visitor can shop with no account. When an account is created or a
 * session is detected, `syncGuestData` merges the local data into the
 * account (quantities summed, wishlist de-duplicated) and clears local keys —
 * the account becomes the source of truth from that point on.
 */

export const CART_KEY = "guest_cart";
export const WISHLIST_KEY = "guest_wishlist";

export type CartLine = { slug: string; qty: number };

type ShopState = {
  cart: CartLine[];
  wishlist: string[];
  cartOpen: boolean;
  hydrated: boolean;
  cartCount: number;
  setCartOpen: (open: boolean) => void;
  addToCart: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  inWishlist: (slug: string) => boolean;
};

const ShopContext = createContext<ShopState | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — shopping continues in memory */
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate after mount so SSR markup and client markup match.
  useEffect(() => {
    setCart(read<CartLine[]>(CART_KEY, []));
    setWishlist(read<string[]>(WISHLIST_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) write(CART_KEY, cart);
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) write(WISHLIST_KEY, wishlist);
  }, [wishlist, hydrated]);

  const addToCart = useCallback((slug: string, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.slug === slug);
      if (existing) return prev.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { slug, qty }];
    });
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.slug !== slug) : prev.map((l) => (l.slug === slug ? { ...l, qty } : l)),
    );
  }, []);

  const removeFromCart = useCallback((slug: string) => {
    setCart((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  const value = useMemo<ShopState>(
    () => ({
      cart,
      wishlist,
      cartOpen,
      hydrated,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      setCartOpen,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      inWishlist: (slug: string) => wishlist.includes(slug),
    }),
    [cart, wishlist, cartOpen, hydrated, addToCart, setQty, removeFromCart, clearCart, toggleWishlist],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}

/** Merge helpers — pure, so the same rules apply on the client and on a server sync. */
export function mergeCarts(guest: CartLine[], account: CartLine[]): CartLine[] {
  const map = new Map<string, number>();
  for (const line of [...account, ...guest]) {
    map.set(line.slug, (map.get(line.slug) ?? 0) + line.qty);
  }
  return [...map].map(([slug, qty]) => ({ slug, qty }));
}

export function mergeWishlists(guest: string[], account: string[]): string[] {
  return [...new Set([...account, ...guest])];
}

/**
 * Called once a customer signs in or creates an account.
 * `pushToAccount` should persist the merged data to the backend; local keys are
 * only cleared after it resolves, so nothing saved as a guest is ever lost.
 */
export async function syncGuestData(
  accountCart: CartLine[],
  accountWishlist: string[],
  pushToAccount: (cart: CartLine[], wishlist: string[]) => Promise<void>,
) {
  const guestCart = read<CartLine[]>(CART_KEY, []);
  const guestWishlist = read<string[]>(WISHLIST_KEY, []);
  const cart = mergeCarts(guestCart, accountCart);
  const wishlist = mergeWishlists(guestWishlist, accountWishlist);

  await pushToAccount(cart, wishlist);

  window.localStorage.removeItem(CART_KEY);
  window.localStorage.removeItem(WISHLIST_KEY);
  return { cart, wishlist };
}
