import { createFileRoute } from "@tanstack/react-router";
import { checkoutSchema } from "@/lib/payments.schema";

// Called by the storefront deployment (Render) with the shared shop key.
export const Route = createFileRoute("/api/public/shop/mpesa-start")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyShopKey, runMpesaCheckout } = await import("@/lib/payments.core.server");
        if (!(await verifyShopKey(request))) return new Response("Unauthorized", { status: 401 });
        const body = await request.json().catch(() => null);
        const parsed = checkoutSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Invalid checkout request." }, { status: 400 });
        try {
          return Response.json(await runMpesaCheckout(parsed.data));
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Something went wrong." },
            { status: 400 },
          );
        }
      },
    },
  },
});
