"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "./ui";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) return setErrors({ ...(data.fields || {}), form: data.error });
      router.push("/");
      router.refresh();
    } catch {
      setErrors({ form: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Email" error={errors.email}>
        <input type="email" autoComplete="username" className={`input ${errors.email ? "input-error" : ""}`} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" error={errors.password}>
        <input type="password" autoComplete="current-password" className={`input ${errors.password ? "input-error" : ""}`} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {errors.form && <p role="alert" className="rounded-lg bg-stockout-soft px-3 py-2.5 text-sm text-stockout">{errors.form}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      <div className="rounded-lg border border-dashed border-line p-3 text-sm">
        <p className="mb-2 font-medium">Demo logins</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn btn-ghost flex-1" onClick={() => { setEmail("owner@shop.test"); setPassword("password123"); }}>Owner</button>
          <button type="button" className="btn btn-ghost flex-1" onClick={() => { setEmail("staff@shop.test"); setPassword("password123"); }}>Staff</button>
        </div>
      </div>
    </form>
  );
}
