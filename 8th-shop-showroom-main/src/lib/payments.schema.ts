import { z } from "zod";

export const checkoutSchema = z.object({
  checkoutId: z.string().uuid(),
  customerName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(9).max(20),
  email: z.string().trim().email().max(160),
  town: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  items: z
    .array(z.object({ slug: z.string().max(120), qty: z.number().int().min(1).max(50) }))
    .min(1)
    .max(50),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const checkSchema = z.object({
  orderId: z.string().uuid(),
  reference: z.string().min(5).max(80),
});
export type CheckInput = z.infer<typeof checkSchema>;

export const trackingSchema = z.object({
  orderNumber: z.string().min(5).max(40),
  phone: z.string().min(6).max(30),
});
export type TrackingInput = z.infer<typeof trackingSchema>;

export type CheckoutResult = {
  orderId: string;
  orderNumber: string;
  total: number;
  reference: string | null;
  paymentStatus: "paid" | "pending";
  message: string;
};

export type CheckResult = { paymentStatus: string };

export type TrackingRow = {
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  receivedAt: string | null;
  shippedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  town: string | null;
  items: { name: string; quantity: number }[];
};
