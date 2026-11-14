import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal, RevealText } from "@/components/shop/Reveal";
import { getCollections, getProduct } from "@/lib/products";

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ params }) => {
    const collection = getCollections().find((c) => c.slug === params.slug);
    if (!collection) throw notFound();
    return { slug: collection.slug, title: collection.title, line: collection.line };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Collection unavailable — The 8th Shop" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.title} — The 8th Shop` },
        { name: "description", content: loaderData.line },
        { property: "og:title", content: `${loaderData.title} — The 8th Shop` },
        { property: "og:description", content: loaderData.line },
      ],
    };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const collection = getCollections().find((c) => c.slug === slug)!;
  const items = collection.productSlugs.map((s) => getProduct(s)!).filter(Boolean);

  return (
    <main className="pb-32">
      <section className="relative flex min-h-[70vh] items-end overflow-hidden">
        <img
          src={collection.image}
          alt={collection.title}
          className="absolute inset-0 size-full object-cover"
          width={1400}
          height={1400}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="relative mx-auto w-full max-w-[1600px] px-5 pb-14 text-ink-foreground md:px-10 md:pb-20">
          <p className="eyebrow text-ink-foreground/70">{collection.chapter}</p>
          <h1 className="display mt-4 text-[13vw] leading-[0.85] md:text-[7vw]">
            <RevealText text={collection.title} />
          </h1>
          <p className="mt-4 max-w-[40ch] text-sm text-ink-foreground/80">{collection.body}</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="mt-20 grid grid-cols-2 gap-x-5 gap-y-16 md:grid-cols-3 md:gap-x-8">
          {items.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}
