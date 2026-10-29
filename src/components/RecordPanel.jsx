"use client";
import MovementForm from "./MovementForm";

export default function RecordPanel({ products, role }) {
  return (
    <div className="max-w-xl rounded-xl2 border border-line bg-white p-5 md:p-7">
      <MovementForm products={products} role={role} />
    </div>
  );
}
