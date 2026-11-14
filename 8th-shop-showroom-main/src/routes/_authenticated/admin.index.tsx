import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { getAdminOverview } from "@/lib/admin.functions";
import { formatKsh, resolveImage } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — The 8th Shop Admin" }, { name: "description", content: "Review shop sales, orders, customers and stock." }, { property: "og:title", content: "Dashboard — The 8th Shop Admin" }, { property: "og:description", content: "The 8th Shop sales and operations overview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminOverview,
});

const statusTone: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  received: "bg-clay/15 text-clay",
  out_for_delivery: "bg-clay/15 text-clay",
  shipped: "bg-clay/15 text-clay",
  delivered: "bg-foreground/10 text-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${statusTone[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

function AdminOverview() {
  const fetchOverview = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview() });

  if (isLoading)
    return (
      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse bg-background" />
        ))}
      </div>
    );

  if (!data?.isAdmin)
    return (
      <p className="text-sm text-muted-foreground">
        You're signed in, but this account doesn't have admin access.
      </p>
    );

  const cards = [
     { label: "Revenue", value: formatKsh(data.revenue), hint: "Delivered or paid orders" },
    { label: "Average order", value: formatKsh(data.averageOrder), hint: "Excludes cancelled" },
    { label: "Pending orders", value: String(data.pendingCount), hint: "Awaiting action" },
     { label: "Customers", value: String(data.customerCount), hint: "Accounts and guest orders" },
    { label: "Products", value: String(data.productCount), hint: `${data.activeProductCount} live` },
    { label: "Collections", value: String(data.collectionCount), hint: "Editorial chapters" },
    { label: "Units in stock", value: String(data.inventoryUnits), hint: "Across all pieces" },
    { label: "Stock value", value: formatKsh(data.inventoryValue), hint: "Retail value on hand" },
  ];

  const quick = [
    { to: "/admin/products", label: "Add a product", note: "New piece, images, pricing" },
    { to: "/admin/collections", label: "Build a collection", note: "Group pieces into a chapter" },
    { to: "/admin/orders", label: "Fulfil orders", note: `${data.pendingCount} pending` },
    { to: "/admin/customers", label: "Manage accounts", note: "Roles and access" },
  ] as const;

  return (
     <div className="space-y-12">
       <section className="hidden grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-background p-7">
            <p className="eyebrow">{c.label}</p>
            <p className="display mt-3 text-3xl leading-none">{c.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
         <div className="border-b border-border pb-7">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl">Last 14 days</h2>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Revenue</p>
          </div>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.days} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                  interval={1}
                />
                <Tooltip
                  cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                  formatter={(v: number) => [formatKsh(Number(v)), "Revenue"]}
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  fill="url(#rev)"
                  className="text-foreground"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-5">
            {data.statusCounts.map((s) => (
              <div key={s.status} className="text-xs">
                <span className="uppercase tracking-[0.16em] text-muted-foreground">{s.status}</span>
                <span className="ml-2 tabular-nums">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-px bg-border">
          {quick.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group bg-background p-6 transition-colors hover:bg-muted/40"
            >
              <p className="text-sm">{q.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{q.note}</p>
              <span className="mt-4 inline-block text-xs uppercase tracking-[0.18em] text-muted-foreground transition-transform group-hover:translate-x-1">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <h2 className="display text-2xl">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              All orders
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">No orders yet — your first sale will appear here.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm">{o.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.items} item{o.items === 1 ? "" : "s"} ·{" "}
                      {new Date(o.createdAt).toLocaleDateString("en-KE")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={o.status} />
                    <span className="text-sm tabular-nums">{formatKsh(o.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-10">
          <div>
            <h2 className="display border-b border-border pb-4 text-2xl">Low stock</h2>
            {data.lowStock.length === 0 ? (
              <p className="mt-5 text-sm text-muted-foreground">Every piece is well stocked.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 py-3">
                    {p.image ? (
                      <img src={resolveImage(p.image)} alt="" className="h-12 w-10 object-cover" />
                    ) : (
                      <div className="h-12 w-10 bg-muted" />
                    )}
                    <span className="flex-1 text-sm">{p.name}</span>
                    <span
                      className={`text-xs tabular-nums ${p.stock === 0 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="display border-b border-border pb-4 text-2xl">Best sellers</h2>
            {data.topProducts.length === 0 ? (
              <p className="mt-5 text-sm text-muted-foreground">No sales data yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.topProducts.map((p) => (
                  <li key={p.name} className="flex items-center justify-between py-3 text-sm">
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.units} sold · {formatKsh(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
