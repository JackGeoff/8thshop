import { createServerFn } from "@tanstack/react-start";
import { trackingSchema } from "@/lib/payments.schema";
import type { TrackingRow } from "@/lib/payments.schema";

export type TrackingResult = TrackingRow;

export const getOrderTracking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackingSchema.parse(data))
  .handler(async ({ data }): Promise<TrackingResult | null> => {
    const { backendConfigured, callShopBackend, runTracking } =
      await import("@/lib/payments.core.server");
    if (backendConfigured()) return callShopBackend<TrackingResult | null>("tracking", data);
    return runTracking(data);
  });

export const trackingSteps = [
  { status: "pending", label: "Pending" },
  { status: "received", label: "Order received" },
  { status: "shipped", label: "Being shipped" },
  { status: "out_for_delivery", label: "On delivery" },
  { status: "delivered", label: "Delivered" },
] as const;

export const statusLabels: Record<string, string> = {
  pending: "Pending", paid: "Order received", received: "Order received",
  shipped: "Being shipped", out_for_delivery: "On delivery", delivered: "Delivered", cancelled: "Cancelled",
};
