"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { Modal, toast } from "./ui";
import ProductForm from "./ProductForm";
import MovementForm from "./MovementForm";

export default function ProductActions({ product, role, hasHistory }) {
  const router = useRouter();
  const [dialog, setDialog] = useState(null);

  async function remove() {
    if (!confirm(`Delete ${product.name}? This can't be undone.`)) return;
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast(data.error, "error");
    toast("Product deleted");
    router.push("/products");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => setDialog("move")}><ArrowLeftRight className="h-4 w-4" /> Record movement</button>
        {role === "owner" && <button className="btn btn-ghost" onClick={() => setDialog("edit")}><Pencil className="h-4 w-4" /> Edit</button>}
        {role === "owner" && !hasHistory && <button className="btn btn-danger" onClick={remove}><Trash2 className="h-4 w-4" /> Delete</button>}
      </div>
      {dialog === "move" && <Modal title="Record movement" onClose={() => setDialog(null)}><MovementForm products={[product]} role={role} defaultProductId={product.id} onDone={() => setDialog(null)} /></Modal>}
      {dialog === "edit" && <Modal title="Edit product" onClose={() => setDialog(null)}><ProductForm product={product} onDone={() => setDialog(null)} /></Modal>}
    </>
  );
}
