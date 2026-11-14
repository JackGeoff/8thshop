import { Link } from "@tanstack/react-router";
import { WHATSAPP_URL } from "./WhatsAppFab";

export function Footer() {
  return (
    <footer className="bg-ink px-5 pb-10 pt-24 text-ink-foreground md:px-10">
      <div className="mx-auto max-w-[1600px]">
        <h2 className="display max-w-[14ch] text-[13vw] leading-[0.9] md:text-[7.5vw]">Gifts worth remembering.</h2>

        <div className="mt-20 grid gap-12 border-t border-ink-foreground/15 pt-12 md:grid-cols-4">
          <div>
            <p className="eyebrow text-ink-foreground/50">Shop</p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link to="/shop" className="link-underline w-fit">
                All pieces
              </Link>
              <Link to="/categories" className="link-underline w-fit">
                Categories
              </Link>
              <Link to="/wishlist" className="link-underline w-fit">
                Wishlist
              </Link>
            </div>
          </div>
          <div>
            <p className="eyebrow text-ink-foreground/50">The 8th</p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link to="/help" className="link-underline w-fit">
                Help Center
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="link-underline w-fit">
                WhatsApp
              </a>
            </div>
          </div>
          <div>
            <p className="eyebrow text-ink-foreground/50">Delivery</p>
            <p className="mt-4 max-w-[28ch] text-sm text-ink-foreground/70">
              Same-day within Nairobi. Countrywide in 1–3 days. M-Pesa on delivery available.
            </p>
          </div>
          <div>
            <p className="eyebrow text-ink-foreground/50">Contact</p>
            <p className="mt-4 text-sm text-ink-foreground/70">
              Nairobi, Kenya
              <br />
              hello@the8thshop.co.ke
              <br />
              +254 700 000 000
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-2 border-t border-ink-foreground/15 pt-6 text-xs text-ink-foreground/50 md:flex-row">
          <span>© {new Date().getFullYear()} The 8th Shop</span>
          <span>Made in Nairobi</span>
        </div>
      </div>
    </footer>
  );
}
