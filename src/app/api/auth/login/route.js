import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "../../../../lib/db.js";
import User from "../../../../models/User.js";
import { COOKIE, signSession, errorResponse } from "../../../../lib/auth.js";
import { loginSchema, fieldErrors } from "../../../../lib/validators.js";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Check the highlighted fields", fields: fieldErrors(parsed.error) }, { status: 400 });
    await connectDB();
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
    const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
    if (!ok) return Response.json({ error: "Wrong email or password" }, { status: 401 });
    cookies().set(COOKIE, await signSession(user._id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
