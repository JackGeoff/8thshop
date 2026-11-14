import necklace from "@/assets/p-necklace-1.jpg";
import bracelet from "@/assets/p-bracelet-1.jpg";
import earrings from "@/assets/p-earrings-1.jpg";
import glasses from "@/assets/p-glasses-1.jpg";
import couples from "@/assets/p-couples-1.jpg";
import giftBox from "@/assets/gift-box.jpg";
import heroNecklace from "@/assets/hero-necklace.jpg";

/**
 * Catalogue types. Data now lives in the database and is loaded once by the
 * root route loader into the module store below, so every existing helper
 * (`getProduct`, `featured`, …) keeps working from any component.
 */
export type Category = string;

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string[];
  category: Category;
  price: number;
  compareAt?: number;
  stock: number;
  sku: string;
  images: string[];
  status: "active" | "draft";
  featured: boolean;
  bestSeller?: boolean;
  isGiftSet?: boolean;
  includes?: string[];
};

export type Collection = {
  id: string;
  slug: string;
  chapter: string;
  title: string;
  line: string;
  body: string;
  image: string;
  productSlugs: string[];
};

export const categories: { slug: Category; name: string; blurb: string }[] = [
  { slug: "necklaces", name: "Necklaces", blurb: "Worn close, remembered longer." },
  { slug: "bracelets", name: "Bracelets", blurb: "The quiet everyday signature." },
  { slug: "earrings", name: "Earrings", blurb: "Small pieces, full sentences." },
  { slug: "glasses", name: "Glasses", blurb: "Frames for the way you look at things." },
  { slug: "gift-sets", name: "Gift Sets", blurb: "Curated, boxed, ready to give." },
];

/** Built-in imagery, referenced from the database by file name. */
export const assetImages: Record<string, string> = {
  "p-necklace-1.jpg": necklace,
  "p-bracelet-1.jpg": bracelet,
  "p-earrings-1.jpg": earrings,
  "p-glasses-1.jpg": glasses,
  "p-couples-1.jpg": couples,
  "gift-box.jpg": giftBox,
  "hero-necklace.jpg": heroNecklace,
};

export const resolveImage = (value: string) => assetImages[value] ?? value;

export const heroImage = heroNecklace;
export const storyProductImage = couples;

/* ------------------------------------------------------------------ */
/* Catalogue store — filled by the root loader before anything renders */
/* ------------------------------------------------------------------ */

type Catalogue = { products: Product[]; collections: Collection[] };

let store: Catalogue = { products: [], collections: [] };

export function setCatalogue(next: Catalogue) {
  store = next;
}

export const getProducts = () => store.products;
export const getCollections = () => store.collections;
export const getProduct = (slug: string) => store.products.find((p) => p.slug === slug);
export const byCategory = (c: Category) =>
  store.products.filter((p) => p.category === c && p.status === "active");
export const featured = () => store.products.filter((p) => p.featured);
export const bestSellers = () => store.products.filter((p) => p.bestSeller);
export const giftSets = () => store.products.filter((p) => p.isGiftSet);

export const formatKsh = (value: number) =>
  `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
