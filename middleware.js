import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Page-level gate only (redirects to /login). Every API route re-checks auth + role on the server.
export async function middleware(req) {
  const token = req.cookies.get("ledger_session")?.value;
  let ok = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET || ""));
      ok = true;
    } catch {}
  }
  const { pathname } = req.nextUrl;
  if (!ok && pathname !== "/login") return NextResponse.redirect(new URL("/login", req.url));
  if (ok && pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
