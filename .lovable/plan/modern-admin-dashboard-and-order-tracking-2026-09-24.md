# Modern admin dashboard and order tracking

## Goal
Refactor The 8th Shop admin into a responsive operations dashboard with a fixed desktop sidebar, mobile drawer, clear management tables, richer order controls, and customer-facing order tracking.

## Admin shell
- Replace the horizontal admin tabs with a fixed left sidebar branded “The 8th Shop Admin”.
- Add Dashboard, Products, Orders & Tracking, Customers, Categories & Collections, and Sign Out entries with clear icons and active states.
- Show the signed-in admin email and an Admin badge in the sidebar footer.
- Add a responsive top bar with the current section, Nairobi date, mobile menu trigger, and compact operational indicators.
- Keep the storefront navigation, footer, cart, and WhatsApp controls hidden throughout `/admin` so the backend feels like a separate workspace.

## Dashboard
- Restyle the overview as a dense, modern operations dashboard using the existing shop palette with a cleaner neutral admin surface.
- Lead with Total Sales Revenue, Pending Orders, Total Customers, and Units in Stock.
- Retain and refine the 14-day revenue chart, order status summary, recent orders, low-stock alerts, best sellers, and quick actions.
- Make every dashboard section responsive and readable on desktop, tablet, and mobile.

## Orders and tracking
- Expand the status model to: Pending, Order Received, Being Shipped, On Delivery, Delivered, and Cancelled.
- Add human-friendly order numbers and status timestamps to existing and future orders.
- Replace the order feed with a searchable/filterable table; clicking a row opens an order details dialog.
- Show customer, delivery, payment, line items, total, status timeline, and contextual next-step buttons in the dialog.
- Add a public `/track-order/$orderNumber` page with order-number and phone verification, a live progress indicator, items, and delivery summary.
- Subscribe the tracking view to order updates so admin status changes appear without a manual refresh.
- Return the order number after checkout and link the confirmation screen directly to tracking.

## Customers and marketing
- Build the customer table from both registered accounts and guest checkout records, merged by normalized email or phone.
- Show full name, email, phone, total orders, lifetime spend, last order, and account/admin status.
- Add search and filters, one-click copy controls for phone/email, WhatsApp outreach links, and CSV export.
- Keep role changes protected and preserve the rule preventing an admin from removing their own access.

## Products, categories, and collections
- Restyle product and collection management into the same table/dialog visual language.
- Keep current create, edit, delete, category assignment, stock, pricing, draft/live, featured, best-seller, and gift-set behavior.
- Include the previously requested real multi-image uploader with at least three product photos, thumbnail previews, removal, and ordering.
- Use a protected public image bucket so shoppers can view product photos while only admins can upload or remove them.

## Database and security
- Add an additive migration for order number, expanded status constraints, and milestone timestamps; backfill existing orders safely.
- Add a narrowly scoped public tracking function that returns only one verified order when both order number and phone match, rather than exposing the orders table.
- Preserve admin-only management policies, explicit grants, guest checkout, KSh pricing, and M-Pesa behavior.
- Update generated database typings to match the schema.

## Verification
- Verify admin sign-in and every admin page with the real admin session.
- Verify product creation/edit behavior, customer search/export/copy, order dialog progression, and cancellation.
- Place or use a real order, open its tracking URL, update status in admin, and confirm the customer progress view updates.
- Check desktop and mobile layouts for sidebar behavior, tables, dialogs, overflow, and tap targets.
