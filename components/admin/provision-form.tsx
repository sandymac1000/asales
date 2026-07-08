"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Check } from "lucide-react";

type Result = { name: string; code: string; recipient: string | null; emailed: boolean };

export function ProvisionForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
    });
    setBusy(false);
    if (!res.ok) { setError(await res.text()); return; }
    const data = (await res.json()) as Result;
    setResult(data);
    setName("");
    setEmail("");
    router.refresh(); // refresh the usage table
  }

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px] space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Organisation name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Twin Path"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex-1 min-w-[180px] space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Email invite to <span className="font-normal">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="person@company.com"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="flex items-center gap-1.5 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          {busy ? "Provisioning…" : "Provision"}
        </button>
      </form>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      {result && (
        <div className="mt-3 rounded border border-accent/30 bg-accent/5 p-3 text-xs">
          <p className="text-foreground">
            Created <span className="font-medium">{result.name}</span>. Invite code:
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="rounded bg-background px-2 py-1 font-mono text-foreground">{result.code}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(result.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1 text-accent hover:underline"
            >
              {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
          <p className="mt-2 text-muted-foreground">
            {result.recipient
              ? result.emailed
                ? `Invite emailed to ${result.recipient}.`
                : `Could not email ${result.recipient} (needs a verified Resend domain) — send them the code above manually.`
              : "Send this code to whoever should join. They enter it once at sign-in."}
          </p>
        </div>
      )}
    </div>
  );
}
