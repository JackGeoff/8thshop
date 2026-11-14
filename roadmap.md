// ============= Full file contents =============

# Store roadmap

- [x] Admin dashboard, order tracking, product/collection management, customer records
- [x] Paystack M-PESA checkout, webhook, verification fallback, admin payment details
- [x] Add PAYSTACK_SECRET_KEY (live key saved; STK push verified on Lovable preview)
- [x] Payments bridge: Lovable deployment is the backend; Render forwards checkout/tracking to /api/public/shop/* with a shared key; webhook moved to /api/public/payments/paystack/webhook

## Open (user actions)

- Render: add SHOP_BACKEND_URL = https://eighth-avenue-showroom.lovable.app and SHOP_BACKEND_KEY (same value saved in Lovable), then redeploy Render with the latest code.
- Paystack dashboard: set the webhook URL to https://eighth-avenue-showroom.lovable.app/api/public/payments/paystack/webhook
- Two pre-existing security warnings: signed-in SECURITY DEFINER permission, leaked password protection off.
- Whole-project ESLint still fails on older files' formatting — left intentionally.
