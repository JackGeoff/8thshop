import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal, RevealText } from "@/components/shop/Reveal";
import story from "@/assets/story.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our story — The 8th Shop" },
      {
        name: "description",
        content: "The 8th Shop is a Nairobi jewellery and gifting studio. Small pieces, made to be remembered.",
      },
      { property: "og:title", content: "Our story — The 8th Shop" },
      { property: "og:description", content: "A Nairobi jewellery and gifting studio." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="pb-32 pt-32 md:pt-44">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <h1 className="display max-w-[16ch] text-[12vw] leading-[0.88] md:text-[6vw]">
          <RevealText text="We make small things people keep." />
        </h1>

        <Reveal className="mt-16">
          <img
            src={story}
            alt="The 8th Shop studio in Nairobi"
            width={1600}
            height={1100}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover"
          />
        </Reveal>

        <div className="mt-20 grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <p className="eyebrow">Nairobi, Kenya</p>
          <div className="space-y-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            <p>
              The 8th Shop started with one question: why is buying a good gift so hard? Everything was either
              forgettable or unaffordable, and almost nothing arrived ready to give.
            </p>
            <p>
              So we built a small studio around the opposite idea — a tight edit of jewellery, accessories and glasses,
              each one finished, boxed and photographed properly. Nothing filler. Nothing you'd be embarrassed to hand
              over.
            </p>
            <p>
              We're eight pieces at a time, curated slowly, delivered fast across Kenya, and always reachable on
              WhatsApp when you're not sure what to choose.
            </p>
          </div>
        </div>

        <div className="mt-24 grid gap-10 border-t border-border pt-12 md:grid-cols-3">
          {[
            { k: "Same day", v: "Nairobi delivery" },
            { k: "M-Pesa", v: "Pay the way you already pay" },
            { k: "14 days", v: "Exchange on unworn pieces" },
          ].map((s) => (
            <div key={s.k}>
              <p className="display text-4xl">{s.k}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>

        <Link
          to="/shop"
          className="mt-20 inline-block bg-ink px-8 py-4 text-xs uppercase tracking-[0.2em] text-ink-foreground"
        >
          Enter the shop
        </Link>
      </div>
    </main>
  );
}
