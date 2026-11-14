import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import { useShop } from "@/lib/shop-store";
import { formatKsh, getProduct } from "@/lib/products";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, removeFromCart } = useShop();

  const lines = cart
    .map((l) => ({ line: l, product: getProduct(l.slug) }))
    .filter((x): x is { line: typeof x.line; product: NonNullable<typeof x.product> } => Boolean(x.product));

  const subtotal = lines.reduce((sum, { line, product }) => sum + line.qty * product.price, 0);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[440px] flex-col bg-background"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Shopping bag"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <span className="eyebrow">Your bag ({lines.length})</span>
              <button aria-label="Close bag" onClick={() => setCartOpen(false)} className="p-1">
                <X className="size-5" strokeWidth={1.4} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {lines.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="display text-3xl">Your bag is empty.</p>
                  <p className="max-w-[24ch] text-sm text-muted-foreground">
                    Nothing chosen yet. Something in there is waiting for someone.
                  </p>
                  <Link
                    to="/shop"
                    onClick={() => setCartOpen(false)}
                    className="mt-2 bg-ink px-7 py-3 text-xs uppercase tracking-[0.18em] text-ink-foreground"
                  >
                    Start shopping
                  </Link>
                </div>
              )}

              {lines.map(({ line, product }) => (
                <motion.div
                  key={product.slug}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  className="flex gap-4 border-b border-border py-5"
                >
                  <Link to="/product/$slug" params={{ slug: product.slug }} onClick={() => setCartOpen(false)}>
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="h-28 w-24 bg-secondary object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm">{product.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {product.category.replace("-", " ")}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(product.slug)}
                        className="text-xs text-muted-foreground underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          aria-label="Decrease quantity"
                          className="p-2"
                          onClick={() => setQty(product.slug, line.qty - 1)}
                        >
                          <Minus className="size-3.5" strokeWidth={1.4} />
                        </button>
                        <span className="w-7 text-center text-xs tabular-nums">{line.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          className="p-2"
                          onClick={() => setQty(product.slug, line.qty + 1)}
                        >
                          <Plus className="size-3.5" strokeWidth={1.4} />
                        </button>
                      </div>
                      <span className="text-sm tabular-nums">{formatKsh(product.price * line.qty)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-border px-6 py-6">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Subtotal</span>
                  <span className="display text-2xl tabular-nums">{formatKsh(subtotal)}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Delivery calculated at checkout. M-Pesa accepted.</p>
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="mt-5 block bg-ink py-4 text-center text-xs uppercase tracking-[0.2em] text-ink-foreground transition-opacity hover:opacity-90"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
