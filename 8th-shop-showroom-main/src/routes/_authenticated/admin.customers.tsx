import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, MessageCircle, Search } from "lucide-react";
import { listCustomers, setUserRole } from "@/lib/admin.functions";
import { formatKsh } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — The 8th Shop Admin" }, { name: "description", content: "View customer orders and contact details for The 8th Shop." }, { property: "og:title", content: "Customers — The 8th Shop Admin" }, { property: "og:description", content: "Customer records and account access management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const list = useServerFn(listCustomers);
  const setRole = useServerFn(setUserRole);
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const { data: customers = [], isLoading, isError } = useQuery({ queryKey: ["admin-customers"], queryFn: () => list() });
  const roleMutation = useMutation({ mutationFn: (vars: { userId: string; role: "admin" | "customer"; grant: boolean }) => setRole({ data: vars }), onSuccess: () => { toast.success("Account updated"); queryClient.invalidateQueries({ queryKey: ["admin-customers"] }); }, onError: (e: Error) => toast.error(e.message) });
  const filtered = useMemo(() => customers.filter((c) => {
    const match = `${c.fullName} ${c.email} ${c.phone}`.toLowerCase().includes(query.trim().toLowerCase());
    return match && (filter === "all" || (filter === "guests" ? c.id.startsWith("guest:") : filter === "admins" ? c.roles.includes("admin") : c.orderCount > 0));
  }), [customers, query, filter]);
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); toast.success("Copied to clipboard"); } catch { toast.error("Could not copy"); } };
  function exportCsv() {
    const columns = ["Name", "Email", "Phone", "Orders", "Lifetime spend (KSh)", "Last order", "Account type"];
    const rows = filtered.map((c) => [c.fullName, c.email, c.phone, c.orderCount, c.spend, c.lastOrderAt ?? "", c.id.startsWith("guest:") ? "Guest" : "Registered"]);
    const csv = [columns, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "the-8th-shop-customers.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">People & relationships</p><h2 className="mt-2 text-2xl font-semibold">Customers</h2><p className="mt-1 text-sm text-muted-foreground">{customers.length} registered and guest contacts</p></div><Button variant="outline" onClick={exportCsv} disabled={!filtered.length} className="rounded-none"><Download /> Export CSV</Button></div>
    <div className="mt-8 flex flex-wrap gap-3"><label className="relative min-w-[230px] flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><span className="sr-only">Search customers</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone" className="h-10 w-full border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-foreground" /></label><select aria-label="Filter customers" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 border border-border bg-card px-4 text-sm"><option value="all">All contacts</option><option value="buyers">With orders</option><option value="guests">Guest checkout</option><option value="admins">Admins</option></select></div>
    <div className="mt-5 border border-border bg-card"><Table className="min-w-[850px]"><TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead className="pl-5">Customer</TableHead><TableHead>Phone</TableHead><TableHead>Orders</TableHead><TableHead>Lifetime spend</TableHead><TableHead>Last order</TableHead><TableHead className="pr-5">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((c) => <TableRow key={c.id}><TableCell className="pl-5"><p className="font-medium">{c.fullName || "Unnamed customer"} {c.roles.includes("admin") && <span className="ml-2 bg-clay/10 px-1.5 py-0.5 text-[10px] text-clay">Admin</span>}</p><p className="mt-1 text-xs text-muted-foreground">{c.email || "No email"} · {c.id.startsWith("guest:") ? "Guest" : "Account"}</p></TableCell><TableCell>{c.phone ? <span className="flex items-center gap-1"><span className="whitespace-nowrap">{c.phone}</span><Button variant="ghost" size="icon" aria-label={`Copy phone for ${c.fullName}`} title="Copy phone" onClick={() => copy(c.phone)}><Copy /></Button></span> : <span className="text-muted-foreground">—</span>}</TableCell><TableCell>{c.orderCount}</TableCell><TableCell className="tabular-nums">{formatKsh(c.spend)}</TableCell><TableCell className="text-muted-foreground">{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("en-KE") : "—"}</TableCell><TableCell className="pr-5"><div className="flex items-center gap-1">{c.phone && <Button variant="ghost" size="icon" asChild title="Open WhatsApp"><a href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "254")}`} target="_blank" rel="noreferrer" aria-label={`Message ${c.fullName} on WhatsApp`}><MessageCircle /></a></Button>}{c.email && <Button variant="ghost" size="icon" title="Copy email" aria-label={`Copy email for ${c.fullName}`} onClick={() => copy(c.email)}><Copy /></Button>}{!c.id.startsWith("guest:") && <Button variant="outline" size="sm" disabled={roleMutation.isPending} className="rounded-none" onClick={() => roleMutation.mutate({ userId: c.id, role: "admin", grant: !c.roles.includes("admin") })}>{c.roles.includes("admin") ? "Revoke admin" : "Make admin"}</Button>}</div></TableCell></TableRow>)}</TableBody></Table>{isLoading && <p className="p-6 text-sm text-muted-foreground">Loading customers…</p>}{isError && <p className="p-6 text-sm text-destructive">Customers couldn't be loaded.</p>}{!isLoading && !filtered.length && !isError && <p className="p-6 text-sm text-muted-foreground">No customers match your search.</p>}</div>
    <p className="mt-5 text-xs text-muted-foreground">Only contact customers about promotions when they have agreed to receive marketing messages.</p>
  </section>;
}
