import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export const WHATSAPP_URL =
  "https://wa.me/254700000000?text=Hi%20The%208th%20Shop%2C%20I%20need%20help%20choosing%20a%20gift.";

export function WhatsAppFab() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setExpanded(true), 2500);
    const t2 = setTimeout(() => setExpanded(false), 8000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-border bg-background/90 py-3 pl-3 pr-4 shadow-sm backdrop-blur transition-all hover:bg-secondary"
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle className="size-4 text-clay" strokeWidth={1.6} />
      <span
        className={`overflow-hidden whitespace-nowrap text-xs transition-all duration-500 ${
          expanded ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        Need help choosing a gift?
      </span>
    </a>
  );
}
