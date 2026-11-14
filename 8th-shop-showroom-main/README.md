# 8th Shop Showroom

The 8th Shop — Frontend Redesign & Premium E-Commerce Experience

Redesign the entire customer-facing frontend of The 8th Shop into a premium, immersive, editorial-style e-commerce experience.

1. PRIMARY DESIGN REFERENCE

Use the following website as the main visual and interaction inspiration:

Robinhood Market — https://shop.robinhood.com/

Study the reference carefully before implementing the frontend.

IMPORTANT: Do NOT copy Robinhood's branding, logo, text, product designs, proprietary assets, or exact website content. We are taking inspiration from its layout philosophy, visual hierarchy, animation style, product presentation, navigation, spacing, typography treatment, transitions and overall premium shopping experience.

The final website must feel like The 8th Shop, but with the same level of polish, creativity and immersion as the reference.

2. THE EXPERIENCE WE WANT

Do NOT build a generic Shopify-looking website.

Avoid the typical:

Hero banner → 3 cards → category section → product grid → footer

Instead, create an experience that feels like the customer has entered a digital fashion/gift showroom.

The website should feel:

Premium

Minimal

Modern

Editorial

Playful

Immersive

Smooth

Highly visual

Mobile-first

Luxury without being expensive-looking

Easy to shop

The products should feel like the main characters of the website.

Large photography, generous whitespace, strong typography and smooth animations should be used throughout.

3. LANDING EXPERIENCE

The homepage should immediately feel different from a normal e-commerce website.

Create a strong opening experience inspired by the immersive entrance of the reference website.

For example:

THE 8TH SHOP

A short, elegant statement such as:

Gifts worth remembering.

or

Something special is waiting for you.

Then provide a clear interaction:

ENTER THE SHOP

The entrance should transition smoothly into the actual shopping experience.

Do not make the animation annoying or slow.

The customer must always have an obvious way to continue.

4. NAVIGATION

Create a minimal floating/sticky navigation.

It should remain visually clean and unobtrusive.

Suggested structure:

THE 8TH SHOP

Shop
Collections
Gifts
About

Right side:

Search
Wishlist
Bag

On mobile, use a beautiful minimal menu.

The navigation should become more compact when the customer scrolls.

5. HERO / FEATURED PRODUCT EXPERIENCE

Instead of immediately showing a dense product grid, introduce products through large editorial sections.

Example:

NEW ARRIVALS

Large product photography.

Product name
Short description
KSh price

SHOP NOW

Allow products to visually enter/exit as the user scrolls.

Use subtle:

Fade animations

Scale animations

Horizontal movement

Parallax

Image transitions

Text reveal animations

Animations must remain performant.

Do NOT over-animate everything.

6. PRODUCT PRESENTATION

Products need to be visually dominant.

Product cards should feel premium.

Each product should support:

Large product image

Hover image transition

Product name

Price

Category

Wishlist button

Quick add

View product

On desktop, use large editorial product layouts where appropriate.

On mobile, optimize the layout rather than simply shrinking the desktop version.

Product photography should have plenty of breathing room.

7. COLLECTION EXPERIENCE

Create beautiful collection sections for:

Necklaces

Bracelets

Earrings

Glasses

Gift Sets

But don't present them as boring rectangular category cards.

Make them feel like editorial chapters.

For example:

THE EVERYDAY COLLECTION

Elegant everyday pieces.

THE GIFT COLLECTION

Something they'll actually remember.

THE COUPLES COLLECTION

Made for two.

Each collection should have a strong visual identity and transition naturally into its product catalogue.

8. GIFT SETS SHOULD BE A MAJOR FEATURE

Gift sets are an important part of The 8th Shop's business model.

Give them a dedicated premium section.

Example:

THE 8TH GIFT BOX

Beautifully curated pieces.
Ready to give.

Starting from KSh 1,200

EXPLORE GIFTS

Gift sets must feel like complete products rather than simply bundles of other products.

The existing business specification includes individual products and curated gift packages, so preserve that functionality.

9. PRODUCT PAGE

Create a highly visual product detail page.

Desktop:

Large image gallery on the left.

Product information on the right:

Product name
Price
Description
Availability
Quantity
Add to Bag
Save to Wishlist

Then:

Details
Shipping
Returns

Below the main product:

YOU MAY ALSO LIKE

Use large, beautiful product recommendations.

On mobile, make the product image occupy significant screen space before the purchasing information.

10. SHOPPING CART

The cart should feel like part of the premium experience.

Prefer a smooth slide-out cart drawer instead of immediately navigating away.

Display:

Product image
Product name
Quantity controls
Price
Remove

Then:

Subtotal

CHECKOUT

The cart should remain accessible from anywhere in the website.

11. GUEST SHOPPING / LOCAL STORAGE

This is VERY IMPORTANT.

Customers must NOT be forced to create an account before they can shop.

If a visitor does not have an account:

Cart

Store their cart locally in the browser using localStorage.

Example:

guest_cart


The cart must survive:

Page refresh

Navigation

Closing and reopening the browser

until the browser's local storage is cleared.

Wishlist

Allow visitors to save products without an account.

Store their wishlist locally as well.

Example:

guest_wishlist


The customer should be able to browse and save products without signing in.

12. ACCOUNT CREATION + DATA MERGING

When a guest eventually creates an account or logs in, automatically synchronize their locally stored shopping data with their account.

Example:

Guest Browser

localStorage
    ↓
guest_cart
guest_wishlist
    ↓
Customer creates account
    ↓
Backend API
    ↓
Customer account
    ↓
Database


After successful synchronization:

Merge guest cart with existing account cart

Merge guest wishlist with existing wishlist

Avoid duplicate wishlist items

Correctly merge duplicate cart products by quantity

Clear the guest local-storage data after successful synchronization

The database should become the source of truth once the customer is authenticated.

Do NOT lose anything the customer saved before creating an account.

13. GUEST CHECKOUT

Guest checkout should remain possible.

Do NOT force users to create an account simply to purchase.

The customer should be able to:

Browse → Add to Bag → Checkout → Enter Details → Pay → Receive Order Confirmation

Account creation can be offered after checkout or during the process, but it should not unnecessarily interrupt the purchase.

14. CHECKOUT

Create a clean, distraction-free checkout.

Collect:

Full name

Phone number

Email

Delivery location

Delivery details

Display:

Items
Subtotal
Delivery fee
Total

Then payment.

The existing project specification prioritizes M-Pesa STK Push for Kenyan customers, so keep the frontend architecture ready for that payment flow.

15. WHATSAPP

WhatsApp should be easily accessible throughout the shopping experience.

Especially on:

Product pages

Gift-set pages

Checkout

Contact section

Include a subtle floating WhatsApp action.

Example:

Need help choosing a gift? Chat with us.

Do not let it visually overpower the website.

16. HOMEPAGE STRUCTURE

Use an editorial flow similar to a premium digital showroom:

Immersive entrance

Featured/new arrivals

Editorial product showcase

Gift collection

Shop by collection

Best sellers

Gift sets

Brand story

Customer reviews

WhatsApp CTA

Footer

Sections should not all look identical.

Create visual rhythm between sections.

17. TYPOGRAPHY

Use typography as a major part of the design.

Large headlines.

Short sentences.

Strong contrast between:

Large editorial headings

Small supporting text

Product names

Prices

CTAs

Avoid excessive text.

The website should communicate visually first.

18. COLORS

Create a sophisticated visual system for The 8th Shop.

Do not blindly copy Robinhood's colors.

Use a refined palette that complements jewellery, accessories and gifts.

The final palette should feel:

Clean

Premium

Warm

Modern

Maintain strong accessibility and readable contrast.

19. ANIMATION

Use modern web animation carefully.

Recommended:

Smooth page transitions

Scroll-triggered reveals

Image scaling

Product hover interactions

Smooth cart drawer

Wishlist animation

Button micro-interactions

Collection transitions

Subtle parallax

Text reveals

Use Framer Motion or an equivalent animation system if already supported by the project.

IMPORTANT:

Animations must not make the website slow.

Respect:

prefers-reduced-motion.

20. RESPONSIVE DESIGN

The website must be designed for:

Desktop

Laptop

Tablet

Mobile

Do NOT simply scale the desktop design down.

The mobile version should feel intentionally designed.

Especially optimize:

Navigation

Product imagery

Cart

Checkout

Product pages

Touch interactions

Typography

Scroll animations

21. PERFORMANCE

Despite the visual effects, performance is critical.

Implement:

Lazy-loaded images

Responsive image sizes

Optimized image formats

Minimal JavaScript where possible

Efficient animations

No unnecessary re-renders

Skeleton loading where appropriate

Do not allow animations or huge images to destroy mobile performance.

22. EXISTING BUSINESS REQUIREMENTS

Do not remove or break the existing e-commerce functionality.

The website must continue supporting:

Products

Product categories

Gift sets

Product pages

Cart

Checkout

Orders

Customer accounts

Inventory

Payments

Delivery

Wishlist

WhatsApp

Admin-managed products

The business specification already defines products with fields such as name, slug, description, category, price, stock, SKU, images, status and featured status. Preserve compatibility with the existing backend/data model.

23. VERY IMPORTANT IMPLEMENTATION RULE

Before changing the code:

Inspect the existing project.

Understand the current frontend architecture.

Identify the existing backend APIs.

Identify the existing authentication system.

Identify the existing product/cart/order structures.

Do NOT unnecessarily rebuild the backend.

Reuse existing functionality wherever possible.

Upgrade the frontend experience around the existing system.

The objective is to create a dramatically better frontend experience, not to destroy working functionality.

24. FINAL DESIGN TARGET

When finished, the website should make someone think:

"This doesn't look like a normal online shop."

It should feel like entering a beautifully designed digital showroom.

The reference website is:

https://shop.robinhood.com/

Use it throughout development as the primary visual and interaction reference.

But the final result must be unmistakably:

THE 8TH SHOP

The 8th Shop should have its own branding, products, copy, imagery and identity while adopting the same level of polish, immersion and creativity demonstrated by the reference.

Do not settle for a generic e-commerce template.

Build the frontend as a premium interactive shopping experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6eb1b33e-fdbf-48e4-aac8-f58f33c180fd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
