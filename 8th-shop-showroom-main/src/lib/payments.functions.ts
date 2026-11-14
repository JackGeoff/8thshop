import { createServerFn } from "@tanstack/react-start";
import {
  checkSchema,
  checkoutSchema,
  type CheckResult,
  type CheckoutResult,
} from "./payments.schema";

export const startMpesaCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const { backendConfigured, callShopBackend, runMpesaCheckout } =
      await import("./payments.core.server");
    if (backendConfigured()) return callShopBackend<CheckoutResult>("mpesa-start", data);
    return runMpesaCheckout(data);
  });

export const checkMpesaPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkSchema.parse(data))
  .handler(async ({ data }): Promise<CheckResult> => {
    const { backendConfigured, callShopBackend, runPaymentCheck } =
      await import("./payments.core.server");
    if (backendConfigured()) return callShopBackend<CheckResult>("mpesa-check", data);
    return runPaymentCheck(data);
  });
