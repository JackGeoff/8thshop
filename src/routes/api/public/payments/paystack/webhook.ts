import { createFileRoute } from "@tanstack/react-router";

// Paystack calls this directly, so it lives under /api/public/. Configure this
// URL in the Paystack dashboard as the webhook address.
export const Route = createFileRoute("/api/public/payments/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifySignature, claimEvent, applySuccessfulCharge, markChargeFailed } =
          await import("@/lib/payments.server");
        const raw = await request.text();
        if (!(await verifySignature(raw, request.headers.get("x-paystack-signature")))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event?: string;
          data?: {
            id?: number | string;
            reference?: string;
            status?: string;
            amount?: number;
            currency?: string;
          };
        };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }
        const type = event.event ?? "unknown";
        const tx = event.data;
        if (!tx?.reference) return new Response("ok");

        if (type === "charge.success") {
          const { paystackRequest } = await import("@/lib/payments.server");
          // Confirm with Paystack rather than trusting the payload alone.
          const { data: verified } = await paystackRequest<
            import("@/lib/payments.server").PaystackTransaction
          >(`/transaction/verify/${encodeURIComponent(tx.reference)}`);
          const fresh = await claimEvent(
            `charge.success:${tx.reference}`,
            type,
            tx.reference,
            event,
          );
          if (!fresh) return new Response("duplicate");
          const result = await applySuccessfulCharge(verified);
          if (!result.ok)
            console.error("[paystack webhook] not applied", tx.reference, result.reason);
        } else if (type === "charge.failed") {
          if (await claimEvent(`charge.failed:${tx.reference}`, type, tx.reference, event))
            await markChargeFailed(tx.reference);
        }
        return new Response("ok");
      },
    },
  },
});
