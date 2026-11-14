import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL } from "@/components/shop/WhatsAppFab";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — The 8th Shop" },
      { name: "description", content: "Get help with orders, M-Pesa payments, delivery, exchanges, and product questions." },
      { property: "og:title", content: "Help Center — The 8th Shop" },
      { property: "og:description", content: "Friendly support for your order, delivery, payment, or gift choice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

const answers = [
  ["Delivery", "Same-day delivery is available in Nairobi for early orders. Countrywide delivery usually takes 1–3 working days."],
  ["Payments", "Checkout supports M-Pesa. Use the phone number that should receive the payment prompt."],
  ["Exchanges", "Unworn pieces in their original packaging can be exchanged within 14 days."],
  ["Gift help", "Tell us who you are shopping for and your budget. We will help you choose and prepare the gift."],
] as const;

function HelpPage() {
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      "Hi The 8th Shop, I need help.",
      `Name: ${String(data.get("name") ?? "")}`,
      `Phone: ${String(data.get("phone") ?? "")}`,
      `About: ${String(data.get("topic") ?? "")}`,
      `Message: ${String(data.get("message") ?? "")}`,
    ].join("\n");
    const url = new URL(WHATSAPP_URL);
    url.searchParams.set("text", message);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <main className="pb-28 pt-32 md:pt-44">
      <section className="mx-auto max-w-[1600px] px-5 md:px-10">
        <p className="eyebrow">Here when you need us</p>
        <h1 className="display mt-4 max-w-[12ch] text-6xl md:text-8xl">How can we help?</h1>
        <div className="mt-16 grid gap-px bg-border md:grid-cols-4">
          {answers.map(([title, copy]) => (
            <article key={title} className="bg-background p-6 md:min-h-52 md:p-8">
              <h2 className="display text-3xl">{title}</h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-24 bg-secondary py-20 md:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-14 px-5 md:grid-cols-[0.8fr_1.2fr] md:px-10">
          <div>
            <p className="eyebrow">Contact support</p>
            <h2 className="display mt-4 text-5xl md:text-6xl">Talk to a real person.</h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">Send your question through WhatsApp and our team will reply there.</p>
            <Button asChild variant="outline" className="mt-8 h-12 rounded-none px-6 uppercase tracking-[0.14em]">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp support</a>
            </Button>
          </div>
          <form onSubmit={submit} className="grid gap-5">
            <label className="grid gap-2 text-xs uppercase tracking-[0.14em]">Name<input name="name" required className="h-12 border border-input bg-background px-4 text-sm normal-case outline-none focus:border-foreground" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-[0.14em]">Phone<input name="phone" type="tel" required className="h-12 border border-input bg-background px-4 text-sm normal-case outline-none focus:border-foreground" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-[0.14em]">What do you need help with?<select name="topic" className="h-12 border border-input bg-background px-4 text-sm normal-case outline-none focus:border-foreground"><option>Choosing a gift</option><option>An existing order</option><option>Delivery</option><option>Exchange</option><option>Something else</option></select></label>
            <label className="grid gap-2 text-xs uppercase tracking-[0.14em]">Message<textarea name="message" required rows={5} className="border border-input bg-background p-4 text-sm normal-case outline-none focus:border-foreground" /></label>
            <Button type="submit" className="h-12 rounded-none uppercase tracking-[0.14em]"><Send /> Send on WhatsApp</Button>
            {sent && <p role="status" className="text-sm text-muted-foreground">Your message opened in WhatsApp.</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
