import { connectDB } from "../../../lib/db.js";
import { requireUser, errorResponse } from "../../../lib/auth.js";
import { listProductsWithStock, stockStatus } from "../../../lib/stock.js";

const esc = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Owner only: stock report as CSV
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser(["owner"]);
    await connectDB();
    const rows = await listProductsWithStock();
    const head = ["SKU", "Name", "Category", "Unit", "Price", "Stock", "Low-stock threshold", "Status", "Stock value"];
    const lines = rows.map((p) => [p.sku, p.name, p.category, p.unit, p.price, p.stock, p.lowStockThreshold, stockStatus(p), (p.price * p.stock).toFixed(2)].map(esc).join(","));
    return new Response([head.join(","), ...lines].join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="stock-report-${new Date().toISOString().slice(0, 10)}.csv"` },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
