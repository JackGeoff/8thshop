import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrderTracking, trackingSteps, statusLabels } from "@/lib/tracking.functions";

export const Route = createFileRoute("/track-order/$orderNumber")({
  head: () => ({ meta: [
    { title: "Track your order — The 8th Shop" },
    { name: "description", content: "Follow the delivery progress of your The 8th Shop order." },
    { property: "og:title", content: "Track your order — The 8th Shop" },
    { property: "og:description", content: "Check the latest delivery progress for your order." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: TrackOrder,
});

function TrackOrder() {
  const { orderNumber } = Route.useParams();
  const lookup = useServerFn(getOrderTracking);
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const { data: order, isFetching, isError } = useQuery({
    queryKey: ["tracking", orderNumber, verifiedPhone],
    queryFn: () => lookup({ data: { orderNumber, phone: verifiedPhone } }),
    enabled: Boolean(verifiedPhone),
    refetchInterval: verifiedPhone ? 5000 : false,
    refetchOnWindowFocus: true,
  });
  const currentIndex = order ? trackingSteps.findIndex((step) => step.status === (order.status === "paid" ? "received" : order.status)) : -1;
  function submit(e: FormEvent) { e.preventDefault(); setVerifiedPhone(phone.trim()); }
  return <main className="mx-auto min-h-screen max-w-4xl px-5 pb-28 pt-36 md:px-10 md:pt-44">
    <Link to="/shop" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to shop</Link>
    <div className="mt-12 border-b border-border pb-9"><p className="eyebrow">Delivery desk · {orderNumber}</p><h1 className="display mt-3 text-5xl md:text-7xl">Track your order.</h1></div>
    <form onSubmit={submit} className="mt-10 max-w-lg">
      <label className="block text-sm font-medium" htmlFor="tracking-phone">Phone number used at checkout</label>
      <div className="mt-3 flex gap-2"><input id="tracking-phone" type="tel" autoComplete="tel" required minLength={6} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0712 345 678" className="min-w-0 flex-1 border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground" /><Button type="submit" className="h-12 rounded-none px-6">Track</Button></div>
    </form>
    {isFetching && !order && <p className="mt-10 text-sm text-muted-foreground">Checking your order…</p>}
    {verifiedPhone && !isFetching && (isError || !order) && <p role="alert" className="mt-10 border-l-2 border-destructive pl-4 text-sm">We couldn't find an order with this number and phone. Check the details and try again.</p>}
    {order && <div className="mt-14 space-y-12">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-8"><div><p className="eyebrow">Current status</p><h2 className="display mt-2 text-4xl">{statusLabels[order.status] ?? order.status}</h2><p className="mt-2 text-sm text-muted-foreground">Last updated {new Date(order.updatedAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</p></div><PackageSearch className="size-10 text-clay" strokeWidth={1.2} /></div>
      {order.status === "cancelled" ? <p className="border-l-2 border-destructive pl-4 text-sm">This order was cancelled. Contact support if you need help.</p> : <ol aria-label="Delivery progress" className="grid grid-cols-5 gap-1 sm:gap-3">{trackingSteps.map((step, index) => <li key={step.status} className="min-w-0"><div className={`flex h-2 w-full items-center ${index <= currentIndex ? "bg-clay" : "bg-muted"}`} /><div className={`mt-4 flex size-7 items-center justify-center rounded-full border ${index <= currentIndex ? "border-clay bg-clay text-clay-foreground" : "border-border"}`}>{index <= currentIndex ? <Check className="size-4" /> : <span className="text-xs">{index + 1}</span>}</div><p className="mt-2 break-words text-xs font-medium leading-tight">{step.label}</p></li>)}</ol>}
      <div className="border-t border-border pt-8"><p className="eyebrow">Your pieces</p><ul className="mt-5 divide-y divide-border">{order.items.map((item, i) => <li key={i} className="flex justify-between gap-4 py-3 text-sm"><span>{item.name}</span><span className="text-muted-foreground">× {item.quantity}</span></li>)}</ul>{order.town && <p className="mt-5 text-sm text-muted-foreground">Delivering to {order.town}</p>}</div>
      <p className="text-xs text-muted-foreground">This page checks for new progress every few seconds.</p>
    </div>}
  </main>;
}
