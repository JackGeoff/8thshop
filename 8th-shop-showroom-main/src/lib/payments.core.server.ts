// Server-only payment/tracking core. Runs either locally (when this deployment
// owns the database) or is reached through the public shop API by deployments
// that forward to the Lovable-hosted backend.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { applySuccessfulCharge, markChargeFailed, paystackRequest } from "./payments.server";
import type {
  CheckInput,
  CheckResult,
  CheckoutInput,
  CheckoutResult,
  TrackingInput,
  TrackingRow,
} from "./payments.schema";

type ChargeData = { reference: string; status: string; display_text?: string };

/** True when this deployment forwards shop calls to the Lovable-hosted backend. */
export function backendConfigured(): boolean {
  return Boolean(process.env["SHOP_BACKEND_URL"] && process.env["SHOP_BACKEND_KEY"]);
}

/** Server-to-server call to the backend deployment. Never exposes the key to the browser. */
export async function callShopBackend<T>(path: string, body: unknown): Promise<T> {
  const base = process.env["SHOP_BACKEND_URL"]?.replace(/\/+$/, "");
  const key = process.env["SHOP_BACKEND_KEY"];
  if (!base || !key) throw new Error("The payment service is not configured.");
  let res: Response;
  try {
    res = await fetch(`${base}/api/public/shop/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-shop-key": key },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("We couldn't reach the payment service. Please try again.");
  }
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error || "The payment service had a problem. Please try again.");
  return json as T;
}

/** Verifies the shared secret sent by the storefront deployment. */
export async function verifyShopKey(request: Request): Promise<boolean> {
  const expected = process.env["SHOP_BACKEND_KEY"];
  const provided = request.headers.get("x-shop-key");
  if (!expected || !provided) return false;
  const { timingSafeEqual } = await import("crypto");
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function runMpesaCheckout(data: CheckoutInput): Promise<CheckoutResult> {
  const { normalizeKenyanPhone } = await import("./payments.server");

  const phone = normalizeKenyanPhone(data.phone);
  if (!phone) throw new Error("Enter a valid Safaricom number, e.g. 0712 345 678.");

  // Reuse the pending order for this checkout session — never create a duplicate.
  const { data: existing } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, total, payment_status")
    .eq("id", data.checkoutId)
    .maybeSingle();

  let order = existing;
  if (order?.payment_status === "paid") {
    return {
      orderId: order.id,
      orderNumber: order.order_number ?? "",
      total: order.total,
      reference: null,
      paymentStatus: "paid" as const,
      message: "Already paid",
    };
  }

  if (!order) {
    const { DELIVERY_FEE } = await import("./payments.server");
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, slug, name, price, status")
      .in(
        "slug",
        data.items.map((i) => i.slug),
      )
      .eq("status", "active");
    if (pErr) throw new Error("Could not load the items in your bag.");
    const lines = data.items.flatMap((item) => {
      const product = (products ?? []).find((p) => p.slug === item.slug);
      return product ? [{ product, qty: item.qty }] : [];
    });
    if (lines.length === 0) throw new Error("Your bag is empty.");
    const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0) + DELIVERY_FEE;
    const orderNumber = `T8-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${data.checkoutId.slice(0, 8).toUpperCase()}`;

    const { error } = await supabaseAdmin.from("orders").insert({
      id: data.checkoutId,
      order_number: orderNumber,
      customer_name: data.customerName,
      phone,
      email: data.email,
      town: data.town || null,
      notes: data.notes || null,
      payment_method: "mpesa",
      payment_status: "pending",
      total,
    });
    if (error) throw new Error("We couldn't save your order. Please try again.");
    const { error: iErr } = await supabaseAdmin.from("order_items").insert(
      lines.map((l) => ({
        order_id: data.checkoutId,
        product_id: l.product.id,
        name: l.product.name,
        price: l.product.price,
        quantity: l.qty,
      })),
    );
    if (iErr) throw new Error("We couldn't save your order items. Please try again.");
    order = { id: data.checkoutId, order_number: orderNumber, total, payment_status: "pending" };
  }

  const reference = `${order.order_number}-${Date.now().toString(36).toUpperCase()}`;
  const { error: refErr } = await supabaseAdmin
    .from("orders")
    .update({ payment_reference: reference, payment_status: "pending", phone })
    .eq("id", order.id);
  if (refErr) throw new Error("Could not start payment. Please try again.");

  let charge: ChargeData;
  try {
    const res = await paystackRequest<ChargeData>("/charge", {
      method: "POST",
      body: {
        email: data.email,
        amount: Math.round(order.total * 100),
        currency: "KES",
        reference,
        mobile_money: { phone, provider: "mpesa" },
        metadata: { order_id: order.id, order_number: order.order_number },
      },
    });
    charge = res.data;
  } catch (e) {
    await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    throw new Error(
      e instanceof Error && /configured|test mobile money/i.test(e.message)
        ? e.message.includes("test mobile money")
          ? "Test mode: use Paystack's test M-PESA number 0710 000 000."
          : e.message
        : "We couldn't send the M-PESA prompt. Check the number and try again.",
    );
  }

  return {
    orderId: order.id,
    orderNumber: order.order_number ?? "",
    total: order.total,
    reference,
    paymentStatus: charge.status === "success" ? ("paid" as const) : ("pending" as const),
    message: charge.display_text ?? "Check your phone and enter your M-PESA PIN.",
  };
}

export async function runPaymentCheck(data: CheckInput): Promise<CheckResult> {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, payment_status, payment_reference")
    .eq("id", data.orderId)
    .maybeSingle();
  if (!order || order.payment_reference !== data.reference) throw new Error("Payment not found.");
  if (order.payment_status === "paid" || order.payment_status === "failed")
    return { paymentStatus: order.payment_status };

  // Fallback: ask Paystack directly in case the webhook is delayed.
  try {
    const { data: tx } = await paystackRequest<import("./payments.server").PaystackTransaction>(
      `/transaction/verify/${encodeURIComponent(data.reference)}`,
    );
    if (tx.status === "success") {
      const result = await applySuccessfulCharge(tx);
      return { paymentStatus: result.ok ? "paid" : "pending" };
    }
    if (["failed", "abandoned", "reversed"].includes(tx.status)) {
      await markChargeFailed(data.reference);
      return { paymentStatus: "failed" };
    }
  } catch {
    // Transaction not yet visible — keep waiting.
  }
  return { paymentStatus: "pending" };
}

export async function runTracking(data: TrackingInput): Promise<TrackingRow | null> {
  const { data: result, error } = await supabaseAdmin.rpc("track_order", {
    p_order_number: data.orderNumber,
    p_phone: data.phone,
  });
  if (error) throw new Error("Tracking is unavailable right now. Please try again.");
  return result as TrackingRow | null;
}
