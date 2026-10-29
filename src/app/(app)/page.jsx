import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import Movement from "@/models/Movement";
import { listProductsWithStock, stockStatus, dailyFlow } from "@/lib/stock";
import { inr, num, fmtDate, fmtTime } from "@/lib/format";
import { TypePill, StockBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getCurrentUser();
  const [products, flow, recent] = await Promise.all([listProductsWithStock(), dailyFlow(14), Movement.find().sort({ date: -1, createdAt: -1 }).limit(8).lean()]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const low = products.filter((p) => stockStatus(p) !== "ok").sort((a, b) => a.stock / (a.lowStockThreshold || 1) - b.stock / (b.lowStockThreshold || 1));
  const units = products.reduce((s, p) => s + p.stock, 0);
  const value = products.reduce((s, p) => s + p.stock * p.price, 0);
  const max = Math.max(1, ...flow.flatMap((d) => [d.in, d.out]));
  const hour = new Date().getUTCHours() + 5.5;
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Stock value", value: inr(value) },
    { label: "Units on shelf", value: num(units) },
    { label: "Products", value: num(products.length) },
    { label: "Need restocking", value: num(low.length), warn: low.length > 0 },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">{greet}, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-muted">{low.length ? `${low.length} product${low.length > 1 ? "s" : ""} need restocking.` : "Everything is stocked above its threshold."}</p>
      </header>

      <dl className="grid grid-cols-2 gap-y-6 border-y border-line py-6 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-0 md:px-6 ${i > 0 ? "md:border-l md:border-line" : "md:pl-0"} ${i % 2 === 1 ? "pl-6" : ""}`}>
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className={`num mt-1 text-2xl font-semibold md:text-3xl ${s.warn ? "text-marigold-ink" : ""}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="flow">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="flow" className="text-xl font-semibold">Last 14 days</h2>
          <div className="flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-stockin" /> Units in</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-marigold" /> Units out</span>
          </div>
        </div>
        <div className="rounded-xl2 border border-line bg-white p-4 md:p-6">
          <div className="flex h-40 items-end gap-1.5 md:gap-3" role="img" aria-label="Units in and out per day over the last 14 days">
            {flow.map((d, i) => (
              <div key={d.day} className="flex h-full flex-1 items-end justify-center gap-0.5" title={`${d.day}: ${d.in} in, ${d.out} out`}>
                <div className="bar w-full max-w-[14px] rounded-t bg-stockin" style={{ height: `${(d.in / max) * 100}%`, minHeight: d.in ? 3 : 0, animationDelay: `${i * 30}ms` }} />
                <div className="bar w-full max-w-[14px] rounded-t bg-marigold" style={{ height: `${(d.out / max) * 100}%`, minHeight: d.out ? 3 : 0, animationDelay: `${i * 30 + 15}ms` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{fmtDate(flow[0].day)}</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="low">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="low" className="text-xl font-semibold">Running low</h2>
            <Link href="/low-stock" className="text-sm font-medium text-teal-mid hover:underline">See all</Link>
          </div>
          <ul className="divide-y divide-line rounded-xl2 border border-line bg-white">
            {low.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-chalk">
                  <span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="num text-xs text-muted">{p.sku}</span></span>
                  <span className="flex items-center gap-2"><StockBadge status={stockStatus(p)} /><span className="num text-sm">{p.stock} {p.unit}</span></span>
                </Link>
              </li>
            ))}
            {!low.length && <li className="px-4 py-8 text-center text-sm text-muted">Nothing is below its threshold.</li>}
          </ul>
        </section>

        <section aria-labelledby="recent">
          <h2 id="recent" className="mb-4 text-xl font-semibold">Latest movements</h2>
          <ul className="divide-y divide-line rounded-xl2 border border-line bg-white">
            {recent.map((m) => (
              <li key={m._id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <Link href={`/products/${m.product}`} className="block truncate font-medium hover:underline">{byId.get(String(m.product))?.name ?? "Deleted product"}</Link>
                  <span className="text-xs text-muted">{fmtDate(m.date)}, {fmtTime(m.date)} · {m.userName}</span>
                </span>
                <span className="flex items-center gap-2"><TypePill type={m.type} /><span className={`num w-10 text-right text-sm font-medium ${m.delta > 0 ? "text-stockin" : "text-stockout"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span></span>
              </li>
            ))}
            {!recent.length && <li className="px-4 py-8 text-center text-sm text-muted">No movements yet. Record a purchase to get started.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
