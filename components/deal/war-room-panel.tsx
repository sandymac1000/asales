"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Plus, Check, Calendar, User, Trash2, Swords, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatDate, isOverdue } from "@/lib/format";
import type { DealAction, Stage } from "@/lib/supabase/types";

// ── Tactics taxonomy ─────────────────────────────────────────────────────────

interface TacticCategory {
  id: string
  label: string
  items: { id: string; label: string }[]
}

const TACTIC_CATEGORIES: TacticCategory[] = [
  {
    id: "access",
    label: "Access & multi-threading",
    items: [
      { id: "pincer", label: "Pincer motion" },
      { id: "multithread", label: "Multi-threading" },
      { id: "coalition", label: "Coalition building" },
      { id: "eb_isolation", label: "EB isolation" },
      { id: "lateral_referral", label: "Lateral referral" },
    ],
  },
  {
    id: "champion",
    label: "Champion enablement",
    items: [
      { id: "talk_track", label: "Arm with talk track" },
      { id: "biz_case", label: "Business case co-creation" },
      { id: "objection_prep", label: "Objection pre-loading" },
      { id: "selling_kit", label: "Internal selling kit" },
    ],
  },
  {
    id: "urgency",
    label: "Urgency & compelling event",
    items: [
      { id: "compelling_event", label: "Compelling event anchor" },
      { id: "cost_inaction", label: "Cost of inaction" },
      { id: "competitive_signal", label: "Competitive pressure signal" },
      { id: "capacity_scarcity", label: "Capacity scarcity" },
      { id: "eoq_pressure", label: "EoQ / price protection" },
    ],
  },
  {
    id: "proof",
    label: "Proof & credibility",
    items: [
      { id: "peer_reference", label: "Peer reference call" },
      { id: "site_visit", label: "Reference site visit" },
      { id: "poc", label: "Structured POC" },
      { id: "analyst", label: "Analyst validation" },
      { id: "lighthouse", label: "Lighthouse introduction" },
    ],
  },
  {
    id: "process",
    label: "Process control",
    items: [
      { id: "map", label: "Mutual action plan" },
      { id: "procurement_early", label: "Procurement pre-engagement" },
      { id: "criteria_ownership", label: "Decision criteria ownership" },
      { id: "legal_preread", label: "Legal pre-read" },
    ],
  },
  {
    id: "commercial",
    label: "Commercial structure",
    items: [
      { id: "land_expand", label: "Land & expand framing" },
      { id: "phased_contract", label: "Phased contract" },
      { id: "multiyear", label: "Multi-year trade" },
      { id: "budget_hunt", label: "Alternative budget hunting" },
      { id: "sweeten", label: "Final sweetener" },
    ],
  },
  {
    id: "competitive",
    label: "Competitive",
    items: [
      { id: "criteria_control", label: "Scorecard criteria control" },
      { id: "switching_cost", label: "Switching cost reduction" },
      { id: "speed_play", label: "Speed play" },
      { id: "neutralise_champ", label: "Neutralise competitor champion" },
    ],
  },
  {
    id: "relationship",
    label: "Executive & relationship",
    items: [
      { id: "exec_sponsor", label: "Exec sponsor pairing" },
      { id: "advisory", label: "Advisory positioning" },
      { id: "event_alignment", label: "Industry event alignment" },
      { id: "insight_gift", label: "Insight / research gift" },
    ],
  },
];

const STAGE_LABELS: Record<string, string> = {
  exploring: "Exploring", qualifying: "Qualifying",
  proposing: "Proposing", closing: "Closing", won: "Won", lost: "Lost",
};

interface MeddpiccGap { label: string; severity: "empty" | "red" }

interface Props {
  dealId: string
  dealName: string
  accountName: string
  stage: Stage
  orgId: string
  initialActions: DealAction[]
  meddpiccGaps?: MeddpiccGap[]
  onClose: () => void
  onSessionSaved: () => void
}

export function WarRoomPanel({
  dealId, dealName, accountName, stage, orgId,
  initialActions, meddpiccGaps = [], onClose, onSessionSaved,
}: Props) {
  const [actions, setActions] = useState<DealAction[]>(initialActions);
  const [sessionNotes, setSessionNotes] = useState("");
  const [tacticNotes, setTacticNotes] = useState("");
  const [selectedTactics, setSelectedTactics] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newDesc, setNewDesc] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newDue, setNewDue] = useState("");
  const [addingAction, setAddingAction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const descRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createClient() as any;

  useEffect(() => {
    if (showAddRow) descRef.current?.focus();
  }, [showAddRow]);

  const handleClose = useCallback(async () => {
    // Build tactic summary from selections
    const tacticLines = TACTIC_CATEGORIES
      .map((cat) => {
        const picked = cat.items.filter((t) => selectedTactics.has(t.id));
        if (!picked.length) return null;
        return `${cat.label}: ${picked.map((t) => t.label).join(", ")}`;
      })
      .filter(Boolean);

    const combined = [
      sessionNotes.trim() && `**Session notes**\n${sessionNotes.trim()}`,
      tacticLines.length && `**Tactics in play**\n${tacticLines.map((l) => `- ${l}`).join("\n")}`,
      tacticNotes.trim() && `**Strategy notes**\n${tacticNotes.trim()}`,
    ].filter(Boolean).join("\n\n");

    if (combined) {
      setSaving(true);
      await db.from("activities").insert({
        deal_id: dealId,
        organization_id: orgId,
        type: "meeting",
        title: "War Room session",
        notes: combined,
      });
      setSaving(false);
      onSessionSaved();
    }
    onClose();
  }, [sessionNotes, tacticNotes, selectedTactics, dealId, orgId, db, onClose, onSessionSaved]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  async function addAction() {
    if (!newDesc.trim()) return;
    setAddingAction(true);
    const { data } = await db.from("deal_actions").insert({
      deal_id: dealId,
      organization_id: orgId,
      description: newDesc.trim(),
      owner_name: newOwner.trim() || null,
      due_date: newDue || null,
      sort_order: actions.length,
    }).select().single();
    if (data) setActions((a) => [...a, data as DealAction]);
    setNewDesc(""); setNewOwner(""); setNewDue("");
    setAddingAction(false);
    setShowAddRow(false);
  }

  async function toggleComplete(action: DealAction) {
    const completed_at = action.completed_at ? null : new Date().toISOString();
    await db.from("deal_actions").update({ completed_at }).eq("id", action.id);
    setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, completed_at } : a));
  }

  async function removeAction(id: string) {
    await db.from("deal_actions").delete().eq("id", id);
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  const open = actions.filter((a) => !a.completed_at);
  const done = actions.filter((a) => a.completed_at);
  const hasNotes = sessionNotes.trim() || tacticNotes.trim() || selectedTactics.size > 0;

  function toggleTactic(id: string) {
    setSelectedTactics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px]" onClick={handleClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[620px] border-l border-border bg-background shadow-2xl">

        {/* Header */}
        <div className="shrink-0 border-b border-border bg-card px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Swords className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">War Room</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              <p className="text-base font-semibold text-foreground">{dealName}</p>
              <p className="text-xs text-muted-foreground">{accountName}</p>
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* MEDDPICC gap diagnostic */}
          {meddpiccGaps.length > 0 && (
            <section className="rounded-md border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                MEDDPICC gaps
              </p>
              <div className="flex flex-wrap gap-1.5">
                {meddpiccGaps.map((g) => (
                  <span
                    key={g.label}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      g.severity === "red"
                        ? "bg-health-red/10 text-health-red"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      g.severity === "red" ? "bg-health-red" : "bg-muted-foreground/40"
                    )} />
                    {g.label}
                    {g.severity === "empty" && <span className="opacity-60">empty</span>}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Session notes */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Session notes
            </label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What came up? Key insights, blockers raised, context from the call…"
              rows={4}
              className="w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </section>

          {/* Action tracks */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Action tracks
              </label>
              {!showAddRow && (
                <button
                  onClick={() => setShowAddRow(true)}
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add track
                </button>
              )}
            </div>

            {/* Existing open actions */}
            {open.length > 0 && (
              <div className="divide-y divide-border rounded-md border border-border mb-2">
                {open.map((a) => (
                  <ActionRow
                    key={a.id}
                    action={a}
                    onToggle={() => toggleComplete(a)}
                    onRemove={() => removeAction(a.id)}
                  />
                ))}
              </div>
            )}

            {/* Add row */}
            {showAddRow && (
              <div className="rounded-md border border-accent/40 bg-accent/5 p-3 space-y-2 mb-2">
                <input
                  ref={descRef}
                  type="text"
                  placeholder="What needs to happen?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAction()}
                  className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Owner"
                      value={newOwner}
                      onChange={(e) => setNewOwner(e.target.value)}
                      className="w-full rounded border border-border bg-background pl-7 pr-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={newDue}
                      onChange={(e) => setNewDue(e.target.value)}
                      className="w-full rounded border border-border bg-background pl-7 pr-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addAction}
                    disabled={addingAction || !newDesc.trim()}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    {addingAction ? "Adding…" : "Add"}
                  </button>
                  <button onClick={() => setShowAddRow(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {open.length === 0 && !showAddRow && (
              <p className="text-xs text-muted-foreground italic">No open tracks — add the first one.</p>
            )}

            {/* Completed */}
            {done.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  {done.length} completed
                </summary>
                <div className="divide-y divide-border rounded-md border border-border mt-2 opacity-60">
                  {done.map((a) => (
                    <ActionRow key={a.id} action={a} onToggle={() => toggleComplete(a)} onRemove={() => removeAction(a.id)} />
                  ))}
                </div>
              </details>
            )}
          </section>

          {/* Strategy & tactics */}
          <section>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Strategy & tactics
            </label>
            <div className="rounded-md border border-border overflow-hidden divide-y divide-border">
              {TACTIC_CATEGORIES.map((cat) => {
                const isOpen = expandedCategories.has(cat.id);
                const picked = cat.items.filter((t) => selectedTactics.has(t.id));
                return (
                  <div key={cat.id}>
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-foreground">{cat.label}</span>
                        {picked.length > 0 && !isOpen && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {picked.map((t) => (
                              <span
                                key={t.id}
                                className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent font-medium"
                              >
                                {t.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ml-2",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {/* Subtactics */}
                    {isOpen && (
                      <div className="px-3.5 pb-3 pt-1 bg-muted/20 flex flex-wrap gap-1.5">
                        {cat.items.map((t) => {
                          const active = selectedTactics.has(t.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggleTactic(t.id)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                active
                                  ? "border-accent bg-accent/15 text-accent"
                                  : "border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground"
                              )}
                            >
                              {active && <Check className="inline h-2.5 w-2.5 mr-1" />}
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Open notes */}
            <textarea
              value={tacticNotes}
              onChange={(e) => setTacticNotes(e.target.value)}
              placeholder="Who's running which angle, what's the sequencing, any context on the approach…"
              rows={3}
              className="mt-2 w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-6 py-4">
          {hasNotes && (
            <p className="text-xs text-muted-foreground mb-3">
              Session notes and strategy will be saved to the activity timeline when you end the session.
            </p>
          )}
          <button
            onClick={handleClose}
            disabled={saving}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Saving session…" : hasNotes ? "End session & save notes" : "End session"}
          </button>
        </div>
      </div>
    </>
  );
}

function ActionRow({
  action, onToggle, onRemove,
}: {
  action: DealAction; onToggle: () => void; onRemove: () => void
}) {
  const done = !!action.completed_at;
  const overdue = !done && action.due_date ? isOverdue(action.due_date) : false;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 group">
      <button
        onClick={onToggle}
        className={cn(
          "shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors",
          done
            ? "bg-health-green border-health-green text-white"
            : "border-border hover:border-accent"
        )}
      >
        {done && <Check className="h-2.5 w-2.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", done && "line-through text-muted-foreground")}>
          {action.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {action.owner_name && (
            <span className="text-xs text-muted-foreground">{action.owner_name}</span>
          )}
          {action.due_date && (
            <span className={cn("text-xs font-mono", overdue ? "text-health-red" : "text-muted-foreground")}>
              {overdue ? "⚠ " : ""}{formatDate(action.due_date)}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-health-red"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
