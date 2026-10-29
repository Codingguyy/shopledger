"use client";
import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { TYPE_LABEL } from "@/lib/format";

export function toast(message, kind = "ok") {
  window.dispatchEvent(new CustomEvent("ledger-toast", { detail: { message, kind, id: Math.random() } }));
}

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (e) => {
      setItems((x) => [...x, e.detail]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== e.detail.id)), 4000);
    };
    window.addEventListener("ledger-toast", on);
    return () => window.removeEventListener("ledger-toast", on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      {items.map((t) => (
        <div key={t.id} className="sheet pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg bg-teal-ink px-4 py-3 text-sm text-white shadow-lg">
          {t.kind === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-marigold" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-marigold" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="fade fixed inset-0 z-50 flex items-end justify-center bg-teal-ink/50 md:items-center md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="sheet flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white md:max-w-lg md:rounded-xl2">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-muted hover:bg-chalk">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-sm text-stockout">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function StockBadge({ status }) {
  if (status === "ok") return null;
  const cls = status === "out" ? "bg-stockout-soft text-stockout" : "bg-marigold-soft text-marigold-ink";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status === "out" ? "Out of stock" : "Low stock"}</span>;
}

export function TypePill({ type }) {
  const cls = { purchase: "bg-stockin-soft text-stockin", return: "bg-teal-soft text-teal-deep", sale: "bg-stockout-soft text-stockout", adjustment: "bg-marigold-soft text-marigold-ink" }[type];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{TYPE_LABEL[type]}</span>;
}
