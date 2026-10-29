import mongoose from "mongoose";
import { connectDB } from "../../../../lib/db.js";
import Product from "../../../../models/Product.js";
import Movement from "../../../../models/Movement.js";
import { requireUser, errorResponse, HttpError } from "../../../../lib/auth.js";
import { productSchema, fieldErrors } from "../../../../lib/validators.js";

function checkId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Product not found");
}

// Owner only: edit product details (stock itself can never be edited here)
export async function PUT(req, { params }) {
  try {
    await requireUser(["owner"]);
    checkId(params.id);
    const parsed = productSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ error: "Check the highlighted fields", fields: fieldErrors(parsed.error) }, { status: 400 });
    await connectDB();
    const p = await Product.findByIdAndUpdate(params.id, parsed.data, { new: true });
    if (!p) throw new HttpError(404, "Product not found");
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

// Owner only. Products with history can't be deleted: the ledger must stay intact.
export async function DELETE(_req, { params }) {
  try {
    await requireUser(["owner"]);
    checkId(params.id);
    await connectDB();
    if (await Movement.exists({ product: params.id })) throw new HttpError(409, "This product has movement history and can't be deleted");
    const r = await Product.findByIdAndDelete(params.id);
    if (!r) throw new HttpError(404, "Product not found");
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
