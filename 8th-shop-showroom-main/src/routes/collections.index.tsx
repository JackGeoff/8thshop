import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { getCollections } from "@/lib/products";
import { RevealText } from "@/components/shop/Reveal";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "Collections — The 8th Shop" },
      {
        name: "description",
        content: "Three chapters: the everyday, the gift, and the couples collection. Each with its own character.",
      },
      { property: "og:title", content: "Collections — The 8th Shop" },
      { property: "og:description", content: "The everyday, the gift and the couples collection." },
    ],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  return (
    <main className="pb-32 pt-32 md:pt-44">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <h1 className="display text-[16vw] leading-[0.85] md:text-[9vw]">
          <RevealText text="Collections" />
        </h1>
        <p className="mt-6 max-w-[42ch] text-sm text-muted-foreground">
          Not categories — chapters. Each one has a mood, a reason and a person it's for.
        </p>
      </div>

      <div className="mt-20">
        {getCollections().map((c, i) => (
          <Link
            key={c.slug}
            to="/collections/$slug"
            params={{ slug: c.slug }}
            className="group block border-t border-border"
          >
            <div className="mx-auto grid max-w-[1600px] items-center gap-8 px-5 py-10 md:grid-cols-[1fr_auto_1fr] md:px-10 md:py-16">
              <div>
                <p className="eyebrow">{c.chapter}</p>
                <h2 className="display mt-3 text-4xl md:text-6xl">{c.title}</h2>
                <p className="mt-4 max-w-[38ch] text-sm text-muted-foreground">{c.body}</p>
              </div>
              <motion.div
                className="overflow-hidden md:w-[340px]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
              </motion.div>
              <span className="justify-self-end text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-foreground">
                Enter →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
