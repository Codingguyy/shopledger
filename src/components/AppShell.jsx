"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Boxes, AlertTriangle, ArrowLeftRight, LogOut } from "lucide-react";

export default function AppShell({ user, lowCount, children }) {
  const path = usePathname();
  const router = useRouter();
  const nav = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Boxes },
    { href: "/low-stock", label: "Low stock", icon: AlertTriangle, badge: lowCount },
    { href: "/movements", label: "Record", icon: ArrowLeftRight },
  ];
  const active = (h) => (h === "/" ? path === "/" : path.startsWith(h));
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  const Brand = (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-marigold font-display text-lg font-bold text-teal-ink">L</span>
      <span className="font-display text-xl font-semibold tracking-tight">Shop Ledger</span>
    </div>
  );
  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-teal-ink px-4 py-6 text-white md:sticky md:top-0 md:flex md:h-dvh">
        <div className="px-2">{Brand}</div>
        <nav className="mt-10 flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active(href) ? "bg-white/10 font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
              {active(href) && <span className="absolute -left-4 top-2 h-6 w-1 rounded-r bg-marigold" />}
              <Icon className="h-[18px] w-[18px]" />
              {label}
              {badge > 0 && <span className="num ml-auto rounded-full bg-marigold px-2 text-xs font-semibold text-teal-ink">{badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl bg-white/5 p-3">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs text-white/60">{user.role === "owner" ? "Owner · full access" : "Staff · sales and returns"}</p>
          <button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-teal-ink px-4 py-3 text-white md:hidden">
        {Brand}
        <button onClick={logout} aria-label="Log out" className="rounded-md p-2 text-white/80 hover:bg-white/10">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {nav.map(({ href, label, icon: Icon, badge }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-xs ${active(href) ? "font-semibold text-teal-ink" : "text-muted"}`}>
            {active(href) && <span className="absolute top-0 h-0.5 w-10 bg-marigold" />}
            <span className="relative">
              <Icon className="h-5 w-5" />
              {badge > 0 && <span className="num absolute -right-3 -top-2 rounded-full bg-marigold px-1.5 text-[10px] font-bold text-teal-ink">{badge}</span>}
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
