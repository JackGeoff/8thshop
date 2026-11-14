import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const DELIVERY_FEE = 300;
const PAYSTACK = "https://api.paystack.co";

/** Normalise any Kenyan mobile format to +2547XXXXXXXX / +2541XXXXXXXX, or null. */
export function normalizeKenyanPhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  let local = "";
  if (/^254[17]\d{8}$/.test(digits)) local = digits.slice(3);
  else if (/^0[17]\d{8}$/.test(digits)) local = digits.slice(1);
  else if (/^[17]\d{8}$/.test(digits)) local = digits;
  else return null;
  return `+254${local}`;
}

function secretKey() {
  const key = process.env["PAYSTACK_SECRET_KEY"];
  if (!key) throw new Error("M-PESA payments are not configured yet.");
  return key;
}

export async function paystackRequest<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<{ status: boolean; message: string; data: T }> {
  const res = await fetch(`${PAYSTACK}${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : null,
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: T;
  };
  if (!res.ok || !json.status) {
    const detail = (json.data as { message?: string } | undefined)?.message;
    console.error("[paystack]", path, res.status, json.message, detail);
    throw new Error(detail || json.message || "Payment provider error");
  }
  return { status: true, message: json.message ?? "", data: json.data as T };
}

export async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type PaystackTransaction = {
  id: number | string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata?: { order_id?: string } | string | null;
};

/**
 * Idempotently marks an order paid after checking reference, amount and currency
 * against the database. Safe to call from both the webhook and verification.
 */
export async function applySuccessfulCharge(
  tx: PaystackTransaction,
): Promise<{ ok: boolean; reason?: string; orderId?: string }> {
  if (tx.status !== "success") return { ok: false, reason: "not_success" };
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, total, status, payment_status, payment_reference")
    .eq("payment_reference", tx.reference)
    .maybeSingle();
  if (!order) return { ok: false, reason: "unknown_reference" };
  if (order.payment_status === "paid") return { ok: true, orderId: order.id };
  if (tx.currency !== "KES") return { ok: false, reason: "currency_mismatch" };
  if (Number(tx.amount) !== Math.round(order.total * 100))
    return { ok: false, reason: "amount_mismatch" };

  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      status: order.status === "pending" ? "paid" : order.status,
      paystack_transaction_id: String(tx.id),
      amount_paid: Number(tx.amount),
      payment_currency: tx.currency,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .neq("payment_status", "paid");
  if (error) throw new Error(error.message);
  return { ok: true, orderId: order.id };
}

export async function markChargeFailed(reference: string) {
  await supabaseAdmin
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("payment_reference", reference)
    .eq("payment_status", "pending");
}

/** Records a webhook event; returns false if it was already processed. */
export async function claimEvent(
  eventKey: string,
  eventType: string,
  reference: string | null,
  payload: unknown,
) {
  const { error } = await supabaseAdmin
    .from("payment_events")
    .insert({ event_key: eventKey, event_type: eventType, reference, payload: payload as never });
  if (error) {
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }
  return true;
}
