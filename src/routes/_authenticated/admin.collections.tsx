import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  deleteCollection,
  listAdminCollections,
  listAdminProducts,
  saveCollection,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/collections")({
  head: () => ({ meta: [{ title: "Categories & collections — The 8th Shop Admin" }, { name: "description", content: "Organise the shop's collections and product assignments." }, { property: "og:title", content: "Categories & collections — The 8th Shop Admin" }, { property: "og:description", content: "Manage shop collections and product assignments." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminCollections,
});

type Draft = {
  id?: string;
  slug: string;
  chapter: string;
  title: string;
  line: string;
  body: string;
  image: string;
  sortOrder: string;
  productIds: string[];
};

const empty: Draft = {
  slug: "",
  chapter: "",
  title: "",
  line: "",
  body: "",
  image: "",
  sortOrder: "0",
  productIds: [],
};

const input = "w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground";

function AdminCollections() {
  const list = useServerFn(listAdminCollections);
  const listProducts = useServerFn(listAdminProducts);
  const save = useServerFn(saveCollection);
  const remove = useServerFn(deleteCollection);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => list(),
  });
  const { data: products = [] } = useQuery({ queryKey: ["admin-products"], queryFn: () => listProducts() });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          slug: d.slug,
          chapter: d.chapter,
          title: d.title,
          line: d.line,
          body: d.body,
          image: d.image,
          sortOrder: Number(d.sortOrder) || 0,
          productIds: d.productIds,
        },
      }),
    onSuccess: () => {
      toast.success("Collection saved");
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Collection deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div>
        <div className="flex items-center justify-between">
          <div><p className="eyebrow">Catalogue / Merchandising</p><h2 className="mt-2 text-2xl font-semibold">Categories & collections</h2><p className="mt-1 text-sm text-muted-foreground">{collections.length} curated collections</p></div>
          <Button
            onClick={() => setDraft({ ...empty })}
            className="rounded-none"
          >
            <Plus /> New collection
          </Button>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-6 divide-y divide-border border border-border bg-card">
            {collections.map((c: any) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /{c.slug} · {c.productIds.length} products
                  </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-none"
                  onClick={() =>
                    setDraft({
                      id: c.id,
                      slug: c.slug,
                      chapter: c.chapter ?? "",
                      title: c.title,
                      line: c.line ?? "",
                      body: c.body ?? "",
                      image: c.image ?? "",
                      sortOrder: String(c.sort_order ?? 0),
                      productIds: c.productIds,
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Delete ${c.title}`} title="Delete collection"
                  onClick={() => {
                    if (confirm(`Delete ${c.title}?`)) deleteMutation.mutate(c.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open) setDraft(null); }}><DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto rounded-none p-0">{draft && <><DialogHeader className="border-b border-border p-6"><DialogTitle>{draft.id ? "Edit collection" : "New collection"}</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(draft);
          }}
          className="space-y-3 p-6"
        >
          <input className={input} placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
          <input className={input} placeholder="slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} required />
          <input className={input} placeholder="Chapter (e.g. 01)" value={draft.chapter} onChange={(e) => setDraft({ ...draft, chapter: e.target.value })} />
          <input className={input} placeholder="Line" value={draft.line} onChange={(e) => setDraft({ ...draft, line: e.target.value })} />
          <textarea className={input} rows={3} placeholder="Body" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          <input className={input} placeholder="Image file name or URL" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
          <input className={input} placeholder="Sort order" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} />

          <div className="max-h-64 space-y-2 overflow-y-auto border border-border p-3">
            {products.map((p: any) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.productIds.includes(p.id)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      productIds: e.target.checked
                        ? [...draft.productIds, p.id]
                        : draft.productIds.filter((id) => id !== p.id),
                    })
                  }
                />
                {p.name}
              </label>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saveMutation.isPending} className="rounded-none">
              Save
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)} className="rounded-none">
              Cancel
            </Button>
          </div>
        </form>
      </>}</DialogContent></Dialog>
    </div>
  );
}
