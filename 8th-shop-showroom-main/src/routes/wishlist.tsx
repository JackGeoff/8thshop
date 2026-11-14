import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/shop/ProductCard";
import { getProduct } from "@/lib/products";
import { useShop } from "@/lib/shop-store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — The 8th Shop" },
      { name: "description", content: "Pieces you've saved. No account needed — your wishlist stays in this browser." },
      { property: "og:title", content: "Wishlist — The 8th Shop" },
      { property: "og:description", content: "Save pieces without signing in." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, hydrated } = useShop();
  const items = wishlist.map((s) => getProduct(s)).filter(Boolean);

  return (
    <main className="px-5 pb-32 pt-32 md:px-10 md:pt-44">
      <div className="mx-auto max-w-[1600px]">
        <h1 className="display text-[16vw] leading-[0.85] md:text-[9vw]">Saved</h1>
        <p className="mt-6 max-w-[46ch] text-sm text-muted-foreground">
          Saved in this browser — no account required. Create one later and everything here comes with you.
        </p>

        {!hydrated && <div className="mt-16 h-64 animate-pulse bg-secondary" />}

        {hydrated && items.length === 0 && (
          <div className="mt-20 border-t border-border pt-14">
            <p className="display text-4xl">Nothing saved yet.</p>
            <Link
              to="/shop"
              className="mt-6 inline-block bg-ink px-7 py-3 text-xs uppercase tracking-[0.2em] text-ink-foreground"
            >
              Browse the shop
            </Link>
          </div>
        )}

        {hydrated && items.length > 0 && (
          <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-16 md:grid-cols-3 md:gap-x-8 xl:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p!.slug} product={p!} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
