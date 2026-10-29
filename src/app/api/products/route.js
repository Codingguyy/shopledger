import { connectDB } from "../../../lib/db.js";
import Product from "../../../models/Product.js";
import { requireUser, errorResponse } from "../../../lib/auth.js";
import { productSchema, fieldErrors } from "../../../lib/validators.js";
import { listProductsWithStock } from "../../../lib/stock.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    await connectDB();
    return Response.json({ products: await listProductsWithStock() });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req) {
  try {
    await requireUser(["owner"]);
    const parsed = productSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ error: "Check the highlighted fields", fields: fieldErrors(parsed.error) }, { status: 400 });
    await connectDB();
    const p = await Product.create(parsed.data);
    return Response.json({ id: String(p._id) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
