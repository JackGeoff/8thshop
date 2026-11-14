import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ShopProvider } from "@/lib/shop-store";
import { Nav } from "@/components/shop/Nav";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { WhatsAppFab } from "@/components/shop/WhatsAppFab";
import { Footer } from "@/components/shop/Footer";
import { getCatalogue } from "@/lib/catalogue.functions";
import { resolveImage, setCatalogue, type Collection, type Product } from "@/lib/products";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl text-foreground">This page isn't in the shop</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-ink px-6 py-3 text-xs uppercase tracking-[0.2em] text-ink-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="display text-3xl text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-ink px-6 py-3 text-xs uppercase tracking-[0.2em] text-ink-foreground"
          >
            Try again
          </button>
          <a href="/" className="border border-border px-6 py-3 text-xs uppercase tracking-[0.2em]">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    const data = await getCatalogue();
    const catalogue = {
      products: (data.products as Product[]).map((p) => ({
        ...p,
        images: p.images.map(resolveImage),
      })),
      collections: (data.collections as Collection[]).map((c) => ({
        ...c,
        image: resolveImage(c.image),
      })),
    };
    setCatalogue(catalogue);
    return catalogue;
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The 8th Shop — Gifts worth remembering" },
      {
        name: "description",
        content:
          "A digital showroom of jewellery, accessories and curated gift boxes. Delivered across Kenya, paid with M-Pesa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@300;400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const catalogue = Route.useLoaderData();
  setCatalogue(catalogue);
  const isAdmin = useRouterState({ select: (s) => s.location.pathname.startsWith("/admin") });

  return (
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        {!isAdmin && <Nav />}
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        {!isAdmin && <Footer />}
        {!isAdmin && <CartDrawer />}
        {!isAdmin && <WhatsAppFab />}
        <Toaster position="bottom-right" />
      </ShopProvider>
    </QueryClientProvider>
  );
}
