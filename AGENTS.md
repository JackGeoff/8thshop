<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the admin workspace under the authenticated admin layout, with role checks in each server function; a sidebar gate alone does not protect data.
- Store order tracking state on orders with server-stamped status timestamps, and verify the checkout phone before returning public tracking details; this keeps the customer progress view synchronized without exposing order data.
- Store product photo references as `product-images:` paths and sign their URLs when displaying them; the private bucket must not expose permanent public links.

- Paystack M-PESA: orders are created server-side (supabaseAdmin) keyed by a client checkout UUID and marked paid only via applySuccessfulCharge in payments.server.ts after reference/amount/KES checks; webhook events are deduplicated in payment_events. Why: one idempotent path for webhook and verification fallback.
