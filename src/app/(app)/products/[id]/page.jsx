import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import Product from "@/models/Product";
import { currentStock, productHistory, stockStatus } from "@/lib/stock";
import { inr, fmtDate, fmtTime } from "@/lib/format";
import { StockBadge, TypePill } from "@/components/ui";
import ProductActions from "@/components/ProductActions";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  if (!mongoose.isValidObjectId(params.id)) notFound();
  const user = await getCurrentUser();
  const doc = await Product.findById(params.id).lean();
  if (!doc) notFound();
  const [stock, history] = await Promise.all([currentStock(params.id), productHistory(params.id)]);
  const p = { id: String(doc._id), sku: doc.sku, name: doc.name, category: doc.category, unit: doc.unit, price: doc.price, lowStockThreshold: doc.lowStockThreshold, stock };
  const status = stockStatus(p);

  return (
    <div className="space-y-8">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ChevronLeft className="h-4 w-4" /> Products</Link>

      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="num text-sm text-muted">{p.sku} · {p.category}</p>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">{p.name}</h1>
          <p className="mt-2 text-sm text-muted">{inr(p.price)} per {p.unit} · warns at {p.lowStockThreshold} {p.unit}</p>
        </div>
        <div className="md:text-right">
          <p className="text-sm text-muted">In stock now</p>
          <p className="flex items-baseline gap-2 md:justify-end">
            <span className={`num text-5xl font-semibold ${status === "out" ? "text-stockout" : status === "low" ? "text-marigold-ink" : ""}`}>{stock}</span>
            <span className="text-muted">{p.unit}</span>
          </p>
          <div className="mt-1 h-6 md:flex md:justify-end"><StockBadge status={status} /></div>
        </div>
      </header>

      <ProductActions product={p} role={user.role} hasHistory={history.length > 0} />

      <section aria-labelledby="ledger">
        <h2 id="ledger" className="mb-1 text-xl font-semibold">Movement history</h2>
        <p className="mb-4 text-sm text-muted">Newest first. The balance column is what stock was after each entry.</p>
        <div className="overflow-hidden rounded-xl2 border border-line bg-white">
          <div className="hidden grid-cols-[1.1fr_1fr_2fr_1fr_5rem_5rem_5rem] gap-3 border-b-2 border-teal-ink/80 bg-chalk/70 px-5 py-3 text-xs font-medium text-muted md:grid">
            <span>Date</span><span>Type</span><span>Reason</span><span>By</span><span className="text-right">In</span><span className="text-right">Out</span><span className="text-right">Balance</span>
          </div>
          <ul>
            {history.map((m) => (
              <li key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3.5 last:border-0 md:grid-cols-[1.1fr_1fr_2fr_1fr_5rem_5rem_5rem] md:px-5 md:py-3">
                <span className="text-sm"><span className="block">{fmtDate(m.date)}</span><span className="text-xs text-muted">{fmtTime(m.date)}</span></span>
                <span className="justify-self-end md:justify-self-start"><TypePill type={m.type} /></span>
                <span className="col-span-2 text-sm md:col-span-1">{m.reason}</span>
                <span className="text-xs text-muted md:text-sm">{m.userName}</span>
                <span className="num hidden text-right text-sm text-stockin md:block">{m.delta > 0 ? `+${m.delta}` : ""}</span>
                <span className="num hidden text-right text-sm text-stockout md:block">{m.delta < 0 ? `−${Math.abs(m.delta)}` : ""}</span>
                <span className="num text-right text-sm font-medium">
                  <span className={`mr-3 md:hidden ${m.delta > 0 ? "text-stockin" : "text-stockout"}`}>{m.delta > 0 ? `+${m.delta}` : `−${Math.abs(m.delta)}`}</span>
                  <span className="text-muted md:hidden">bal </span>{m.balance}
                </span>
              </li>
            ))}
          </ul>
          {!history.length && <p className="px-6 py-12 text-center text-sm text-muted">No movements yet. Record a purchase to add the first stock.</p>}
        </div>
      </section>
    </div>
  );
}
