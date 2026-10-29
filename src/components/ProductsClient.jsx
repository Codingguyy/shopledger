"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Plus, ArrowLeftRight, Download } from "lucide-react";
import { Modal, StockBadge } from "./ui";
import ProductForm from "./ProductForm";
import MovementForm from "./MovementForm";
import { inr } from "@/lib/format";

const status = (p) => (p.stock <= 0 ? "out" : p.stock <= p.lowStockThreshold ? "low" : "ok");

export default function ProductsClient({ products, role, initialFilter = "all", title = "Products", lowOnly = false }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [dialog, setDialog] = useState(null); // {kind:'add'} | {kind:'move', id}
  const cats = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const rows = products.filter((p) => {
    const s = `${p.name} ${p.sku} ${p.category}`.toLowerCase();
    return s.includes(q.toLowerCase()) && (cat === "all" || p.category === cat) && (!lowOnly || status(p) !== "ok");
  });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
          <p className="mt-1 text-muted">{lowOnly ? "Products at or below their low-stock threshold, lowest first." : `${products.length} products. Stock is calculated from the movement history.`}</p>
        </div>
        {role === "owner" && (
          <div className="flex gap-2">
            <a href="/api/export" className="btn btn-ghost"><Download className="h-4 w-4" /> <span className="hidden sm:inline">Export CSV</span></a>
            {!lowOnly && <button className="btn btn-primary" onClick={() => setDialog({ kind: "add" })}><Plus className="h-4 w-4" /> Add product</button>}
          </div>
        )}
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search name, SKU or category" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        </div>
        <select className="input sm:w-48" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-line bg-white">
        <div className="hidden grid-cols-[2.2fr_1fr_1fr_1.3fr_auto] gap-4 border-b border-line bg-chalk/70 px-5 py-3 text-xs font-medium text-muted md:grid">
          <span>Product</span><span>Category</span><span className="text-right">Price</span><span className="text-right">In stock</span><span className="w-10" />
        </div>
        <ul className="divide-y divide-line">
          {rows.map((p) => (
            <li key={p.id} className="relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-4 hover:bg-chalk/60 md:grid-cols-[2.2fr_1fr_1fr_1.3fr_auto] md:px-5 md:py-3.5">
              <Link href={`/products/${p.id}`} className="min-w-0 after:absolute after:inset-0 md:col-auto">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="num text-xs text-muted">{p.sku}</span>
              </Link>
              <span className="hidden text-sm text-muted md:block">{p.category}</span>
              <span className="num hidden text-right text-sm md:block">{inr(p.price)}</span>
              <span className="row-span-2 flex flex-col items-end gap-1 md:row-span-1 md:flex-row md:items-center md:justify-end md:gap-3">
                <StockBadge status={status(p)} />
                <span className="num text-sm font-medium">{p.stock} <span className="font-sans font-normal text-muted">{p.unit}</span></span>
              </span>
              <span className="relative z-10 flex items-center gap-3 text-xs text-muted md:justify-end">
                <span className="md:hidden">{p.category} · <span className="num">{inr(p.price)}</span></span>
                <button aria-label={`Record movement for ${p.name}`} onClick={() => setDialog({ kind: "move", id: p.id })} className="hidden rounded-lg border border-line p-2 text-teal-ink hover:bg-teal-soft md:block">
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
        {!rows.length && (
          <div className="px-6 py-14 text-center">
            <p className="font-medium">{products.length ? "No products match your search" : lowOnly ? "Nothing is running low" : "No products yet"}</p>
            <p className="mt-1 text-sm text-muted">{products.length ? "Try a different word or clear the category filter." : role === "owner" ? "Add your first product, then record a purchase to stock it." : "Ask the owner to add products."}</p>
          </div>
        )}
      </div>

      {dialog?.kind === "add" && <Modal title="Add product" onClose={() => setDialog(null)}><ProductForm onDone={() => setDialog(null)} /></Modal>}
      {dialog?.kind === "move" && (
        <Modal title="Record movement" onClose={() => setDialog(null)}>
          <MovementForm products={products} role={role} defaultProductId={dialog.id} onDone={() => setDialog(null)} />
        </Modal>
      )}
    </div>
  );
}
