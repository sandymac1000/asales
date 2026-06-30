"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const SIZE_BANDS = ["1-50", "51-200", "201-1000", "1001+"] as const;

interface Account {
  id: string
  name: string
  domain: string | null
  industry: string | null
  size_band: string | null
  notes: string | null
}

export function AccountHeader({ account }: { account: Account }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...account });
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createClient() as any;

  async function save() {
    setSaving(true);
    await db.from("accounts").update({
      name: draft.name.trim() || account.name,
      domain: draft.domain?.trim() || null,
      industry: draft.industry?.trim() || null,
      size_band: draft.size_band || null,
      notes: draft.notes?.trim() || null,
    }).eq("id", account.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  function cancel() {
    setDraft({ ...account });
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">{account.name}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            {account.domain && <p className="text-sm text-muted-foreground">{account.domain}</p>}
            {account.industry && <p className="text-sm text-muted-foreground">{account.industry}</p>}
            {account.size_band && <p className="text-sm text-muted-foreground">{account.size_band} people</p>}
          </div>
          {account.notes && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-lg">{account.notes}</p>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          title="Edit account"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Company name *</label>
          <input
            autoFocus
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Domain</label>
          <input
            type="text"
            value={draft.domain ?? ""}
            placeholder="acme.com"
            onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value }))}
            className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Industry</label>
          <input
            type="text"
            value={draft.industry ?? ""}
            placeholder="e.g. Life Sciences"
            onChange={(e) => setDraft((d) => ({ ...d, industry: e.target.value }))}
            className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Company size</label>
          <select
            value={draft.size_band ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, size_band: e.target.value || null }))}
            className={cn(
              "w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
              !draft.size_band ? "text-muted-foreground" : "text-foreground"
            )}
          >
            <option value="">— select —</option>
            {SIZE_BANDS.map((b) => (
              <option key={b} value={b}>{b} people</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <textarea
            value={draft.notes ?? ""}
            rows={2}
            placeholder="Context about this account…"
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving || !draft.name.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Check className="h-3 w-3" />
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={cancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}
