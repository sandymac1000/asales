"use client";

import { useState, useEffect } from "react";
import { KeyRound, Check, Trash2, Loader2, ShieldCheck } from "lucide-react";

export function ApiKeyPanel() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [last4, setLast4] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/org/key")
      .then((r) => (r.ok ? r.json() : { hasKey: false, last4: null }))
      .then((d) => { if (active) { setHasKey(!!d.hasKey); setLast4(d.last4 ?? null); } })
      .catch(() => { if (active) setHasKey(false); });
    return () => { active = false; };
  }, []);

  async function save() {
    setBusy(true); setError(null);
    const res = await fetch("/api/org/key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: input.trim() }),
    });
    setBusy(false);
    if (!res.ok) { setError(await res.text()); return; }
    const d = await res.json();
    setHasKey(true); setLast4(d.last4); setInput(""); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function remove() {
    setBusy(true); setError(null);
    await fetch("/api/org/key", { method: "DELETE" });
    setBusy(false); setHasKey(false); setLast4(null);
  }

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold text-foreground">Anthropic API key</span>
        {hasKey === null && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      <p className="text-xs text-muted-foreground">
        The AI agents (coach, value narrative, market, qualification, debrief) run on your
        organisation&apos;s own Anthropic key, so usage is billed to you, not us. Create a key at{" "}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          console.anthropic.com
        </a>{" "}
        (this is an API key, separate from any Claude.ai plan).
      </p>

      {/* Handing an API key to someone else's software is a reasonable thing to
          be wary of. Rather than ask to be trusted, tell people how to bound
          what we could possibly do and how to check what we actually did. */}
      <details className="rounded border border-border bg-background px-3 py-2">
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          What we do with this key — and how to cap it
        </summary>
        <div className="mt-2.5 space-y-2 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Put a ceiling on it before you paste it.</span>{" "}
            In the Anthropic console, create a separate{" "}
            <a href="https://console.anthropic.com/settings/workspaces" target="_blank" rel="noreferrer" className="text-accent hover:underline">
              Workspace
            </a>
            , set a monthly spend limit on it, and create the key inside that workspace. Whatever
            happens — bug, breach, or us — that limit is the most this key can ever spend, and your
            main workspace is untouched. You set it; we cannot change it.
          </p>
          <p>
            <span className="font-medium text-foreground">Every call is something you clicked.</span>{" "}
            There are no background jobs, schedulers or agent loops. You can verify that rather
            than take our word for it: your usage graph in the Anthropic console should be flat
            whenever nobody is using Salient.
          </p>
          <p>
            <span className="font-medium text-foreground">The key is never shown again.</span>{" "}
            It is encrypted before storage, read only by the server when an agent runs, and never
            sent to the browser — this page only ever sees the last four characters. Salient
            operators can see how many deals and members an organisation has, never its key or
            its deal contents.
          </p>
          <p>
            <span className="font-medium text-foreground">Two steps to get out.</span>{" "}
            <em>Remove</em> below deletes our encrypted copy. That does not revoke the key —
            only you can do that, at{" "}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-accent hover:underline">
              console.anthropic.com
            </a>
            . Do both, in that order, and nothing of yours remains here.
          </p>
        </div>
      </details>

      {hasKey ? (
        <div className="flex items-center justify-between rounded border border-border bg-background px-3 py-2">
          <span className="flex items-center gap-2 text-xs text-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Key set · ends in <span className="font-mono">{last4}</span>
          </span>
          <button
            onClick={remove}
            disabled={busy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="sk-ant-…"
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={save}
              disabled={busy || !input.trim()}
              className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {busy ? "Saving…" : saved ? "Saved" : "Save"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Until a key is set, the AI agents are disabled for your organisation.
          </p>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
