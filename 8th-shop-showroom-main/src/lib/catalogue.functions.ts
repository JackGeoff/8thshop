import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getCatalogue = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();

  const [{ data: products }, { data: collections }, { data: links }] = await Promise.all([
    supabase.from("products").select("*").eq("status", "active").order("sort_order"),
    supabase.from("collections").select("*").order("sort_order"),
    supabase.from("collection_products").select("collection_id, product_id, sort_order").order("sort_order"),
  ]);

  const bySlug = new Map((products ?? []).map((p) => [p.id, p.slug]));

  const signedImages = await Promise.all((products ?? []).map(async (p) => Promise.all((p.images ?? []).map(async (image) => {
    if (!image.startsWith("product-images:")) return image;
    const path = image.slice("product-images:".length);
    const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 3600);
    return data?.signedUrl ?? "";
  }))));

  return {
    products: (products ?? []).map((p, index) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      details: p.details ?? [],
      category: p.category,
      price: p.price,
      compareAt: p.compare_at ?? undefined,
      stock: p.stock,
      sku: p.sku,
      images: signedImages[index] ?? [],
      status: p.status as "active" | "draft",
      featured: p.featured,
      bestSeller: p.best_seller,
      isGiftSet: p.is_gift_set,
      includes: p.includes ?? [],
    })),
    collections: (collections ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      chapter: c.chapter,
      title: c.title,
      line: c.line,
      body: c.body,
      image: c.image,
      productSlugs: (links ?? [])
        .filter((l) => l.collection_id === c.id)
        .map((l) => bySlug.get(l.product_id))
        .filter((s): s is string => Boolean(s)),
    })),
  };
});

const orderSchema = z.object({
  customerName: z.string().min(1).max(120),
  phone: z.string().min(6).max(30),
  email: z.string().email().max(160).optional().or(z.literal("")),
  town: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.string().max(40).default("mpesa"),
  items: z.array(z.object({ slug: z.string(), qty: z.number().int().min(1).max(50) })).min(1).max(50),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();

    // Price and name come from the database, never from the browser.
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, slug, name, price")
      .in("slug", data.items.map((i) => i.slug));
    if (productError) throw new Error("Could not load the items in your bag.");

    const lines = data.items
      .map((item) => {
        const product = (products ?? []).find((p) => p.slug === item.slug);
        return product ? { product, qty: item.qty } : null;
      })
      .filter((l): l is { product: NonNullable<typeof products>[number]; qty: number } => l !== null);

    if (lines.length === 0) throw new Error("Your bag is empty.");

    const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0) + 300;

    const orderId = crypto.randomUUID();
    const orderNumber = `T8-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${orderId.slice(0, 8).toUpperCase()}`;
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      order_number: orderNumber,
      customer_name: data.customerName,
      phone: data.phone,
      email: data.email || null,
      town: data.town || null,
      notes: data.notes || null,
      payment_method: data.paymentMethod,
      total,
    });
    if (error) throw new Error("We couldn't save your order. Please try again.");

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map((l) => ({
        order_id: orderId,
        product_id: l.product.id,
        name: l.product.name,
        price: l.product.price,
        quantity: l.qty,
      })),
    );
    if (itemsError) throw new Error("We couldn't save your order items. Please try again.");

    return { orderId, orderNumber, total };
  });
