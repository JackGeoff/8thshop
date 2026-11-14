import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const productInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(160),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  description: z.string().max(4000).default(""),
  details: z.array(z.string().max(300)).default([]),
  category: z.string().min(1).max(60),
  price: z.number().int().min(0),
  compareAt: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0),
  sku: z.string().max(60).default(""),
  images: z.array(z.string().max(500)).default([]),
  status: z.enum(["active", "draft"]),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  isGiftSet: z.boolean().default(false),
  includes: z.array(z.string().max(200)).default([]),
  sortOrder: z.number().int().default(0),
});

const collectionInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  chapter: z.string().max(60).default(""),
  title: z.string().min(1).max(160),
  line: z.string().max(300).default(""),
  body: z.string().max(2000).default(""),
  image: z.string().max(500).default(""),
  sortOrder: z.number().int().default(0),
  productIds: z.array(z.string().uuid()).default([]),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { isAdmin: false as const };

    const [products, collections, orders, roles] = await Promise.all([
      context.supabase.from("products").select("id, name, slug, stock, price, status, images"),
      context.supabase.from("collections").select("id", { count: "exact", head: true }),
      context.supabase.from("orders").select("*, order_items(id, name, price, quantity, product_id)").order("created_at", { ascending: false }),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);

    const productRows = (products.data ?? []) as any[];
    const orderRows = (orders.data ?? []) as any[];
    const paidish = orderRows.filter((o) => o.status === "paid" || o.status === "delivered");

    // revenue for the last 14 days
    const days: { day: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        day: key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        revenue: 0,
        orders: 0,
      });
    }
    for (const o of paidish) {
      const key = String(o.created_at).slice(0, 10);
      const bucket = days.find((d) => d.day === key);
      if (bucket) {
        bucket.revenue += o.total ?? 0;
        bucket.orders += 1;
      }
    }

    const unitsBySlug = new Map<string, { name: string; units: number; revenue: number }>();
    for (const o of paidish) {
      for (const item of o.order_items ?? []) {
        const key = item.product_id ?? item.name;
        const prev = unitsBySlug.get(key) ?? { name: item.name, units: 0, revenue: 0 };
        prev.units += item.quantity ?? 0;
        prev.revenue += (item.price ?? 0) * (item.quantity ?? 0);
        unitsBySlug.set(key, prev);
      }
    }

    const statusCounts = ["pending", "received", "shipped", "out_for_delivery", "delivered", "cancelled"].map((status) => ({
      status,
      count: orderRows.filter((o) => o.status === status).length,
    }));

    const revenue = paidish.reduce((n, o) => n + (o.total ?? 0), 0);

    return {
      isAdmin: true as const,
      productCount: productRows.length,
      activeProductCount: productRows.filter((p) => p.status === "active").length,
      collectionCount: collections.count ?? 0,
      orderCount: orderRows.length,
      pendingCount: orderRows.filter((o) => o.status === "pending").length,
      customerCount: new Set([
        ...orderRows.map((o) => (o.email || o.phone || "").toLowerCase()).filter(Boolean),
        ...(roles.data ?? []).filter((r: any) => r.role === "customer" && !(roles.data ?? []).some((a: any) => a.user_id === r.user_id && a.role === "admin")).map((r: any) => r.user_id),
      ]).size,
      revenue,
      averageOrder: paidish.length ? Math.round(revenue / paidish.length) : 0,
      inventoryUnits: productRows.reduce((n, p) => n + (p.stock ?? 0), 0),
      inventoryValue: productRows.reduce((n, p) => n + (p.stock ?? 0) * (p.price ?? 0), 0),
      days,
      statusCounts,
      lowStock: productRows
        .filter((p) => (p.stock ?? 0) <= 3)
        .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
        .slice(0, 6)
        .map((p) => ({ id: p.id, name: p.name, stock: p.stock ?? 0, image: p.images?.[0] ?? "" })),
      topProducts: [...unitsBySlug.values()].sort((a, b) => b.units - a.units).slice(0, 5),
      recentOrders: orderRows.slice(0, 6).map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        customer: o.customer_name,
        total: o.total,
        status: o.status,
        createdAt: o.created_at,
        items: (o.order_items ?? []).length,
      })),
    };
  });

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: authUsers }, { data: profiles }, { data: roles }, { data: orders }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      context.supabase.from("profiles").select("id, full_name, created_at"),
      context.supabase.from("user_roles").select("user_id, role"),
      context.supabase.from("orders").select("user_id, customer_name, phone, email, total, status, created_at").order("created_at", { ascending: false }),
    ]);

    const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const orderRows = (orders ?? []) as any[];

    const registered = (authUsers?.users ?? []).map((u: any) => {
      const mine = orderRows.filter((o) => o.user_id === u.id || (o.email && u.email && o.email.toLowerCase() === u.email.toLowerCase()));
      return {
        id: u.id,
        email: u.email ?? "",
        fullName: (profileById.get(u.id) as any)?.full_name || mine[0]?.customer_name || "",
        phone: mine[0]?.phone ?? "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        confirmed: Boolean(u.email_confirmed_at),
        roles: (roles ?? []).filter((r: any) => r.user_id === u.id).map((r: any) => r.role as string),
        orderCount: mine.length,
        spend: mine.filter((o) => o.status !== "cancelled").reduce((n, o) => n + (o.total ?? 0), 0),
        lastOrderAt: mine[0]?.created_at ?? null,
      };
    });
    const matched = new Set(orderRows.filter((o) => registered.some((u: any) => u.id === o.user_id || (u.email && o.email && u.email.toLowerCase() === o.email.toLowerCase()))));
    const guests = new Map<string, any>();
    for (const o of orderRows) {
      if (matched.has(o)) continue;
      const key = o.email?.trim().toLowerCase() || o.phone?.replace(/\D/g, "");
      if (!key) continue;
      const previous = guests.get(key);
      if (previous) {
        previous.orderCount++;
        if (o.status !== "cancelled") previous.spend += o.total ?? 0;
      } else guests.set(key, {
        id: `guest:${key}`, email: o.email ?? "", fullName: o.customer_name, phone: o.phone,
        createdAt: o.created_at, lastSignInAt: null, confirmed: false, roles: [],
        orderCount: 1, spend: o.status === "cancelled" ? 0 : o.total ?? 0, lastOrderAt: o.created_at,
      });
    }
    return [...registered, ...guests.values()];
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "customer"]),
        grant: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.role === "admin" && !data.grant) {
      throw new Error("You can't remove your own admin access");
    }
    if (data.grant) {
      const { error } = await context.supabase
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("order_items").delete().eq("order_id", data.id);
    const { error } = await context.supabase.from("orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("products").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => productInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.images.length < 3) throw new Error("Add at least 3 product photos.");
    const row = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      details: data.details,
      category: data.category,
      price: data.price,
      compare_at: data.compareAt ?? null,
      stock: data.stock,
      sku: data.sku,
      images: data.images,
      status: data.status,
      featured: data.featured,
      best_seller: data.bestSeller,
      is_gift_set: data.isGiftSet,
      includes: data.includes,
      sort_order: data.sortOrder,
    };
    const query = data.id
      ? context.supabase.from("products").update(row).eq("id", data.id)
      : context.supabase.from("products").insert(row);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminCollections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [{ data: collections, error }, { data: links }] = await Promise.all([
      context.supabase.from("collections").select("*").order("sort_order"),
      context.supabase.from("collection_products").select("collection_id, product_id"),
    ]);
    if (error) throw new Error(error.message);
    return (collections ?? []).map((c: { id: string }) => ({
      ...c,
      productIds: (links ?? [])
        .filter((l: { collection_id: string }) => l.collection_id === c.id)
        .map((l: { product_id: string }) => l.product_id),
    }));
  });

export const saveCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => collectionInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = {
      slug: data.slug,
      chapter: data.chapter,
      title: data.title,
      line: data.line,
      body: data.body,
      image: data.image,
      sort_order: data.sortOrder,
    };

    let id = data.id;
    if (id) {
      const { error } = await context.supabase.from("collections").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      id = crypto.randomUUID();
      const { error } = await context.supabase.from("collections").insert({ id, ...row });
      if (error) throw new Error(error.message);
    }

    await context.supabase.from("collection_products").delete().eq("collection_id", id);
    if (data.productIds.length > 0) {
      const { error } = await context.supabase.from("collection_products").insert(
        data.productIds.map((productId, index) => ({
          collection_id: id,
          product_id: productId,
          sort_order: index,
        })),
      );
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("collections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "received", "shipped", "out_for_delivery", "delivered", "cancelled"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
