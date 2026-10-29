"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, toast } from "./ui";

export default function ProductForm({ product, onDone }) {
  const router = useRouter();
  const [v, setV] = useState({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    category: product?.category ?? "",
    unit: product?.unit ?? "pcs",
    price: product?.price ?? "",
    lowStockThreshold: product?.lowStockThreshold ?? 5,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch(product ? `/api/products/${product.id}` : "/api/products", {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const data = await res.json();
      if (!res.ok) return setErrors({ ...(data.fields || {}), form: data.error });
      toast(product ? "Product saved" : "Product added. Record a purchase to put stock on the shelf.");
      router.refresh();
      onDone?.(data);
    } catch {
      setErrors({ form: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const f = (k, label, props = {}, hint) => (
    <Field label={label} error={errors[k]} hint={hint}>
      <input className={`input ${errors[k] ? "input-error" : ""} ${props.mono ? "num" : ""}`} value={v[k]} onChange={set(k)} {...props.input} />
    </Field>
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {f("sku", "SKU", { input: { placeholder: "RICE-5K" }, mono: true })}
        {f("name", "Name", { input: { placeholder: "Basmati rice 5 kg" } })}
        {f("category", "Category", { input: { placeholder: "Grocery" } })}
        {f("unit", "Unit", { input: { placeholder: "pcs, kg, bag" } })}
        {f("price", "Price (₹)", { input: { inputMode: "decimal", placeholder: "0" }, mono: true })}
        {f("lowStockThreshold", "Low-stock threshold", { input: { inputMode: "numeric" }, mono: true }, "Warn when stock falls to this level")}
      </div>
      {!product && <p className="text-xs text-muted">Stock starts at 0. It only changes when you record a movement.</p>}
      {errors.form && <p role="alert" className="rounded-lg bg-stockout-soft px-3 py-2.5 text-sm text-stockout">{errors.form}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : product ? "Save changes" : "Add product"}</button>
    </form>
  );
}
