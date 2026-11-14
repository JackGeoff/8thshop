import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal, RevealText } from "@/components/shop/Reveal";
import { ProductCard } from "@/components/shop/ProductCard";
import { WHATSAPP_URL } from "@/components/shop/WhatsAppFab";
import { formatKsh, giftSets } from "@/lib/products";
import giftBox from "@/assets/gift-box.jpg";

export const Route = createFileRoute("/gifts")({
  head: () => ({
    meta: [
      { title: "The 8th Gift Box — curated gift sets" },
      {
        name: "description",
        content: "Beautifully curated pieces, boxed and ready to give. Gift sets from KSh 1,200, delivered in Kenya.",
      },
      { property: "og:title", content: "The 8th Gift Box — curated gift sets" },
      { property: "og:description", content: "Beautifully curated pieces. Ready to give. From KSh 1,200." },
    ],
  }),
  component: GiftsPage,
});

function GiftsPage() {
  const sets = giftSets();
  const from = Math.min(...sets.map((s) => s.price));

  return (
    <main className="pb-32">
      <section className="grid min-h-[92vh] items-center gap-10 px-5 pt-28 md:grid-cols-2 md:px-10 md:pt-32">
        <div>
          <p className="eyebrow">The 8th Gift Box</p>
          <h1 className="display mt-5 text-[15vw] leading-[0.85] md:text-[6.5vw]">
            <RevealText text="Beautifully curated." />
            <br />
            <RevealText text="Ready to give." delay={0.15} />
          </h1>
          <p className="mt-7 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
            A gift set from The 8th isn't a bundle of leftovers. It's a single, finished object: pieces chosen to work
            together, a handwritten note, ribbon tied by hand.
          </p>
          <p className="mt-8 text-sm">Starting from {formatKsh(from)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#sets" className="bg-ink px-8 py-4 text-xs uppercase tracking-[0.2em] text-ink-foreground">
              Explore gifts
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="border border-border px-8 py-4 text-xs uppercase tracking-[0.2em]"
            >
              Help me choose
            </a>
          </div>
        </div>
        <Reveal>
          <img
            src={giftBox}
            alt="The 8th Gift Box"
            width={1408}
            height={1408}
            className="aspect-square w-full object-cover"
          />
        </Reveal>
      </section>

      <section id="sets" className="mx-auto mt-24 max-w-[1600px] px-5 md:px-10">
        <div className="border-t border-border pt-8">
          <h2 className="display text-4xl md:text-6xl">The boxes</h2>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.07}>
              <ProductCard product={p} priority={i === 0} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-32 max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-10 border-t border-border pt-12 md:grid-cols-3">
          {[
            { t: "Curated, not assembled", d: "Every box is designed as one piece, then filled to match." },
            { t: "Finished by hand", d: "Ribbon, note card and tissue folded before it leaves us." },
            { t: "Delivered ready", d: "It arrives giftable. No re-wrapping, no price tags." },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 0.08}>
              <p className="eyebrow">0{i + 1}</p>
              <h3 className="display mt-3 text-2xl">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </Reveal>
          ))}
        </div>
        <Link
          to="/shop"
          className="mt-16 inline-block border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em]"
        >
          Or shop individual pieces
        </Link>
      </section>
    </main>
  );
}
