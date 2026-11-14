import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal, RevealText } from "@/components/shop/Reveal";
import { categories, getProducts, type Category } from "@/lib/products";

export const Route = createFileRoute("/shop")({
  validateSearch: z.object({ category: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Shop all pieces — The 8th Shop" },
      {
        name: "description",
        content: "Necklaces, bracelets, earrings, glasses and gift sets. Every piece boxed and ready to give.",
      },
      { property: "og:title", content: "Shop all pieces — The 8th Shop" },
      { property: "og:description", content: "Necklaces, bracelets, earrings, glasses and curated gift sets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { category } = Route.useSearch();
  const [filter, setFilter] = useState<Category | "all">(category ?? "all");
  const list = getProducts().filter((p) => {
    if (p.status !== "active" || filter === "all") return p.status === "active";
    if (filter === "for-her") return ["necklaces", "bracelets", "earrings", "gift-sets"].includes(p.category);
    if (filter === "for-him") return ["glasses", "watches", "bracelets"].includes(p.category);
    if (filter === "for-us") return p.slug.includes("duo") || p.description.toLowerCase().includes("two");
    if (filter === "watches") return p.category === "watches";
    return p.category === filter;
  });

  return (
    <main className="px-5 pb-32 pt-32 md:px-10 md:pt-44">
      <div className="mx-auto max-w-[1600px]">
        <h1 className="display text-[16vw] leading-[0.85] md:text-[9vw]">
          <RevealText text="The shop" />
        </h1>

        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-y border-border py-5">
          {[{ slug: "all", name: "Everything" }, ...categories].map((c) => (
            <button
              key={c.slug}
              onClick={() => setFilter(c.slug as Category | "all")}
              className={`text-xs uppercase tracking-[0.18em] transition-colors ${
                filter === c.slug ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {filter !== "all" && !categories.some((categoryItem) => categoryItem.slug === filter) && (
          <div className="mt-5 flex items-center justify-between border-b border-border pb-5">
            <p className="text-sm text-muted-foreground">Showing {filter.replace("-", " ")}</p>
            <button onClick={() => setFilter("all")} className="text-xs uppercase tracking-[0.16em]">Clear filter</button>
          </div>
        )}

        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-16 md:grid-cols-3 md:gap-x-8 xl:grid-cols-4">
          {list.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 4) * 0.06}>
              <ProductCard product={p} priority={i < 4} />
            </Reveal>
          ))}
        </div>
        {list.length === 0 && (
          <div className="py-24 text-center">
            <p className="display text-4xl">More pieces are coming soon.</p>
            <button onClick={() => setFilter("all")} className="mt-6 border-b border-foreground pb-1 text-xs uppercase tracking-[0.16em]">Shop everything</button>
          </div>
        )}
      </div>
    </main>
  );
}
