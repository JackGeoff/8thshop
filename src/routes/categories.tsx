import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal, RevealText } from "@/components/shop/Reveal";
import { storefrontCategories } from "@/lib/storefront";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — The 8th Shop" },
      { name: "description", content: "Browse gifts, jewellery, watches, accessories, matching pieces and curated sets." },
      { property: "og:title", content: "Categories — The 8th Shop" },
      { property: "og:description", content: "Find something for her, for him, for both of you, or shop by piece." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <main className="pb-28 pt-32 md:pt-44">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <p className="eyebrow">Find your piece</p>
        <h1 className="display mt-4 text-6xl md:text-8xl"><RevealText text="Categories" /></h1>
      </header>
      <section className="mx-auto mt-14 grid max-w-[1600px] grid-cols-2 gap-x-4 gap-y-10 px-5 md:grid-cols-4 md:gap-8 md:px-10">
        {storefrontCategories.map((category, index) => (
          <Reveal key={category.title} delay={(index % 4) * 0.05}>
            <Link to="/shop" search={{ category: category.filter }} className="group block">
              <div className="overflow-hidden bg-secondary">
                <img src={category.image} alt="" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              </div>
              <h2 className="display mt-4 text-2xl md:text-3xl">{category.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{category.subtitle}</p>
            </Link>
          </Reveal>
        ))}
      </section>
    </main>
  );
}
