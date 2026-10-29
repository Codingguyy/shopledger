import { cookies } from "next/headers";
import { COOKIE } from "../../../../lib/auth.js";

export async function POST() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
