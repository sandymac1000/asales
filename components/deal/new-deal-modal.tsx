"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ConceptBadge } from "@/components/learn/concept-badge";
import { useOrg } from "@/lib/hooks/use-org";
import type { Account, Contact } from "@/lib/supabase/types";

interface Props {
  onClose: () => void
  prefillAccountId?: string
}

export function NewDealModal({ onClose, prefillAccountId }: Props) {
  const router = useRouter();
  const { org } = useOrg();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountId, setAccountId] = useState(prefillAccountId ?? "");
  const [newAccountName, setNewAccountName] = useState("");
  const [dealName, setDealName] = useState("");
  const [ebContactId, setEbContactId] = useState("");
  const [newEbName, setNewEbName] = useState("");
  const [newEbTitle, setNewEbTitle] = useState("");
  const [pain, setPain] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [acvValue, setAcvValue] = useState("");

  useEffect(() => {
    async function loadAccounts() {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from("accounts").select("*").order("name");
      setAccounts((data ?? []) as Account[]);
    }
    loadAccounts();
  }, []);

  useEffect(() => {
    async function loadContacts() {
      if (!accountId) { setContacts([]); return; }
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from("contacts").select("*").eq("account_id", accountId).order("name");
      setContacts((data ?? []) as Contact[]);
    }
    loadContacts();
  }, [accountId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      // Resolve the account. A real selection is a UUID; "__new__" (from the
      // dropdown) or "" (bare-input branch when the org has no accounts yet)
      // both mean "create from the typed name".
      let resolvedAccountId = accountId;
      if (accountId === "__new__" || accountId === "") {
        const name = newAccountName.trim();
        if (!name) throw new Error("Enter a company name");
        const { data: newAccount, error: accountError } = await db
          .from("accounts")
          .insert({ name, organization_id: org.id })
          .select()
          .single();
        if (accountError) throw new Error("Failed to create account");
        resolvedAccountId = newAccount.id;
      }

      // Resolve the EB: an existing contact, or create one from the typed
      // fields. Never let the "__new__" sentinel reach the deal insert.
      let resolvedEbId: string | null =
        ebContactId && ebContactId !== "__new__" ? ebContactId : null;
      if (!resolvedEbId && newEbName.trim()) {
        const { data: newContact, error: contactError } = await db
          .from("contacts")
          .insert({
            name: newEbName.trim(),
            title: newEbTitle.trim() || null,
            account_id: resolvedAccountId,
            organization_id: org.id,
          })
          .select()
          .single();
        if (contactError) throw new Error("Failed to create contact");
        resolvedEbId = newContact.id;
      }

      // Create deal
      const { data: deal, error: dealError } = await db
        .from("deals")
        .insert({
          organization_id: org.id,
          account_id: resolvedAccountId,
          name: dealName,
          stage: "exploring",
          economic_buyer_contact_id: resolvedEbId,
          pain: pain || null,
          success_criteria: successCriteria || null,
          next_action: nextAction || null,
          next_action_date: nextActionDate || null,
          acv_value: acvValue ? Math.round(parseFloat(acvValue) * 100) : null,
        })
        .select()
        .single();

      if (dealError) throw new Error("Failed to create deal");

      // Add EB to buying committee if present
      if (resolvedEbId && deal) {
        await db.from("deal_contacts").insert({
          deal_id: deal.id,
          contact_id: resolvedEbId,
          role: "economic_buyer",
        });
      }

      router.push(`/pipeline/${deal.id}`);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">New deal</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Value narrative nudge — shown when product_context not set */}
        {!org?.product_context && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-md border border-accent/30 bg-accent/5 px-3.5 py-3">
            <Sparkles className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-foreground font-medium">Before you go deep on this deal</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Have you defined your value narrative? It takes 10 minutes and makes every coaching session sharper.{" "}
                <Link href="/settings" className="text-accent hover:underline" onClick={onClose}>
                  Do it first →
                </Link>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Account */}
          <Field label="Company" required>
            {accounts.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={accountId}
                  onChange={(e) => { setAccountId(e.target.value); setNewAccountName(""); }}
                  className={INPUT}
                >
                  <option value="">Select a company…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                  <option value="__new__">+ Add new company</option>
                </select>
                {accountId === "__new__" && (
                  <input
                    type="text"
                    placeholder="Company name"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className={INPUT}
                    autoFocus
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Company name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className={INPUT}
                required
              />
            )}
          </Field>

          {/* Deal name */}
          <Field label="Deal name" required>
            <input
              type="text"
              placeholder="e.g. Acme Corp — AI Data Pipeline"
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              className={INPUT}
              required
            />
          </Field>

          {/* Economic buyer */}
          <Field
            label="Economic buyer"
            badge={<ConceptBadge slug="economic_buyer" />}
          >
            {contacts.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={ebContactId}
                  onChange={(e) => { setEbContactId(e.target.value); setNewEbName(""); setNewEbTitle(""); }}
                  className={INPUT}
                >
                  <option value="">Select a contact…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.title ? ` · ${c.title}` : ""}
                    </option>
                  ))}
                  <option value="__new__">+ Add new contact</option>
                </select>
                {ebContactId === "__new__" && <NewContactFields
                  name={newEbName} setName={setNewEbName}
                  title={newEbTitle} setTitle={setNewEbTitle}
                />}
              </div>
            ) : (
              <NewContactFields
                name={newEbName} setName={setNewEbName}
                title={newEbTitle} setTitle={setNewEbTitle}
              />
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              The person who controls budget and makes the final call. If you
              don&apos;t know yet, leave blank — but finding them is your first task.
            </p>
          </Field>

          {/* Pain */}
          <Field
            label="Pain"
            badge={<ConceptBadge slug="pain" />}
          >
            <textarea
              placeholder="In one sentence: the business problem that costs them if unsolved."
              value={pain}
              onChange={(e) => setPain(e.target.value)}
              className={`${INPUT} resize-none`}
              rows={2}
            />
          </Field>

          {/* Success criteria */}
          <Field
            label="Success criteria"
            badge={<ConceptBadge slug="success_criteria" />}
          >
            <textarea
              placeholder="What does the EB need to see to say yes?"
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
              className={`${INPUT} resize-none`}
              rows={2}
            />
          </Field>

          {/* Next action */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Next action"
              badge={<ConceptBadge slug="next_action" />}
            >
              <input
                type="text"
                placeholder="Specific step, owned, dated"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="By when">
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className={INPUT}
              />
            </Field>
          </div>

          {/* ACV */}
          <Field label="ACV (£)">
            <input
              type="number"
              placeholder="Annual contract value"
              value={acvValue}
              onChange={(e) => setAcvValue(e.target.value)}
              className={INPUT}
              min="0"
              step="1000"
            />
          </Field>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                !dealName.trim() ||
                !((accountId && accountId !== "__new__") || newAccountName.trim())
              }
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Creating…" : "Create deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  badge,
  children,
}: {
  label: string
  required?: boolean
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        {badge}
      </div>
      {children}
    </div>
  );
}

function NewContactFields({
  name, setName, title, setTitle,
}: {
  name: string; setName: (v: string) => void
  title: string; setTitle: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input
        type="text"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={INPUT}
      />
      <input
        type="text"
        placeholder="Job title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={INPUT}
      />
    </div>
  );
}

const INPUT = `
  w-full rounded-md border border-border bg-background px-3 py-2
  text-sm text-foreground placeholder:text-muted-foreground
  focus:outline-none focus:ring-2 focus:ring-ring
  disabled:opacity-50
`.trim();
