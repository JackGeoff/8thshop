import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal, RevealText } from "@/components/shop/Reveal";
import { formatKsh, getProduct, getProducts, giftSets, heroImage, type Product } from "@/lib/products";
import { storefrontCategories } from "@/lib/storefront";
import { useShop } from "@/lib/shop-store";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "The 8th Shop — Jewellery, accessories and gifts" },
    { name: "description", content: "A seamless digital showroom of jewellery, matching accessories and curated gift packages, delivered across Kenya." },
    { property: "og:title", content: "The 8th Shop — Jewellery, accessories and gifts" },
    { property: "og:description", content: "Discover thoughtful pieces for her, for him, and for both of you." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

function Home() {
  return <><Entrance /><main><Hero /><PackageShowcase /><CategoryStrip /><ProductGrid /></main></>;
}

function Entrance() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  useEffect(() => { if (window.sessionStorage.getItem("t8_entered") === "1") setOpen(false); }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  const enter = () => { window.sessionStorage.setItem("t8_entered", "1"); setOpen(false); };
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-ink px-6 text-ink-foreground" initial={{ opacity: reduce ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ y: "-100%" }} transition={{ duration: reduce ? 0 : 0.9, ease: [0.76, 0, 0.24, 1] }}>
    <motion.p className="eyebrow text-ink-foreground/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>The 8th Shop</motion.p>
    <motion.h1 className="intro-display mt-6 max-w-[15ch] text-center text-6xl leading-[0.92] sm:text-7xl md:text-8xl" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>Something special is waiting for you.</motion.h1>
    <Button onClick={enter} variant="outline" className="mt-12 h-12 rounded-none border-ink-foreground/30 bg-transparent px-10 text-ink-foreground uppercase tracking-[0.2em] hover:bg-ink-foreground hover:text-ink">Enter the shop</Button>
  </motion.div>}</AnimatePresence>;
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "14%"]);
  return <section ref={ref} className="relative flex h-[92svh] items-end overflow-hidden">
    <motion.img src={heroImage} alt="A fine gold necklace resting on warm stone" fetchPriority="high" style={{ y }} className="absolute inset-0 size-full scale-[1.08] object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/25" />
    <div className="relative mx-auto w-full max-w-[1600px] px-5 pb-12 text-ink-foreground md:px-10 md:pb-16">
      <p className="eyebrow text-ink-foreground/70">Nairobi · Jewellery & gifting</p>
      <h2 className="display mt-4 max-w-[11ch] text-6xl leading-[0.86] sm:text-7xl md:text-8xl"><RevealText text="Wear the moment." /></h2>
      <Button asChild className="mt-8 h-12 rounded-none bg-ink-foreground px-8 text-ink uppercase tracking-[0.18em] hover:bg-ink-foreground/90"><Link to="/shop">Shop all pieces</Link></Button>
    </div>
  </section>;
}

function PackageShowcase() {
  const all = getProducts();
  const packages = [
    { kicker: "For Us", product: getProduct("duo-bracelets") ?? all.find((p) => p.category === "bracelets"), imageIndex: 0 },
    { kicker: "Thoughtful Package For Him", product: getProduct("solene-frames") ?? all.find((p) => p.category === "glasses"), imageIndex: 0 },
    { kicker: "For Her", product: getProduct("the-8th-gift-box") ?? giftSets()[0] ?? all[0], imageIndex: 0 },
  ].filter((item): item is { kicker: string; product: Product; imageIndex: number } => Boolean(item.product));
  return <section aria-label="Gift packages" className="bg-ink">{packages.map((item, index) => <PackagePanel key={item.kicker} {...item} index={index} />)}</section>;
}

function PackagePanel({ kicker, product, imageIndex, index }: { kicker: string; product: Product; imageIndex: number; index: number }) {
  const { addToCart, setCartOpen } = useShop();
  const navigate = useNavigate();
  const image = product.images[imageIndex] ?? product.images[0];
  const buyNow = () => { addToCart(product.slug); void navigate({ to: "/checkout" }); };
  return <article className="group relative min-h-[92svh] overflow-hidden text-ink-foreground">
    <Link to="/product/$slug" params={{ slug: product.slug }} aria-label={`View ${product.name}`} className="absolute inset-0">
      {image && <img src={image} alt={product.name} loading={index === 0 ? "eager" : "lazy"} className="size-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.025]" />}
    </Link>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-ink/20" />
    <div className="pointer-events-none relative flex min-h-[92svh] items-end">
      <div className="mx-auto w-full max-w-[1600px] px-5 pb-10 md:px-10 md:pb-14">
        <p className="eyebrow text-ink-foreground/70">{kicker}</p>
        <h2 className="display mt-3 max-w-[13ch] text-5xl md:text-7xl">{product.name}</h2>
        <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-ink-foreground/75">{product.description}</p>
        <p className="mt-4 text-lg tabular-nums">{formatKsh(product.price)}</p>
        <div className="pointer-events-auto mt-7 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="h-12 rounded-none border-ink-foreground/45 bg-ink/20 px-7 text-ink-foreground uppercase tracking-[0.15em] backdrop-blur hover:bg-ink-foreground hover:text-ink" onClick={() => { addToCart(product.slug); setCartOpen(true); }}><ShoppingBag /> Add to Cart</Button>
          <Button className="h-12 rounded-none bg-ink-foreground px-8 text-ink uppercase tracking-[0.15em] hover:bg-ink-foreground/90" onClick={buyNow}>Buy Now</Button>
        </div>
      </div>
    </div>
  </article>;
}

function CategoryStrip() {
  return <section className="border-b border-border py-20 md:py-28">
    <div className="mx-auto max-w-[1600px] px-5 md:px-10">
      <div className="flex items-end justify-between"><h2 className="display text-5xl md:text-7xl">Categories</h2><Link to="/categories" className="link-underline text-xs uppercase tracking-[0.16em]">View all</Link></div>
      <div className="mt-10 flex snap-x gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-7 md:overflow-visible">
        {storefrontCategories.map((category) => <Link key={category.title} to="/shop" search={{ category: category.filter }} className="group w-32 shrink-0 snap-start md:w-auto">
          <div className="overflow-hidden bg-secondary"><img src={category.image} alt="" className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
          <h3 className="mt-3 text-sm font-medium">{category.title}</h3><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{category.subtitle}</p>
        </Link>)}
      </div>
    </div>
  </section>;
}

function ProductGrid() {
  const products = useMemo(() => getProducts().filter((p) => p.status === "active"), []);
  return <section className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
    <div className="flex items-end justify-between"><div><p className="eyebrow">The full edit</p><h2 className="display mt-3 text-5xl md:text-7xl">Shop all</h2></div><Link to="/shop" className="link-underline text-xs uppercase tracking-[0.16em]">Browse shop</Link></div>
    <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 md:gap-x-8 xl:grid-cols-4">{products.map((product, index) => <Reveal key={product.slug} delay={(index % 4) * 0.05}><ProductCard product={product} priority={index < 4} /></Reveal>)}</div>
  </section>;
}
