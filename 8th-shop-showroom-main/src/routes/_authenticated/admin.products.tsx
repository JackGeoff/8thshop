import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteProduct, listAdminProducts, saveProduct } from "@/lib/admin.functions";
import { categories, formatKsh, resolveImage } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "Products — The 8th Shop Admin" }, { name: "description", content: "Add and manage products, photos, pricing and stock." }, { property: "og:title", content: "Products — The 8th Shop Admin" }, { property: "og:description", content: "Manage The 8th Shop product catalogue." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  details: string;
  category: string;
  price: string;
  compareAt: string;
  stock: string;
  sku: string;
  images: string[];
  status: "active" | "draft";
  featured: boolean;
  bestSeller: boolean;
  isGiftSet: boolean;
  includes: string;
  sortOrder: string;
};

const empty: Draft = {
  name: "",
  slug: "",
  description: "",
  details: "",
  category: "necklaces",
  price: "0",
  compareAt: "",
  stock: "0",
  sku: "",
  images: [],
  status: "active",
  featured: false,
  bestSeller: false,
  isGiftSet: false,
  includes: "",
  sortOrder: "0",
};

const input = "w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground";
const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

function AdminProducts() {
  const list = useServerFn(listAdminProducts);
  const save = useServerFn(saveProduct);
  const remove = useServerFn(deleteProduct);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [unsavedUploads, setUnsavedUploads] = useState<string[]>([]);

  async function closeEditor() {
    if (unsavedUploads.length) {
      await supabase.storage.from("product-images").remove(unsavedUploads);
      setUnsavedUploads([]);
    }
    setDraft(null);
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) throw new Error("Choose image files smaller than 10 MB.");
        const path = `${crypto.randomUUID()}.${(file.name.split(".").pop() || "jpg").toLowerCase()}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
        if (error) throw error;
        uploaded.push(`product-images:${path}`);
        setUnsavedUploads((paths) => [...paths, path]);
      }
      setDraft((current) => current ? { ...current, images: [...current.images, ...uploaded] } : current);
      toast.success(`${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} uploaded`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => list(),
  });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          name: d.name,
          slug: d.slug,
          description: d.description,
          details: lines(d.details),
          category: d.category,
          price: Number(d.price) || 0,
          compareAt: d.compareAt ? Number(d.compareAt) : null,
          stock: Number(d.stock) || 0,
          sku: d.sku,
          images: d.images,
          status: d.status,
          featured: d.featured,
          bestSeller: d.bestSeller,
          isGiftSet: d.isGiftSet,
          includes: lines(d.includes),
          sortOrder: Number(d.sortOrder) || 0,
        },
      }),
    onSuccess: (_result, savedDraft) => {
      toast.success("Product saved");
      const unused = unsavedUploads.filter((path) => !savedDraft.images.includes(`product-images:${path}`));
      if (unused.length) void supabase.storage.from("product-images").remove(unused);
      setUnsavedUploads([]);
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["catalogue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div>
        <div className="flex items-center justify-between">
          <div><p className="eyebrow">Inventory / Catalogue</p><h2 className="mt-2 text-2xl font-semibold">Products <span className="text-muted-foreground">({products.length})</span></h2></div>
          <Button
            onClick={() => { setUnsavedUploads([]); setDraft({ ...empty }); }}
            className="rounded-none"
          >
            <Plus /> Add product
          </Button>
        </div>
        <input aria-label="Search products" placeholder="Search products or SKU" value={search} onChange={(e) => setSearch(e.target.value)} className={`${input} mt-6 max-w-sm bg-card`} />

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-5 overflow-x-auto border border-border bg-card"><div className="min-w-[580px] divide-y divide-border">
            {products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())).map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <ProductThumbnail image={p.images?.[0] ?? ""} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.category} · {formatKsh(p.price)} · stock {p.stock} · {p.status}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-none"
                  onClick={() => {
                    setUnsavedUploads([]);
                    setDraft({
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      description: p.description ?? "",
                      details: (p.details ?? []).join("\n"),
                      category: p.category,
                      price: String(p.price),
                      compareAt: p.compare_at ? String(p.compare_at) : "",
                      stock: String(p.stock),
                      sku: p.sku ?? "",
                      images: p.images ?? [],
                      status: p.status === "draft" ? "draft" : "active",
                      featured: p.featured,
                      bestSeller: p.best_seller,
                      isGiftSet: p.is_gift_set,
                      includes: (p.includes ?? []).join("\n"),
                      sortOrder: String(p.sort_order ?? 0),
                    });
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Delete ${p.name}`} title="Delete product"
                  onClick={() => {
                    if (confirm(`Delete ${p.name}?`)) deleteMutation.mutate(p.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div></div>
        )}
      </div>
      <Dialog open={Boolean(draft)} onOpenChange={(open) => { if (!open && !uploading) void closeEditor(); }}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto rounded-none p-0">{draft && <>
        <DialogHeader className="border-b border-border p-6"><DialogTitle>{draft.id ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.images.length < 3) { toast.error("Add at least 3 product photos."); return; }
            saveMutation.mutate(draft);
          }}
          className="space-y-4 p-6"
        >
          <input className={input} placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
          <input className={input} placeholder="slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} required />
          <textarea className={input} rows={3} placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <textarea className={input} rows={3} placeholder="Details (one per line)" value={draft.details} onChange={(e) => setDraft({ ...draft, details: e.target.value })} />
          <select className={input} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input className={input} placeholder="Price (KSh)" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
            <input className={input} placeholder="Compare at" value={draft.compareAt} onChange={(e) => setDraft({ ...draft, compareAt: e.target.value })} />
            <input className={input} placeholder="Stock" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
            <input className={input} placeholder="SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
          </div>
          <div><p className="mb-2 text-sm font-medium">Product photos ({draft.images.length}/3 minimum)</p><label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-border bg-muted/30 px-4 py-6 text-sm hover:bg-muted"><ImagePlus className="size-5" />{uploading ? "Uploading photos…" : "Choose photos"}<input type="file" accept="image/*" multiple disabled={uploading} className="sr-only" onChange={(e) => { void uploadPhotos(e.target.files); e.target.value = ""; }} /></label><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{draft.images.map((image, i) => <PhotoTile key={`${image}-${i}`} image={image} index={i} onRemove={() => setDraft({ ...draft, images: draft.images.filter((_, j) => j !== i) })} onMove={(to) => { const next = [...draft.images]; const first = next[i]; const second = next[to]; if (first === undefined || second === undefined) return; next[i] = second; next[to] = first; setDraft({ ...draft, images: next }); }} count={draft.images.length} />)}</div></div>
          <textarea className={input} rows={2} placeholder="Gift set includes (one per line)" value={draft.includes} onChange={(e) => setDraft({ ...draft, includes: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className={input} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as "active" | "draft" })}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
            <input className={input} placeholder="Sort order" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em]">
            {([
              ["featured", "Featured"],
              ["bestSeller", "Best seller"],
              ["isGiftSet", "Gift set"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saveMutation.isPending || uploading} className="rounded-none">
              Save
            </Button>
            <Button type="button" variant="outline" onClick={() => { void closeEditor(); }} className="rounded-none">
              Cancel
            </Button>
          </div>
        </form>
      </>}</DialogContent></Dialog>
    </div>
  );
}

function PhotoTile({ image, index, count, onRemove, onMove }: { image: string; index: number; count: number; onRemove: () => void; onMove: (to: number) => void }) {
  const { data: signed } = useQuery({ queryKey: ["admin-image", image], queryFn: async () => {
    if (!image.startsWith("product-images:")) return image;
    const { data, error } = await supabase.storage.from("product-images").createSignedUrl(image.slice("product-images:".length), 3600);
    if (error) throw error;
    return data.signedUrl;
  }, staleTime: 50 * 60 * 1000 });
  const src = image.startsWith("product-images:") ? signed : resolveImage(image);
  return <div className="relative aspect-square bg-muted">{src && <img src={src} alt={`Product photo ${index + 1}`} className="size-full object-cover" />}<div className="absolute bottom-0 left-0 right-0 flex justify-between bg-background/90 p-1"><Button type="button" variant="ghost" size="icon" disabled={index === 0} aria-label="Move photo earlier" onClick={() => onMove(index - 1)}><ArrowUp className="size-3" /></Button><Button type="button" variant="ghost" size="icon" disabled={index === count - 1} aria-label="Move photo later" onClick={() => onMove(index + 1)}><ArrowDown className="size-3" /></Button><Button type="button" variant="ghost" size="icon" aria-label="Remove photo" onClick={onRemove}><Trash2 className="size-3" /></Button></div></div>;
}

function ProductThumbnail({ image }: { image: string }) {
  const { data: signed } = useQuery({ queryKey: ["admin-image", image], queryFn: async () => {
    const { data, error } = await supabase.storage.from("product-images").createSignedUrl(image.slice("product-images:".length), 3600);
    if (error) throw error;
    return data.signedUrl;
  }, enabled: image.startsWith("product-images:"), staleTime: 50 * 60 * 1000 });
  return image ? <img src={image.startsWith("product-images:") ? signed : resolveImage(image)} alt="" className="size-14 shrink-0 bg-muted object-cover" /> : <div className="size-14 shrink-0 bg-muted" />;
}
