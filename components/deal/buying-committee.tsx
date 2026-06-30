"use client";

import { useState, useEffect } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConceptBadge } from "@/components/learn/concept-badge";
import { cn } from "@/lib/utils";
import type { DealContact, Contact, Stage, ContactRole, Sentiment } from "@/lib/supabase/types";

const ROLES: { value: ContactRole; label: string }[] = [
  { value: "economic_buyer", label: "Economic Buyer" },
  { value: "champion", label: "Champion" },
  { value: "technical_buyer", label: "Technical Buyer" },
  { value: "user_buyer", label: "User Buyer" },
  { value: "blocker", label: "Blocker" },
  { value: "influencer", label: "Influencer" },
];

const SENTIMENTS: { value: Sentiment; label: string; colour: string }[] = [
  { value: "positive", label: "Positive", colour: "text-health-green" },
  { value: "neutral", label: "Neutral", colour: "text-muted-foreground" },
  { value: "negative", label: "Negative", colour: "text-health-red" },
  { value: "unknown", label: "Unknown", colour: "text-muted-foreground" },
];

interface Props {
  dealId: string
  accountId: string
  orgId: string
  stage: Stage
  committee: DealContact[]
  onChanged: () => void
}

export function BuyingCommittee({ dealId, accountId, orgId, stage, committee, onChanged }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (createClient() as any)
        .from("contacts").select("*").eq("account_id", accountId).order("name");
      setContacts((data ?? []) as Contact[]);
    }
    load();
  }, [accountId]);

  const hasChampion = committee.some((c) => c.role === "champion");
  const hasEB = committee.some((c) => c.role === "economic_buyer");

  const needsChampionWarn = !hasChampion && ["qualifying", "proposing", "closing"].includes(stage);
  const needsEBWarn = !hasEB && ["proposing", "closing"].includes(stage);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Buying Committee
        </h3>
        <ConceptBadge slug="champion_vs_sponsor" />
      </div>

      {/* Warnings */}
      {needsEBWarn && (
        <Warning>
          No <strong>Economic Buyer</strong> in the committee. At Proposing stage you need a direct
          relationship with the person who signs off. Add them now.
        </Warning>
      )}
      {needsChampionWarn && !needsEBWarn && (
        <Warning>
          No <strong>Champion</strong> identified. Who is actively selling internally on your behalf?
        </Warning>
      )}

      {/* Committee list */}
      {committee.length > 0 && (
        <div className="divide-y divide-border rounded-md border border-border mb-3">
          {committee.map((dc) => (
            <CommitteeMember
              key={dc.id}
              dc={dc}
              onUpdate={onChanged}
            />
          ))}
        </div>
      )}

      {/* Add stakeholder */}
      {showAdd ? (
        <AddStakeholderForm
          dealId={dealId}
          accountId={accountId}
          orgId={orgId}
          contacts={contacts}
          existingIds={committee.map((c) => c.contact_id)}
          onSaved={() => { setShowAdd(false); onChanged(); }}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add stakeholder
        </button>
      )}
    </div>
  );
}

function CommitteeMember({ dc, onUpdate }: { dc: DealContact; onUpdate: () => void }) {
  const contact = dc.contact;
  const sentiment = SENTIMENTS.find((s) => s.value === dc.sentiment);

  async function updateRole(role: ContactRole) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createClient() as any).from("deal_contacts").update({ role }).eq("id", dc.id);
    onUpdate();
  }

  async function updateSentiment(sentiment: Sentiment) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createClient() as any).from("deal_contacts").update({ sentiment }).eq("id", dc.id);
    onUpdate();
  }

  async function remove() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createClient() as any).from("deal_contacts").delete().eq("id", dc.id);
    onUpdate();
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {contact?.name ?? "Unknown"}
        </p>
        {contact?.title && (
          <p className="text-xs text-muted-foreground truncate">{contact.title}</p>
        )}
      </div>

      <select
        value={dc.role}
        onChange={(e) => updateRole(e.target.value as ContactRole)}
        className="text-xs border-0 bg-transparent text-muted-foreground focus:outline-none cursor-pointer hover:text-foreground"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      <select
        value={dc.sentiment}
        onChange={(e) => updateSentiment(e.target.value as Sentiment)}
        className={cn("text-xs border-0 bg-transparent focus:outline-none cursor-pointer", sentiment?.colour)}
      >
        {SENTIMENTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <button
        onClick={remove}
        className="text-xs text-muted-foreground hover:text-health-red transition-colors ml-1"
      >
        ×
      </button>
    </div>
  );
}

function AddStakeholderForm({
  dealId, accountId, orgId, contacts, existingIds, onSaved, onCancel,
}: {
  dealId: string; accountId: string; orgId: string; contacts: Contact[]
  existingIds: string[]; onSaved: () => void; onCancel: () => void
}) {
  const [contactId, setContactId] = useState("");
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [role, setRole] = useState<ContactRole>("influencer");
  const [saving, setSaving] = useState(false);

  const available = contacts.filter((c) => !existingIds.includes(c.id));

  async function save() {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any;

    let resolvedContactId = contactId;

    // Create contact if new
    if (!contactId && newName) {
      const { data } = await db.from("contacts").insert({
        account_id: accountId,
        organization_id: orgId,
        name: newName,
        title: newTitle || null,
      }).select().single();
      resolvedContactId = data?.id;
    }

    if (resolvedContactId) {
      await db.from("deal_contacts").insert({
        deal_id: dealId,
        contact_id: resolvedContactId,
        role,
        sentiment: "unknown",
      });
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2.5">
      {available.length > 0 ? (
        <div className="space-y-2">
          <select
            value={contactId}
            onChange={(e) => { setContactId(e.target.value); setNewName(""); setNewTitle(""); }}
            className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select a contact…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.title ? ` · ${c.title}` : ""}</option>
            ))}
            <option value="__new__">+ Add new contact</option>
          </select>
          {contactId === "__new__" && (
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Name" value={newName}
                onChange={(e) => { setNewName(e.target.value); setContactId(""); }}
                className={INPUT} />
              <input type="text" placeholder="Title" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)} className={INPUT} />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Name" value={newName}
            onChange={(e) => setNewName(e.target.value)} className={INPUT} />
          <input type="text" placeholder="Title" value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)} className={INPUT} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as ContactRole)}
          className={INPUT}
        >
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <button
          onClick={save}
          disabled={saving || (!contactId && !newName)}
          className="shrink-0 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {saving ? "Adding…" : "Add"}
        </button>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 mb-3">
      <AlertTriangle className="h-3.5 w-3.5 text-health-amber shrink-0 mt-0.5" />
      <p className="text-xs text-foreground leading-relaxed">{children}</p>
    </div>
  );
}

const INPUT = "w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
