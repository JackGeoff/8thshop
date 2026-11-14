import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { formatKsh, type Product } from "@/lib/products";
import { useShop } from "@/lib/shop-store";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addToCart, toggleWishlist, inWishlist, setCartOpen } = useShop();
  const saved = inWishlist(product.slug);
  const hover = product.images[1] ?? product.images[0];

  return (
    <article className="group relative">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block overflow-hidden bg-secondary"
        aria-label={product.name}
      >
        <div className="relative aspect-[4/5]">
          <img
            src={product.images[0]}
            alt={product.name}
            width={1000}
            height={1250}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-hover:opacity-0"
          />
          <img
            src={hover}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full scale-[1.04] object-cover opacity-0 transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100 group-hover:opacity-100"
          />
        </div>
      </Link>

      <button
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        onClick={() => {
          toggleWishlist(product.slug);
          toast(saved ? "Removed from wishlist" : "Saved to wishlist");
        }}
        className="absolute right-3 top-3 rounded-full bg-background/80 p-2.5 backdrop-blur transition-transform hover:scale-110 active:scale-90"
      >
        <Heart className={`size-4 ${saved ? "fill-clay text-clay" : "text-foreground"}`} strokeWidth={1.4} />
      </button>

      <button
        onClick={() => {
          addToCart(product.slug);
          setCartOpen(true);
        }}
        className="absolute inset-x-3 bottom-3 translate-y-2 bg-background/95 py-3 text-[0.65rem] uppercase tracking-[0.2em] opacity-0 backdrop-blur transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden"
      >
        Quick add
      </button>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link to="/product/$slug" params={{ slug: product.slug }} className="link-underline text-sm">
            {product.name}
          </Link>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {product.category.replace("-", " ")}
          </p>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{product.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm tabular-nums">{formatKsh(product.price)}</p>
          {product.compareAt && (
            <p className="text-xs tabular-nums text-muted-foreground line-through">{formatKsh(product.compareAt)}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          addToCart(product.slug);
          setCartOpen(true);
        }}
        className="mt-3 w-full border border-border py-3 text-[0.65rem] uppercase tracking-[0.2em] md:hidden"
      >
        Add to bag
      </button>
    </article>
  );
}
