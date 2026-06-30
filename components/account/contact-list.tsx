"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Mail, Phone, MessageCircle, Link2, StickyNote, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Contact } from "@/lib/supabase/types";

const EMPTY: Partial<Contact> = {
  name: "", title: "", email: "", phone: "", whatsapp: "", linkedin_url: "", referred_by: "", notes: "",
};

export function ContactList({
  contacts, accountId, orgId,
}: {
  contacts: Contact[];
  accountId: string;
  orgId: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, Partial<Contact>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>(EMPTY);
  const [adding, setAdding] = useState(false);

  function toggle(id: string, contact: Contact) {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      setEditing((e) => ({ ...e, [id]: { ...contact } }));
    }
  }

  async function save(id: string) {
    setSaving(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createClient() as any).from("contacts").update(editing[id]).eq("id", id);
    setSaving(null);
    setExpanded(null);
    router.refresh();
  }

  async function addContact() {
    if (!newContact.name?.trim()) return;
    setAdding(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createClient() as any).from("contacts").insert({
      ...newContact,
      account_id: accountId,
      organization_id: orgId,
    });
    setAdding(false);
    setShowAdd(false);
    setNewContact(EMPTY);
    router.refresh();
  }

  return (
    <div>
      {contacts.length > 0 && (
        <div className="divide-y divide-border rounded-md border border-border mb-3">
          {contacts.map((c) => {
            const open = expanded === c.id;
            const draft = editing[c.id] ?? c;
            return (
              <div key={c.id}>
                {/* Row header */}
                <button
                  onClick={() => toggle(c.id, c)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[c.title, c.email, c.referred_by ? `via ${c.referred_by}` : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {c.phone && <Phone className="h-3.5 w-3.5 text-muted-foreground" />}
                    {c.whatsapp && <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                    {c.linkedin_url && <Link2 className="h-3.5 w-3.5 text-muted-foreground" />}
                    {open
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded edit form */}
                {open && (
                  <div className="px-4 pb-4 pt-1 bg-muted/30 space-y-3 border-t border-border">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Name" value={draft.name ?? ""} onChange={(v) => setEditing((e) => ({ ...e, [c.id]: { ...e[c.id], name: v } }))} required />
                      <Field label="Title / Role" value={draft.title ?? ""} onChange={(v) => setEditing((e) => ({ ...e, [c.id]: { ...e[c.id], title: v } }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Email" value={draft.email ?? ""} onChange={(v) => setEditing((e) => ({ ...e, [c.id]: { ...e[c.id], email: v } }))} icon={<Mail className="h-3 w-3" />} />
                      <Field label="Phone" value={draft.phone ?? ""} onChange={(v) => setEditing((e) => ({ ...e, [c.id]: { ...e[c.id], phone: v } }))} icon={<Phone className="h-3 w-3" />} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="WhatsApp" value={draft.whatsapp ?? ""} onChange={(v) => setEditing((e) => ({ ...e, [c.id]: { ...e[c.id], whatsapp: v } }))} icon={<MessageCircle className="h-3 w-3" />} />
                      <Field label="LinkedIn URL" value={draft.linkedin_url ?? ""} onChange={(v) => setEditing((e) => ({ ...e, [c.id]: { ...e[c.id], linkedin_url: v } }))} icon={<Link2 className="h-3 w-3" />} />
                    </div>
                    <Field label="Referred / introduced by" value={draft.referred_by ?? ""} onChange={(v) => setEditing((e) => ({ ...e, [c.id]: { ...e[c.id], referred_by: v } }))} icon={<Users className="h-3 w-3" />} />
                    <Field label="Notes" value={draft.notes ?? ""} onChange={(v) => setEditing((e) => ({ ...e, [c.id]: { ...e[c.id], notes: v } }))} multiline icon={<StickyNote className="h-3 w-3" />} />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => save(c.id)}
                        disabled={saving === c.id}
                        className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {saving === c.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setExpanded(null)}
                        className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new contact */}
      {showAdd ? (
        <div className="rounded-md border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New contact</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name *" value={newContact.name ?? ""} onChange={(v) => setNewContact((n) => ({ ...n, name: v }))} required />
            <Field label="Title / Role" value={newContact.title ?? ""} onChange={(v) => setNewContact((n) => ({ ...n, title: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Email" value={newContact.email ?? ""} onChange={(v) => setNewContact((n) => ({ ...n, email: v }))} icon={<Mail className="h-3 w-3" />} />
            <Field label="Phone" value={newContact.phone ?? ""} onChange={(v) => setNewContact((n) => ({ ...n, phone: v }))} icon={<Phone className="h-3 w-3" />} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="WhatsApp" value={newContact.whatsapp ?? ""} onChange={(v) => setNewContact((n) => ({ ...n, whatsapp: v }))} icon={<MessageCircle className="h-3 w-3" />} />
            <Field label="LinkedIn URL" value={newContact.linkedin_url ?? ""} onChange={(v) => setNewContact((n) => ({ ...n, linkedin_url: v }))} icon={<Link2 className="h-3 w-3" />} />
          </div>
          <Field label="Referred / introduced by" value={newContact.referred_by ?? ""} onChange={(v) => setNewContact((n) => ({ ...n, referred_by: v }))} icon={<Users className="h-3 w-3" />} />
          <div className="flex gap-2">
            <button
              onClick={addContact}
              disabled={adding || !newContact.name?.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {adding ? "Adding…" : "Add contact"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewContact(EMPTY); }}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add contact
        </button>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, required, multiline, icon,
}: {
  label: string; value: string; onChange: (v: string) => void
  required?: boolean; multiline?: boolean; icon?: React.ReactNode
}) {
  const cls = "w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  return (
    <div>
      <label className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        {icon}{label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className={`${cls} resize-none`}
          required={required}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          required={required}
        />
      )}
    </div>
  );
}
