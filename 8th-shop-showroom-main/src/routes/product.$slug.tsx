import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Reveal, RevealText } from "@/components/shop/Reveal";
import { ProductCard } from "@/components/shop/ProductCard";
import { WHATSAPP_URL } from "@/components/shop/WhatsAppFab";
import { formatKsh, getProduct, getProducts } from "@/lib/products";
import { useShop } from "@/lib/shop-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { name: product.name, description: product.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Piece unavailable — The 8th Shop" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.name} — The 8th Shop` },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: `${loaderData.name} — The 8th Shop` },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

const tabs = ["Details", "Shipping", "Returns"] as const;

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { addToCart, setCartOpen, toggleWishlist, inWishlist } = useShop();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Details");
  const product = getProduct(slug);
  if (!product) return null;
  const saved = inWishlist(product.slug);

  const related = getProducts().filter((p) => p.slug !== product.slug && p.status === "active").slice(0, 4);

  const tabCopy: Record<(typeof tabs)[number], string[]> = {
    Details: product.details,
    Shipping: [
      "Same-day delivery within Nairobi on orders before 2pm.",
      "Countrywide delivery in 1–3 working days.",
      "Delivery fee calculated at checkout. M-Pesa STK Push supported.",
    ],
    Returns: [
      "14-day exchange on unworn pieces in original packaging.",
      "Gift sets can be exchanged by the recipient.",
      "Message us on WhatsApp and we'll arrange the pickup.",
    ],
  };

  return (
    <main className="pb-32 pt-24 md:pt-32">
      <div className="mx-auto max-w-[1600px] px-0 md:px-10">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          {/* Gallery */}
          <div className="flex flex-col gap-3 md:gap-4">
            {product.images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`${product.name} view ${i + 1}`}
                width={1000}
                height={1250}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="aspect-[4/5] w-full bg-secondary object-cover"
              />
            ))}
          </div>

          {/* Info */}
          <div className="px-5 md:sticky md:top-28 md:h-fit md:px-0 md:pt-6">
            <p className="eyebrow">{product.category.replace("-", " ")}</p>
            <h1 className="display mt-4 text-5xl md:text-7xl">
              <RevealText text={product.name} />
            </h1>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-lg tabular-nums">{formatKsh(product.price)}</span>
              {product.compareAt && (
                <span className="text-sm tabular-nums text-muted-foreground line-through">
                  {formatKsh(product.compareAt)}
                </span>
              )}
            </div>

            <p className="mt-6 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            {product.includes && (
              <ul className="mt-6 space-y-1 border-l border-border pl-4 text-sm text-muted-foreground">
                {product.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}

            <p className="mt-6 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {product.stock > 0 ? `In stock — ${product.stock} available` : "Sold out"}
            </p>

            <div className="mt-8 grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <div className="flex items-center border border-border">
                <button aria-label="Decrease quantity" className="p-3.5" onClick={() => setQty(Math.max(1, qty - 1))}>
                  <Minus className="size-3.5" strokeWidth={1.4} />
                </button>
                <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                <button
                  aria-label="Increase quantity"
                  className="p-3.5"
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                >
                  <Plus className="size-3.5" strokeWidth={1.4} />
                </button>
              </div>
              <Button
                onClick={() => {
                  addToCart(product.slug, qty);
                  setCartOpen(true);
                }}
                disabled={product.stock === 0}
                className="h-full min-h-12 rounded-none bg-ink px-4 text-xs uppercase tracking-[0.14em] text-ink-foreground hover:bg-ink/90 disabled:opacity-40"
              >
                Add to Cart
              </Button>
              <button
                aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                onClick={() => {
                  toggleWishlist(product.slug);
                  toast(saved ? "Removed from wishlist" : "Saved to wishlist");
                }}
                className="border border-border p-4 transition-transform active:scale-90"
              >
                <Heart className={`size-4 ${saved ? "fill-clay text-clay" : ""}`} strokeWidth={1.4} />
              </button>
            </div>

            <Button
              onClick={() => {
                addToCart(product.slug, qty);
                void navigate({ to: "/checkout" });
              }}
              disabled={product.stock === 0}
              variant="outline"
              className="mt-3 h-12 w-full rounded-none uppercase tracking-[0.16em]"
            >
              Buy Now
            </Button>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-xs uppercase tracking-[0.16em] text-muted-foreground underline underline-offset-4"
            >
              Ask about this piece on WhatsApp
            </a>

            <div className="mt-12 border-t border-border">
              <div className="flex gap-6 py-4">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`text-xs uppercase tracking-[0.18em] ${
                      tab === t ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <ul className="space-y-2 pb-6 text-sm text-muted-foreground">
                {tabCopy[tab].map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <CustomerReviews />

        <section className="mt-32 px-5 md:px-0">
          <div className="flex items-end justify-between border-t border-border pt-8">
            <h2 className="display text-3xl md:text-5xl">You may also like</h2>
            <Link to="/shop" className="link-underline text-xs uppercase tracking-[0.18em]">
              All pieces
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-4 md:gap-x-8">
            {related.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.06}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const customerReviews = [
  { quote: "It arrived boxed and ready. I didn't have to do a single thing.", name: "Wanjiru, Kilimani" },
  { quote: "She still wears it every day. That's the whole review.", name: "Brian, Westlands" },
  { quote: "Ordered at 11, delivered by 4. Unreal.", name: "Achieng', Kileleshwa" },
];

function CustomerReviews() {
  return (
    <section className="mt-28 border-y border-border px-5 py-20 md:mt-36 md:px-0 md:py-24">
      <p className="eyebrow">Customer reviews</p>
      <h2 className="display mt-3 text-4xl md:text-6xl">Worn, gifted, remembered.</h2>
      <div className="mt-12 grid gap-px bg-border md:grid-cols-3">
        {customerReviews.map((review) => (
          <article key={review.name} className="bg-background p-6 md:min-h-56 md:p-8">
            <p className="display text-2xl leading-snug">“{review.quote}”</p>
            <p className="eyebrow mt-7">{review.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
