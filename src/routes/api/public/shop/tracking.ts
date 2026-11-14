import { createFileRoute } from "@tanstack/react-router";
import { trackingSchema } from "@/lib/payments.schema";

// Called by the storefront deployment (Render) with the shared shop key.
// Returns only the phone-verified tracking summary — no customer PII beyond it.
export const Route = createFileRoute("/api/public/shop/tracking")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyShopKey, runTracking } = await import("@/lib/payments.core.server");
        if (!(await verifyShopKey(request))) return new Response("Unauthorized", { status: 401 });
        const body = await request.json().catch(() => null);
        const parsed = trackingSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
        try {
          return Response.json(await runTracking(parsed.data));
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
