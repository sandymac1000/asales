"use client";

import { useState } from "react";
import { UserMinus } from "lucide-react";

export function RemoveUser() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    const target = email.trim();
    if (!target) return;
    if (!confirm(`Remove the account ${target}? They lose access immediately and can be re-invited fresh.`)) return;
    setBusy(true); setMsg(null); setErr(null);
    const res = await fetch("/api/admin/manage", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_user", email: target }),
    });
    setBusy(false);
    if (res.ok) { setMsg(`Removed ${target}.`); setEmail(""); }
    else { setErr(await res.text()); }
  }

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <UserMinus className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold text-foreground">Remove a user</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Deletes an account by email — including limbo/unconfirmed ones stuck mid sign-in. They can then be invited again from scratch.
      </p>
      <form onSubmit={remove} className="flex flex-wrap items-end gap-3">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="person@company.com"
          className="flex-1 min-w-[200px] rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit" disabled={busy || !email.trim()}
          className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {busy ? "Removing…" : "Remove"}
        </button>
      </form>
      {msg && <p className="mt-2 text-xs text-emerald-600">{msg}</p>}
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </div>
  );
}
