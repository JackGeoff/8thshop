import bracelet from "@/assets/p-bracelet-1.jpg";
import couples from "@/assets/p-couples-1.jpg";
import earrings from "@/assets/p-earrings-1.jpg";
import giftBox from "@/assets/gift-box.jpg";
import glasses from "@/assets/p-glasses-1.jpg";
import necklace from "@/assets/p-necklace-1.jpg";

export type StorefrontCategory = {
  title: string;
  subtitle: string;
  image: string;
  filter: string;
};

export const storefrontCategories: StorefrontCategory[] = [
  { title: "For Her", subtitle: "Jewellery & gift sets", image: earrings, filter: "for-her" },
  { title: "For Him", subtitle: "Frames, watches & accessories", image: glasses, filter: "for-him" },
  { title: "For Us", subtitle: "Matching pieces", image: couples, filter: "for-us" },
  { title: "Watches", subtitle: "Men's & women's styles", image: glasses, filter: "watches" },
  { title: "Necklaces", subtitle: "Chains & pendants", image: necklace, filter: "necklaces" },
  { title: "Bracelets", subtitle: "Cuffs, chains & pairs", image: bracelet, filter: "bracelets" },
  { title: "Sets", subtitle: "Curated and ready to give", image: giftBox, filter: "gift-sets" },
];