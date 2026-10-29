import { connectDB } from "../../../lib/db.js";
import { requireUser, errorResponse } from "../../../lib/auth.js";
import { movementSchema, fieldErrors } from "../../../lib/validators.js";
import { recordMovement } from "../../../lib/stock.js";

// Owner: all types. Staff: sale + return only (enforced inside recordMovement as well).
export async function POST(req) {
  try {
    const user = await requireUser();
    const parsed = movementSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ error: "Check the highlighted fields", fields: fieldErrors(parsed.error) }, { status: 400 });
    await connectDB();
    const m = await recordMovement({ ...parsed.data, user });
    return Response.json({ id: String(m._id), delta: m.delta }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
