import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDB } from "./db.js";
import User from "../models/User.js";

export const COOKIE = "ledger_session";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "");

export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export async function signSession(userId) {
  return new SignJWT({ uid: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.uid;
  } catch {
    return null;
  }
}
export async function getCurrentUser() {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is not set. Copy .env.example to .env");
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const uid = await verifySession(token);
  if (!uid) return null;
  await connectDB();
  const u = await User.findById(uid).lean();
  return u ? { id: String(u._id), name: u.name, email: u.email, role: u.role } : null;
}
export async function requireUser(roles) {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please log in to continue");
  if (roles && !roles.includes(user.role)) throw new HttpError(403, "Only the shop owner can do this");
  return user;
}
export function errorResponse(e) {
  if (e instanceof HttpError) return Response.json({ error: e.message, fields: e.fields }, { status: e.status });
  if (e?.status && e?.message) return Response.json({ error: e.message }, { status: e.status });
  if (e?.code === 11000) return Response.json({ error: "That SKU is already used by another product", fields: { sku: "SKU already exists" } }, { status: 409 });
  console.error(e);
  return Response.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
}
