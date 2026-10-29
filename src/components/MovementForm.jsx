"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, toast } from "./ui";
import { TYPE_LABEL } from "@/lib/format";

const ALLOWED = { owner: ["sale", "purchase", "return", "adjustment"], staff: ["sale", "return"] };
const REASONS = {
  sale: ["Counter sale", "Online order", "Bulk order"],
  purchase: ["Restock from supplier", "Opening stock"],
  return: ["Customer return", "Wrong item billed"],
  adjustment: ["Stock count correction", "Damaged goods", "Expired"],
};
const HELP = {
  sale: "Removes stock",
  purchase: "Adds stock",
  return: "Adds stock back",
  adjustment: "Use + to add, - to remove",
};

export default function MovementForm({ products, role, defaultProductId, defaultType, onDone }) {
  const router = useRouter();
  const types = ALLOWED[role] ?? ALLOWED.staff;
  const [productId, setProductId] = useState(defaultProductId ?? products[0]?.id ?? "");
  const [type, setType] = useState(defaultType && types.includes(defaultType) ? defaultType : types[0]);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDate(d);
    setMaxDate(d);
  }, []);

  const product = products.find((p) => p.id === productId);
  const q = Number(quantity);
  const delta = !quantity || Number.isNaN(q) ? 0 : type === "sale" ? -Math.abs(q) : type === "adjustment" ? q : Math.abs(q);
  const after = product ? product.stock + delta : 0;
  const wouldGoNegative = product && delta !== 0 && after < 0;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, type, quantity, reason, date: date ? new Date(date).toISOString() : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ ...(data.fields || {}), form: data.error });
        return;
      }
      toast(`${TYPE_LABEL[type]} recorded: ${product?.name}`);
      setQuantity("");
      setReason("");
      router.refresh();
      onDone?.();
    } catch {
      setErrors({ form: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  if (!products.length) return <p className="text-sm text-muted">Add a product first, then you can record stock movements.</p>;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Product" error={errors.productId}>
        <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium">What happened?</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
          {types.map((t) => (
            <button type="button" key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)} className={`min-h-[44px] rounded-lg border px-2 text-sm transition-colors ${type === t ? "border-teal-ink bg-teal-ink text-white" : "border-line bg-white hover:bg-teal-soft/60"}`}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        {role === "staff" && <p className="mt-1.5 text-xs text-muted">Staff can record sales and returns. Ask the owner for purchases and adjustments.</p>}
      </div>

      <Field label="Quantity" error={errors.quantity} hint={HELP[type]}>
        <input className={`input num ${errors.quantity ? "input-error" : ""}`} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={type === "adjustment" ? "e.g. -2 or 5" : "e.g. 3"} />
      </Field>

      {product && delta !== 0 && (
        <div className={`rounded-lg px-3 py-2.5 text-sm ${wouldGoNegative ? "bg-stockout-soft text-stockout" : "bg-teal-soft text-teal-ink"}`}>
          {wouldGoNegative ? (
            <>Only <b className="num">{product.stock}</b> {product.unit} in stock. This would take it below zero.</>
          ) : (
            <>Stock goes from <b className="num">{product.stock}</b> to <b className="num">{after}</b> {product.unit}</>
          )}
        </div>
      )}

      <Field label="Reason" error={errors.reason}>
        <input className={`input ${errors.reason ? "input-error" : ""}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Short note for the ledger" maxLength={200} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REASONS[type].map((r) => (
            <button type="button" key={r} onClick={() => setReason(r)} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:bg-teal-soft/60">
              {r}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Date and time" error={errors.date}>
        <input type="datetime-local" className={`input ${errors.date ? "input-error" : ""}`} value={date} max={maxDate} onChange={(e) => setDate(e.target.value)} />
      </Field>

      {errors.form && <p role="alert" className="rounded-lg bg-stockout-soft px-3 py-2.5 text-sm text-stockout">{errors.form}</p>}

      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : `Record ${TYPE_LABEL[type].toLowerCase()}`}
      </button>
    </form>
  );
}
