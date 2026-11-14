import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ChartNoAxesCombined, Package, Truck, Users, FolderKanban, LogOut, Menu, X, ArrowUpRight, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatKsh } from "@/lib/products";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin workspace — The 8th Shop" },
    { name: "description", content: "Manage The 8th Shop orders, catalogue, customers and collections." },
    { property: "og:title", content: "Admin workspace — The 8th Shop" },
    { property: "og:description", content: "The 8th Shop operations workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AdminLayout,
});

const sections = [
  { to: "/admin", label: "Dashboard", icon: ChartNoAxesCombined, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders & Tracking", icon: Truck },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/collections", label: "Categories & Collections", icon: FolderKanban },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getOverview = useServerFn(getAdminOverview);
  const { data } = useQuery({ queryKey: ["admin-overview"], queryFn: () => getOverview(), refetchInterval: 30000 });
  const { user } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const current = sections.find((section) => section.to === path)?.label ?? "Dashboard";
  const today = new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (data && !data.isAdmin) return <main className="mx-auto max-w-xl px-6 py-28"><h1 className="text-2xl font-semibold">Admin access required</h1><p className="mt-3 text-sm text-muted-foreground">This account cannot access the store workspace.</p><Button asChild variant="outline" className="mt-6"><Link to="/">Back to shop</Link></Button></main>;

  return <div className="min-h-screen bg-background font-sans text-foreground">
    {menuOpen && <div className="fixed inset-0 z-[61] bg-ink/50 lg:hidden" onClick={() => setMenuOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-[62] flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-24 items-start justify-between border-b border-sidebar-border px-6 pt-7">
        <div><p className="display text-[26px] leading-none">The 8th Shop</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin workspace</p></div>
        <Button size="icon" variant="ghost" aria-label="Close menu" className="lg:hidden" onClick={() => setMenuOpen(false)}><X /></Button>
      </div>
      <p className="px-6 pb-3 pt-9 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
      <nav aria-label="Admin navigation" className="flex-1 space-y-1 px-3">
        {sections.map((section) => <Link key={section.to} to={section.to} activeOptions={{ exact: "exact" in section }} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-3 border-l-2 border-transparent px-4 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" activeProps={{ className: "border-sidebar-primary bg-sidebar-accent font-semibold text-sidebar-accent-foreground" }}><section.icon className="size-[17px]" strokeWidth={1.7} />{section.label}</Link>)}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Link to="/" className="flex items-center gap-3 px-4 py-3 text-xs text-muted-foreground hover:text-foreground"><ArrowUpRight className="size-4" />View storefront</Link>
        <Button variant="ghost" onClick={signOut} className="w-full justify-start gap-3 px-4 text-xs font-normal text-muted-foreground hover:text-foreground"><LogOut className="size-4" />Sign out</Button>
      </div>
      <div className="flex items-center gap-3 border-t border-sidebar-border p-5"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">{(user.email ?? "A").slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-medium">{user.email}</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-clay">Admin</p></div></div>
    </aside>
    <div className="min-w-0 lg:pl-[260px]">
      <header className="sticky top-0 z-40 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-background/95 px-5 backdrop-blur md:px-9">
        <div className="flex min-w-0 items-center gap-3"><Button size="icon" variant="ghost" aria-label="Open menu" className="lg:hidden" onClick={() => setMenuOpen(true)}><Menu /></Button><div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">The 8th Shop / Admin</p><h1 className="mt-1 text-xl font-semibold">{current}</h1></div></div>
        <div className="hidden items-center gap-5 text-xs text-muted-foreground sm:flex"><span>{today}</span>{data?.isAdmin && <Link to="/admin/orders" className="flex items-center gap-2 border-l border-border pl-5 hover:text-foreground"><Circle className="size-2 fill-clay text-clay" />{data.pendingCount} pending</Link>}</div>
      </header>
      {data?.isAdmin && <section aria-label="Shop at a glance" className="grid grid-cols-2 border-b border-border bg-card xl:grid-cols-4">{[
        ["Total sales revenue", formatKsh(data.revenue)], ["Pending orders", String(data.pendingCount)],
        ["Total customers", String(data.customerCount)], ["Units in stock", String(data.inventoryUnits)],
      ].map(([label, value]) => <div key={label} className="min-w-0 border-b border-border px-5 py-5 last:border-0 odd:border-r xl:border-b-0 xl:border-r md:px-9"><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</p><p className="mt-2 break-words text-xl font-semibold tabular-nums md:text-2xl">{value}</p></div>)}</section>}
      <main className="mx-auto max-w-[1500px] px-5 py-8 md:px-9 md:py-10"><Outlet /></main>
    </div>
  </div>;
}
