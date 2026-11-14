import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useShop } from "@/lib/shop-store";
import { formatKsh, getProducts } from "@/lib/products";

const links = [
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/help", label: "Help Center" },
] as const;

export function Nav() {
  const { cartCount, setCartOpen, wishlist } = useShop();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return getProducts().filter((p) => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/85 backdrop-blur-xl"
            : "bg-gradient-to-b from-background/85 via-background/45 to-transparent"
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1600px] items-center justify-between px-5 transition-all duration-500 md:px-10 ${
            scrolled ? "py-3" : "py-6"
          }`}
        >
          <Link to="/" className="display leading-none tracking-tight">
            <span className={`block transition-all duration-500 ${scrolled ? "text-lg" : "text-xl md:text-2xl"}`}>
              The 8th Shop
            </span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="link-underline text-[0.8rem] uppercase tracking-[0.16em] text-foreground/80 transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2.5 transition-colors hover:bg-secondary"
            >
              <Search className="size-[18px]" strokeWidth={1.4} />
            </button>
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="relative rounded-full p-2.5 transition-colors hover:bg-secondary"
            >
              <Heart className="size-[18px]" strokeWidth={1.4} />
              {wishlist.length > 0 && (
                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-clay" aria-hidden />
              )}
            </Link>
            <button
              aria-label="Open bag"
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 rounded-full px-3 py-2.5 transition-colors hover:bg-secondary"
            >
              <ShoppingBag className="size-[18px]" strokeWidth={1.4} />
              <span className="text-xs tabular-nums">{cartCount}</span>
            </button>
            <button
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
              className="rounded-full p-2.5 transition-colors hover:bg-secondary md:hidden"
            >
              <Menu className="size-[18px]" strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-background px-6 py-6 md:hidden"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between">
              <span className="display text-xl">The 8th Shop</span>
              <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="p-2">
                <X className="size-5" strokeWidth={1.4} />
              </button>
            </div>
            <nav className="mt-16 flex flex-col gap-2">
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i + 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link to={l.to} className="display block py-3 text-5xl">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="absolute inset-x-6 bottom-10 flex items-center justify-between border-t border-border pt-6">
              <Link to="/wishlist" className="eyebrow">
                Wishlist ({wishlist.length})
              </Link>
              <a href="https://wa.me/254700000000" className="eyebrow" target="_blank" rel="noreferrer">
                WhatsApp us
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mx-auto max-w-3xl px-6 pt-24">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <Search className="size-5 text-muted-foreground" strokeWidth={1.4} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pieces, gifts, collections"
                  className="display w-full bg-transparent text-3xl outline-none placeholder:text-muted-foreground/60 md:text-4xl"
                />
                <button aria-label="Close search" onClick={() => setSearchOpen(false)} className="p-2">
                  <X className="size-5" strokeWidth={1.4} />
                </button>
              </div>
              <div className="mt-8 space-y-1">
                {results.map((p) => (
                  <Link
                    key={p.slug}
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="flex items-center gap-4 rounded-sm p-3 transition-colors hover:bg-secondary"
                  >
                    <img src={p.images[0]} alt="" loading="lazy" className="size-14 object-cover" />
                    <span className="flex-1 text-sm">{p.name}</span>
                    <span className="text-sm text-muted-foreground">{formatKsh(p.price)}</span>
                  </Link>
                ))}
                {query && results.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">Nothing matched. Try “gift”, “gold” or “hoops”.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
