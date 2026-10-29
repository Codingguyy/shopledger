import LoginForm from "@/components/LoginForm";

const sample = [
  { d: "Counter sale", q: -3, b: 37 },
  { d: "Restock from supplier", q: 24, b: 40 },
  { d: "Customer return", q: 1, b: 16 },
  { d: "Counter sale", q: -2, b: 15 },
];

export default function Login() {
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-teal-ink p-12 text-white md:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-marigold font-display text-lg font-bold text-teal-ink">L</span>
          <span className="font-display text-xl font-semibold">Shop Ledger</span>
        </div>
        <div>
          <h1 className="max-w-md text-5xl font-semibold leading-[1.05]">Stock you can trace, line by line.</h1>
          <p className="mt-4 max-w-sm text-white/70">Nothing is typed in as a stock level. Every sale, purchase and return is a ledger entry, and the balance follows.</p>
          <div className="mt-10 max-w-md divide-y divide-white/15 rounded-xl border border-white/15 bg-white/5 text-sm" aria-hidden>
            {sample.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3">
                <span className="text-white/80">{r.d}</span>
                <span className={`num w-10 text-right ${r.q > 0 ? "text-emerald-300" : "text-marigold"}`}>{r.q > 0 ? `+${r.q}` : r.q}</span>
                <span className="num w-10 text-right text-white/60">{r.b}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-white/50">Owner and staff roles, checked on the server.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-marigold font-display text-lg font-bold text-teal-ink">L</span>
            <span className="font-display text-xl font-semibold">Shop Ledger</span>
          </div>
          <h2 className="mb-1 text-2xl font-semibold">Log in</h2>
          <p className="mb-6 text-sm text-muted">Use the account the shop owner gave you.</p>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
