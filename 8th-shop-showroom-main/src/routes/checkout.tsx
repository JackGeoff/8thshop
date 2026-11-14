import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatKsh, getProduct, resolveImage } from "@/lib/products";
import { useShop } from "@/lib/shop-store";
import { useServerFn } from "@tanstack/react-start";
import { checkMpesaPayment, startMpesaCheckout } from "@/lib/payments.functions";
import { WHATSAPP_URL } from "@/components/shop/WhatsAppFab";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — The 8th Shop" },
      { name: "description", content: "Guest checkout with M-Pesa. No account needed to buy." },
      { property: "og:title", content: "Checkout — The 8th Shop" },
      { property: "og:description", content: "Guest checkout with M-Pesa. No account needed." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

const DELIVERY_FEE = 300;

type CheckoutValues = {
  name: string;
  phone: string;
  email: string;
  location: string;
  details: string;
};
type PendingPayment = {
  orderId: string;
  orderNumber: string;
  reference: string;
  total: number;
  message: string;
};

function CheckoutPage() {
  const { cart, hydrated, clearCart } = useShop();
  const startCheckout = useServerFn(startMpesaCheckout);
  const checkPayment = useServerFn(checkMpesaPayment);
  const checkoutId = useRef<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const lastForm = useRef<CheckoutValues | null>(null);

  const lines = cart
    .map((l) => ({ line: l, product: getProduct(l.slug) }))
    .filter((x): x is { line: typeof x.line; product: NonNullable<typeof x.product> } =>
      Boolean(x.product),
    );
  const subtotal = lines.reduce((s, { line, product }) => s + line.qty * product.price, 0);
  const total = subtotal + (subtotal > 0 ? DELIVERY_FEE : 0);

  const pay = async (values: CheckoutValues) => {
    if (!/^(?:\+?254|0)?[17]\d{8}$/.test(values.phone.replace(/[\s-]/g, ""))) {
      toast.error("Enter a valid Safaricom number, e.g. 0712 345 678.");
      return;
    }
    checkoutId.current ??= crypto.randomUUID();
    lastForm.current = values;
    setSubmitting(true);
    setFailed(false);
    try {
      const result = await startCheckout({
        data: {
          checkoutId: checkoutId.current,
          customerName: values.name,
          phone: values.phone,
          email: values.email,
          town: values.location,
          notes: values.details,
          items: cart.map((l) => ({ slug: l.slug, qty: l.qty })),
        },
      });
      if (result.paymentStatus === "paid" || !result.reference) {
        finish(result.orderNumber);
        return;
      }
      setPending({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        reference: result.reference,
        total: result.total,
        message: result.message,
      });
      window.scrollTo({ top: 0 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        /SUPABASE_SERVICE_ROLE_KEY|Missing Supabase environment/i.test(msg)
          ? "Online payment isn't available on this site yet. Order on WhatsApp instead and we'll sort you out."
          : msg || "We couldn't start the payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const finish = (orderNumber: string) => {
    setPending(null);
    setPlaced(orderNumber);
    clearCart();
    checkoutId.current = null;
    toast.success("Payment received — thank you!");
    window.scrollTo({ top: 0 });
  };

  const check = async () => {
    if (!pending) return;
    setChecking(true);
    try {
      const r = await checkPayment({
        data: { orderId: pending.orderId, reference: pending.reference },
      });
      if (r.paymentStatus === "paid") finish(pending.orderNumber);
      else if (r.paymentStatus === "failed") setFailed(true);
    } catch {
      /* keep waiting */
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!pending || failed) return;
    const t = setInterval(() => void check(), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, failed]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();
    void pay({
      name: get("name"),
      phone: get("phone"),
      email: get("email"),
      location: get("location"),
      details: get("details"),
    });
  };

  if (pending) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col justify-center px-5 py-32 text-center">
        <p className="eyebrow">M-PESA · {formatKsh(pending.total)}</p>
        {failed ? (
          <>
            <h1 className="display mt-4 text-5xl">Payment not completed.</h1>
            <p className="mt-5 text-sm text-muted-foreground">
              The M-PESA request was cancelled or timed out. Your order is saved — try again.
            </p>
            <Button
              className="mt-8 h-12 rounded-none text-xs uppercase"
              disabled={submitting}
              onClick={() => lastForm.current && void pay(lastForm.current)}
            >
              {submitting ? "Sending prompt…" : "Send M-PESA prompt again"}
            </Button>
          </>
        ) : (
          <>
            <h1 className="display mt-4 text-5xl">Check your phone and complete payment.</h1>
            <p className="mt-5 text-sm text-muted-foreground">
              {pending.message} We'll confirm automatically once it's done.
            </p>
            <div className="mx-auto mt-8 h-1 w-40 overflow-hidden bg-muted">
              <div className="h-full w-1/3 animate-pulse bg-clay" />
            </div>
            <Button
              variant="outline"
              className="mt-8 h-12 rounded-none text-xs uppercase"
              disabled={checking}
              onClick={() => void check()}
            >
              {checking ? "Checking…" : "I've paid — check now"}
            </Button>
          </>
        )}
        <p className="mt-6 text-xs text-muted-foreground">Order {pending.orderNumber}</p>
        <button
          className="mt-4 text-xs underline underline-offset-4"
          onClick={() => {
            setPending(null);
            setFailed(false);
          }}
        >
          Back to checkout
        </button>
      </main>
    );
  }

  if (placed) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center px-5 py-32 text-center">
        <p className="eyebrow">Payment confirmed</p>
        <h1 className="display mt-4 text-6xl">Thank you.</h1>
        <p className="mt-5 text-sm text-muted-foreground">
          Your M-PESA payment is in. Keep your order number to follow its delivery progress.
        </p>
        <p className="mt-6 font-medium">{placed}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild className="h-12 rounded-none px-8 text-xs uppercase">
            <Link to="/track-order/$orderNumber" params={{ orderNumber: placed }}>
              Track your order
            </Link>
          </Button>
          <Link
            to="/shop"
            className="bg-ink px-8 py-4 text-xs uppercase tracking-[0.2em] text-ink-foreground"
          >
            Keep shopping
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="border border-border px-8 py-4 text-xs uppercase tracking-[0.2em]"
          >
            Message us
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1300px] px-5 pb-32 pt-32 md:px-10 md:pt-40">
      <h1 className="display text-[13vw] leading-[0.85] md:text-[6vw]">Checkout</h1>
      <p className="mt-4 text-sm text-muted-foreground">Guest checkout — no account required.</p>

      {hydrated && lines.length === 0 ? (
        <div className="mt-20 border-t border-border pt-14">
          <p className="display text-4xl">Your bag is empty.</p>
          <Link
            to="/shop"
            className="mt-6 inline-block bg-ink px-7 py-3 text-xs uppercase tracking-[0.2em] text-ink-foreground"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-14 grid gap-16 md:grid-cols-[1.2fr_1fr]">
          <form onSubmit={submit} className="space-y-10">
            <fieldset className="space-y-5">
              <legend className="eyebrow mb-4">Your details</legend>
              <Field label="Full name" name="name" autoComplete="name" required />
              <Field
                label="M-PESA phone number (e.g. 0712 345 678)"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
              />
              <Field label="Email" name="email" type="email" autoComplete="email" required />
            </fieldset>

            <fieldset className="space-y-5">
              <legend className="eyebrow mb-4">Delivery</legend>
              <Field
                label="Delivery location"
                name="location"
                autoComplete="address-level2"
                required
              />
              <Field label="Delivery details (building, landmark, instructions)" name="details" />
            </fieldset>

            <fieldset>
              <legend className="eyebrow mb-4">Payment</legend>
              <div className="border border-border p-5">
                <p className="text-sm">M-Pesa STK Push</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  M-Pesa payment details will be confirmed with you after placing your order.
                </p>
              </div>
            </fieldset>

            <Button
              type="submit"
              disabled={submitting}
              className="h-14 w-full rounded-none text-xs uppercase"
            >
              {submitting ? "Placing order…" : `Place order · ${formatKsh(total)}`}
            </Button>

            <p className="text-xs text-muted-foreground">
              Prefer to talk it through?{" "}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                Order on WhatsApp
              </a>
              .
            </p>
          </form>

          <aside className="h-fit border border-border p-6 md:sticky md:top-28">
            <p className="eyebrow">Your order</p>
            <div className="mt-6 space-y-5">
              {lines.map(({ line, product }) => (
                <div key={product.slug} className="flex gap-4">
                  <img
                    src={resolveImage(product.images[0] ?? "")}
                    alt={product.name}
                    loading="lazy"
                    className="h-20 w-16 bg-secondary object-cover"
                  />
                  <div className="flex flex-1 justify-between">
                    <div>
                      <p className="text-sm">{product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Qty {line.qty}</p>
                    </div>
                    <span className="text-sm tabular-nums">
                      {formatKsh(product.price * line.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <dl className="mt-8 space-y-2 border-t border-border pt-5 text-sm">
              <Row label="Subtotal" value={formatKsh(subtotal)} />
              <Row label="Delivery" value={formatKsh(DELIVERY_FEE)} />
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="eyebrow">Total</span>
              <span className="display text-2xl tabular-nums">{formatKsh(total)}</span>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full border-b border-border bg-transparent py-3 text-sm outline-none transition-colors focus:border-clay"
      />
    </label>
  );
}
