"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, CheckCircle2, Circle,
  ChevronRight, Plus, FileText, Sparkles, Loader2, TrendingUp, Swords, Check, Trash2,
} from "lucide-react";
import { WonModal, LostModal } from "@/components/deal/win-loss-modal";
import type { WonData, LostData } from "@/components/deal/win-loss-modal";
import { CoachingNotes } from "@/components/deal/coaching-notes";
import { TeamCoachPanel } from "@/components/deal/team-coach-panel";
import type { CoachMessage } from "@/components/deal/team-coach-panel";
import { WarRoomPanel } from "@/components/deal/war-room-panel";
import { createClient } from "@/lib/supabase/client";
import { ConceptBadge } from "@/components/learn/concept-badge";
import { BuyingCommittee } from "@/components/deal/buying-committee";
import { useFeatures } from "@/lib/hooks/use-features";
import { cn } from "@/lib/utils";
import {
  STAGE_LABELS, STAGE_ORDER, ACTIVE_STAGES,
  formatCurrency, formatDate, isOverdue, healthBg, worstHealth,
} from "@/lib/format";
import type { DealFull, DealAction, Stage, Health, ActivityType } from "@/lib/supabase/types";
import type { DebriefResult } from "@/lib/agents/debrief";
import type { QualificationResult } from "@/lib/agents/qualify";

type SegmentOption = { id: string; label: string; kind: "core" | "adjacent"; confidence: number };

interface Props {
  deal: DealFull
  currentUserId: string
  expansionDeals?: { id: string; name: string }[]
  dealActions?: DealAction[]
  orgId?: string
  segments?: SegmentOption[]
}

export function DealDetailClient({ deal: initial, currentUserId, expansionDeals = [], dealActions: initialActions = [], orgId = "", segments = [] }: Props) {
  const router = useRouter();
  const features = useFeatures();
  const [deal, setDeal] = useState(initial);

  // Sync local state when server re-fetches after router.refresh()
  useEffect(() => { setDeal(initial); }, [initial]);
  const [saving, setSaving] = useState<string | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [qualData, setQualData] = useState<QualificationResult | null>(null);
  const [qualLoading, setQualLoading] = useState(false);
  const [creatingExpansion, setCreatingExpansion] = useState(false);
  const [showWonModal, setShowWonModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showWarRoom, setShowWarRoom] = useState(false);
  const [stageGateWarnings, setStageGateWarnings] = useState<string[] | null>(null);
  const [pendingStage, setPendingStage] = useState<Stage | null>(null);
  const [actions, setActions] = useState<DealAction[]>(initialActions);

  useEffect(() => { setActions(initialActions); }, [initialActions]);

  // MEDDPICC gap analysis — used by War Room and stage gate
  const meddpiccGaps = computeMeddpiccGaps(deal, features.tier3_meddpicc_full);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createClient() as any;

  async function updateField(field: string, value: unknown) {
    setSaving(field);
    await db.from("deals").update({ [field]: value }).eq("id", deal.id);
    setDeal((prev) => ({ ...prev, [field]: value }));
    setSaving(null);
  }

  async function applyDebriefResult(result: DebriefResult, transcript: string) {
    // Write MEDDPICC field updates
    const fieldUpdates: Record<string, string> = {};
    for (const u of result.meddpicc_updates) {
      fieldUpdates[u.field] = u.new_value;
    }
    const healthUpdates: Record<string, string> = {};
    for (const h of result.health_updates) {
      healthUpdates[h.field] = h.new_value;
    }
    const allUpdates = { ...fieldUpdates, ...healthUpdates };
    if (Object.keys(allUpdates).length > 0) {
      await db.from("deals").update(allUpdates).eq("id", deal.id);
      setDeal((prev) => ({ ...prev, ...allUpdates }));
    }

    // Create new contacts from committee suggestions
    for (const nc of result.new_contacts) {
      const { data: contact } = await db.from("contacts").insert({
        account_id: deal.account_id,
        organization_id: deal.account.organization_id,
        name: nc.name,
        title: nc.title || null,
      }).select().single();
      if (contact?.id) {
        await db.from("deal_contacts").insert({
          deal_id: deal.id,
          contact_id: contact.id,
          role: nc.role_in_deal,
          sentiment: "unknown",
        });
      }
    }

    // Log the transcript activity with AI summary
    await db.from("activities").insert({
      deal_id: deal.id,
      created_by: currentUserId,
      type: "transcript",
      notes: transcript,
      agent_summary: result.agent_summary,
    });

    setShowActivityForm(false);
    router.refresh();
  }

  async function runQualification() {
    setQualLoading(true);
    try {
      const res = await fetch("/api/agents/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: deal.id }),
      });
      if (res.ok) {
        const data = await res.json() as QualificationResult;
        setQualData(data);
      }
    } finally {
      setQualLoading(false);
    }
  }

  async function saveCoachSession(messages: CoachMessage[]) {
    if (messages.length === 0) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const fullResponse = lastAssistant?.content ?? "";
    // agent_summary: kept short for cross-session coach prompt injection (cost control)
    // notes: full last response so the timeline entry is readable
    await db.from("activities").insert({
      deal_id: deal.id,
      organization_id: deal.account.organization_id,
      created_by: null,
      type: "coaching",
      title: `Coaching session — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
      raw_transcript: JSON.stringify(messages),
      agent_summary: fullResponse.slice(0, 300),
      notes: fullResponse,
    });
  }

  async function handleWon(data: WonData) {
    setShowWonModal(false);
    await db.from("deals").update({
      stage: "won",
      closed_at: new Date().toISOString(),
      win_reason: data.win_reason,
      win_notes: data.win_notes || null,
    }).eq("id", deal.id);
    setDeal((prev) => ({ ...prev, stage: "won" as Stage, win_reason: data.win_reason, win_notes: data.win_notes }));
    if (data.createExpansion) {
      await createExpansionDeal();
    } else {
      router.refresh();
    }
  }

  async function handleLost(data: LostData) {
    setShowLostModal(false);
    await db.from("deals").update({
      stage: "lost",
      closed_at: new Date().toISOString(),
      loss_category: data.loss_category || null,
      lost_to_competitor: data.lost_to_competitor || null,
      lost_reason: data.lost_reason || null,
    }).eq("id", deal.id);
    setDeal((prev) => ({ ...prev, stage: "lost" as Stage }));
    router.refresh();
  }

  async function createExpansionDeal() {
    setCreatingExpansion(true);
    const { data } = await db.from("deals").insert({
      organization_id: deal.account.organization_id,
      account_id: deal.account_id,
      owner_id: deal.owner_id,
      name: `${deal.name} — Expansion`,
      stage: "exploring",
      type: "expansion",
      parent_deal_id: deal.id,
    }).select().single();
    setCreatingExpansion(false);
    if (data?.id) router.push(`/pipeline/${data.id}`);
  }

  const qualHealth = features.tier2_meddpicc_lite
    ? worstHealth([
        deal.meddpicc_metrics_health,
        deal.meddpicc_eb_health,
        deal.meddpicc_pain_health,
        deal.meddpicc_champion_health,
        ...(features.tier3_meddpicc_full ? [
          deal.meddpicc_decision_criteria_health,
          deal.meddpicc_decision_process_health,
          deal.meddpicc_paper_process_health,
          deal.meddpicc_competition_health,
        ] : []),
      ] as (Health | null)[])
    : null;

  const scoreColor = qualData
    ? qualData.score >= 75 ? "text-health-green bg-green-50"
    : qualData.score >= 40 ? "text-health-amber bg-amber-50"
    : "text-health-red bg-red-50"
    : "";

  return (
    <>
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-8 py-4">
        <Link
          href="/pipeline"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          Pipeline
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{deal.account.name}</p>
            <h1 className="text-lg font-semibold text-foreground">{deal.name}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* War Room */}
            <button
              onClick={() => setShowWarRoom(true)}
              className="flex items-center gap-1 rounded px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
            >
              <Swords className="h-3 w-3" />
              War Room
            </button>

            {/* Team Coach */}
            <button
              onClick={() => setShowCoach(true)}
              className="flex items-center gap-1 rounded px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Team Coach
            </button>

            {/* Qualification score */}
            {features.tier3_qualification_agent && (
              qualData ? (
                <span className={cn("rounded px-2 py-1 text-xs font-mono font-medium", scoreColor)}>
                  {qualData.score}/100
                </span>
              ) : (
                <button
                  onClick={runQualification}
                  disabled={qualLoading}
                  className="flex items-center gap-1 rounded px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors disabled:opacity-50"
                >
                  {qualLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Score deal
                </button>
              )
            )}
            {qualHealth && (
              <span className={cn("rounded px-2 py-1 text-xs font-medium", healthBg(qualHealth))}>
                {qualHealth.charAt(0).toUpperCase() + qualHealth.slice(1)}
              </span>
            )}
            {deal.acv_value != null && (
              <span className="font-mono text-sm text-foreground">
                {formatCurrency(deal.acv_value, deal.currency)}{" "}
                <span className="text-muted-foreground text-xs">ACV</span>
              </span>
            )}
          </div>
        </div>

        {/* AI qualification summary */}
        {qualData && (
          <div className="mt-3 rounded-md border border-border bg-card px-4 py-3 space-y-2">
            <p className="text-xs text-muted-foreground">{qualData.score_rationale}</p>
            {qualData.recommended_actions.length > 0 && (
              <ul className="space-y-1">
                {qualData.recommended_actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <span className="text-accent mt-0.5">→</span> {a}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={runQualification} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Refresh score
            </button>
          </div>
        )}

        {/* Stage indicator */}
        {deal.stage !== "won" && deal.stage !== "lost" && (
          <div className="mt-4 flex items-center gap-0">
            {ACTIVE_STAGES.map((stage, i) => {
              const idx = ACTIVE_STAGES.indexOf(stage);
              const currentIdx = ACTIVE_STAGES.indexOf(deal.stage as Stage);
              const isActive = stage === deal.stage;
              const isPast = idx < currentIdx;
              const isNext = idx === currentIdx + 1;

              return (
                <div key={stage} className="flex items-center">
                  <button
                    onClick={() => isNext ? advanceStage(stage) : undefined}
                    disabled={!isNext}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                      isActive ? "bg-primary text-primary-foreground" :
                      isPast ? "text-muted-foreground" :
                      isNext ? "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer" :
                      "text-muted-foreground/40 cursor-default"
                    )}
                  >
                    {STAGE_LABELS[stage]}
                  </button>
                  {i < ACTIVE_STAGES.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-border mx-0.5" />
                  )}
                </div>
              );
            })}

            <div className="ml-4 flex gap-2">
              <button
                onClick={() => setShowWonModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-health-green hover:bg-green-50 rounded transition-colors"
              >
                Mark won
              </button>
              <button
                onClick={() => setShowLostModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted rounded transition-colors"
              >
                Mark lost
              </button>
            </div>
          </div>
        )}

        {/* Won deal — expansion deals */}
        {deal.stage === "won" && features.tier1_expansion && (
          <div className="mt-3 flex items-center gap-3">
            {expansionDeals.length > 0 ? (
              expansionDeals.map((ed) => (
                <Link
                  key={ed.id}
                  href={`/pipeline/${ed.id}`}
                  className="flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {ed.name}
                </Link>
              ))
            ) : (
              <button
                onClick={createExpansionDeal}
                disabled={creatingExpansion}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors disabled:opacity-50"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {creatingExpansion ? "Creating…" : "Start expansion deal"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Coach observations — deterministic, always visible when there are flags */}
      <CoachingNotes deal={deal} features={features} />

      {/* Body — two columns */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: deal fields */}
        <div className="w-[52%] border-r border-border overflow-y-auto px-8 py-6 space-y-8">

          {/* Core fields */}
          <Section title="Core">
            <EditableField
              label="Economic Buyer"
              badge={<ConceptBadge slug="economic_buyer" />}
              value={deal.economic_buyer?.name ?? ""}
              placeholder="Who controls the budget?"
              onSave={(v) => updateField("economic_buyer_contact_id", v || null)}
              saving={saving === "economic_buyer_contact_id"}
              auxiliary={
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={deal.economic_buyer_met}
                    onChange={(e) => updateField("economic_buyer_met", e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="flex items-center gap-1">
                    {deal.economic_buyer_met
                      ? <><CheckCircle2 className="h-3.5 w-3.5 text-health-green" /> Met</>
                      : <><Circle className="h-3.5 w-3.5 text-muted-foreground" /> Not yet met</>
                    }
                  </span>
                </label>
              }
            />

            <EditableTextarea
              label="Pain"
              badge={<ConceptBadge slug="pain" />}
              value={deal.pain ?? ""}
              placeholder="The business problem that costs them if unsolved — one sentence."
              onSave={(v) => updateField("pain", v || null)}
              saving={saving === "pain"}
            />

            <EditableTextarea
              label="Success criteria"
              badge={<ConceptBadge slug="success_criteria" />}
              value={deal.success_criteria ?? ""}
              placeholder="What does the EB need to see to say yes?"
              onSave={(v) => updateField("success_criteria", v || null)}
              saving={saving === "success_criteria"}
            />

            <SegmentField
              segments={segments}
              value={deal.segment_id}
              saving={saving === "segment_id"}
              onSave={(v) => updateField("segment_id", v)}
            />

            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="ACV"
                value={deal.acv_value != null ? String(deal.acv_value / 100) : ""}
                placeholder="Annual value (£)"
                type="number"
                onSave={(v) => updateField("acv_value", v ? Math.round(parseFloat(v) * 100) : null)}
                saving={saving === "acv_value"}
              />
              <EditableField
                label="NRE"
                value={deal.nre_value != null ? String(deal.nre_value / 100) : ""}
                placeholder="One-time (£)"
                type="number"
                onSave={(v) => updateField("nre_value", v ? Math.round(parseFloat(v) * 100) : null)}
                saving={saving === "nre_value"}
              />
            </div>

            <EditableField
              label="Expected close"
              value={deal.expected_close_date ?? ""}
              type="date"
              onSave={(v) => updateField("expected_close_date", v || null)}
              saving={saving === "expected_close_date"}
            />
          </Section>

          {/* Buying committee */}
          <Section title="">
            <BuyingCommittee
              dealId={deal.id}
              accountId={deal.account_id}
              orgId={deal.account.organization_id}
              stage={deal.stage as Stage}
              committee={deal.deal_contacts}
              onChanged={() => router.refresh()}
            />
          </Section>

          {/* Tier 1: Expansion */}
          {features.tier1_expansion && (deal.stage === "won" || deal.type === "expansion") && (
            <Section title="Expansion" tier={1}>
              <EditableTextarea
                label="Expansion vision"
                badge={<ConceptBadge slug="expansion_motion" />}
                value={deal.expansion_vision ?? ""}
                placeholder="What does a 5–10× version of this deal look like?"
                onSave={(v) => updateField("expansion_vision", v || null)}
                saving={saving === "expansion_vision"}
              />
              <EditableField
                label="Expansion economic buyer"
                badge={<ConceptBadge slug="expansion_eb" />}
                value={deal.expansion_eb_name ?? ""}
                placeholder="Who would sign the larger deal?"
                onSave={(v) => updateField("expansion_eb_name", v || null)}
                saving={saving === "expansion_eb_name"}
                auxiliary={
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={deal.expansion_eb_met}
                      onChange={(e) => updateField("expansion_eb_met", e.target.checked)}
                      className="rounded border-border"
                    />
                    Met
                  </label>
                }
              />
            </Section>
          )}

          {/* Tier 2: MEDDPICC lite */}
          {features.tier2_meddpicc_lite && (
            <Section title="MEDDPICC" tier={2}>
              {MEDDPICC_LITE.map(({ notesField, healthField, label, slug }) => (
                <MEDDPICCField
                  key={notesField}
                  label={label}
                  slug={slug}
                  notes={deal[notesField as keyof DealFull] as string ?? ""}
                  health={deal[healthField as keyof DealFull] as Health ?? null}
                  onSaveNotes={(v) => updateField(notesField, v || null)}
                  onSaveHealth={(v) => updateField(healthField, v)}
                  saving={saving === notesField || saving === healthField}
                />
              ))}

              {features.tier3_meddpicc_full && MEDDPICC_FULL.map(({ notesField, healthField, label, slug }) => (
                <MEDDPICCField
                  key={notesField}
                  label={label}
                  slug={slug}
                  notes={deal[notesField as keyof DealFull] as string ?? ""}
                  health={deal[healthField as keyof DealFull] as Health ?? null}
                  onSaveNotes={(v) => updateField(notesField, v || null)}
                  onSaveHealth={(v) => updateField(healthField, v)}
                  saving={saving === notesField || saving === healthField}
                />
              ))}
            </Section>
          )}

          {!features.tier2_meddpicc_lite && (
            <LockedTierHint
              title="MEDDPICC qualification"
              description="Add structured qualification across 8 dimensions with health indicators. Unlock in Settings when you're ready to go deeper."
            />
          )}
        </div>

        {/* Right: next action + activity timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Sticky next action */}
          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <h3 className="text-sm font-semibold text-foreground">Next action</h3>
              <ConceptBadge slug="next_action" />
            </div>
            <EditableField
              label=""
              value={deal.next_action ?? ""}
              placeholder="Specific step — who, what, by when"
              onSave={(v) => updateField("next_action", v || null)}
              saving={saving === "next_action"}
            />
            <div className="mt-2">
              <input
                type="date"
                defaultValue={deal.next_action_date ?? ""}
                onBlur={(e) => updateField("next_action_date", e.target.value || null)}
                className={cn(
                  "w-full rounded border border-border bg-background px-2 py-1.5 text-xs font-mono",
                  "focus:outline-none focus:ring-1 focus:ring-ring",
                  isOverdue(deal.next_action_date) ? "text-health-red" : "text-foreground"
                )}
              />
            </div>
            {isOverdue(deal.next_action_date) && (
              <p className="mt-1.5 text-xs text-health-red">
                Overdue — investigate why this hasn&apos;t happened.
              </p>
            )}
          </div>

          {/* Parallel action tracks */}
          {actions.filter((a) => !a.completed_at).length > 0 && (
            <div className="rounded-md border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                  Action tracks
                </h3>
                <button
                  onClick={() => setShowWarRoom(true)}
                  className="text-xs text-accent hover:underline"
                >
                  Open War Room →
                </button>
              </div>
              <div className="space-y-1.5">
                {actions.filter((a) => !a.completed_at).map((a) => {
                  const overdue = a.due_date ? isOverdue(a.due_date) : false;
                  return (
                    <div key={a.id} className="flex items-start gap-2">
                      <button
                        onClick={async () => {
                          const completed_at = new Date().toISOString();
                          await db.from("deal_actions").update({ completed_at }).eq("id", a.id);
                          setActions((prev) => prev.map((x) => x.id === a.id ? { ...x, completed_at } : x));
                        }}
                        className="mt-0.5 shrink-0 h-4 w-4 rounded border border-border hover:border-accent flex items-center justify-center transition-colors"
                      >
                        <Check className="h-2.5 w-2.5 text-transparent hover:text-accent" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">{a.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {[a.owner_name, a.due_date ? formatDate(a.due_date) : null].filter(Boolean).join(" · ")}
                          {overdue && <span className="text-health-red ml-1">⚠ overdue</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Activity</h3>
              <button
                onClick={() => setShowActivityForm(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Log
              </button>
            </div>

            {showActivityForm && (
              <ActivityForm
                dealId={deal.id}
                currentUserId={currentUserId}
                canDebrief={features.tier3_debrief_agent}
                onSaved={async () => { setShowActivityForm(false); router.refresh(); }}
                onApplyDebrief={applyDebriefResult}
                onCancel={() => setShowActivityForm(false)}
              />
            )}

            <div className="space-y-3">
              {deal.activities.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  No activity logged yet. Log a call or note after every interaction.
                </p>
              ) : (
                deal.activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {showWarRoom && (
      <WarRoomPanel
        dealId={deal.id}
        dealName={deal.name}
        accountName={deal.account.name}
        stage={deal.stage as Stage}
        orgId={orgId}
        initialActions={actions}
        meddpiccGaps={meddpiccGaps}
        onClose={() => setShowWarRoom(false)}
        onSessionSaved={() => router.refresh()}
      />
    )}

    {stageGateWarnings && pendingStage && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Moving to {STAGE_LABELS[pendingStage]}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            These MEDDPICC gaps are worth addressing before you advance. You can still proceed.
          </p>
          <ul className="space-y-1.5 mb-5">
            {stageGateWarnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-health-amber shrink-0" />
                {w}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={() => { commitStageAdvance(pendingStage); setStageGateWarnings(null); setPendingStage(null); }}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
            >
              Advance anyway
            </button>
            <button
              onClick={() => { setStageGateWarnings(null); setPendingStage(null); }}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    )}

    {showCoach && (
      <TeamCoachPanel
        dealId={deal.id}
        dealName={deal.name}
        onClose={() => setShowCoach(false)}
        onSaveSession={saveCoachSession}
      />
    )}

    {showWonModal && (
      <WonModal
        dealName={deal.name}
        expansionEnabled={features.tier1_expansion}
        onConfirm={handleWon}
        onCancel={() => setShowWonModal(false)}
      />
    )}
    {showLostModal && (
      <LostModal
        dealName={deal.name}
        onConfirm={handleLost}
        onCancel={() => setShowLostModal(false)}
      />
    )}
    </>
  );

  function advanceStage(newStage: Stage) {
    const warnings = getStageGateWarnings(deal, newStage, features.tier2_meddpicc_lite, features.tier3_meddpicc_full);
    if (warnings.length > 0) {
      setStageGateWarnings(warnings);
      setPendingStage(newStage);
      return;
    }
    commitStageAdvance(newStage);
  }

  function commitStageAdvance(newStage: Stage) {
    updateField("stage", newStage);
    if (newStage === "won" || newStage === "lost") {
      db.from("deals").update({ closed_at: new Date().toISOString() }).eq("id", deal.id);
    }
    router.refresh();
  }
}

// ── MEDDPICC gap helpers ─────────────────────────────────────────────────────

interface MeddpiccGap {
  label: string
  severity: "empty" | "red"
}

const LITE_FIELDS = [
  { label: "Metrics", notes: "meddpicc_metrics", health: "meddpicc_metrics_health" },
  { label: "Economic Buyer", notes: "meddpicc_eb_notes", health: "meddpicc_eb_health" },
  { label: "Identify Pain", notes: "meddpicc_pain_notes", health: "meddpicc_pain_health" },
  { label: "Champion", notes: "meddpicc_champion_notes", health: "meddpicc_champion_health" },
] as const;

const FULL_FIELDS = [
  { label: "Decision Criteria", notes: "meddpicc_decision_criteria", health: "meddpicc_decision_criteria_health" },
  { label: "Decision Process", notes: "meddpicc_decision_process", health: "meddpicc_decision_process_health" },
  { label: "Paper Process", notes: "meddpicc_paper_process", health: "meddpicc_paper_process_health" },
  { label: "Competition", notes: "meddpicc_competition", health: "meddpicc_competition_health" },
] as const;

function computeMeddpiccGaps(deal: DealFull, fullEnabled: boolean): MeddpiccGap[] {
  const fields = fullEnabled ? [...LITE_FIELDS, ...FULL_FIELDS] : [...LITE_FIELDS];
  const gaps: MeddpiccGap[] = [];
  for (const f of fields) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = deal as any;
    const health = d[f.health] as string | null;
    const notes = d[f.notes] as string | null;
    if (health === "red") gaps.push({ label: f.label, severity: "red" });
    else if (!notes?.trim()) gaps.push({ label: f.label, severity: "empty" });
  }
  return gaps;
}

// Critical MEDDPICC fields per stage transition
const STAGE_GATE_RULES: Record<string, { field: keyof DealFull; label: string; requiresFull?: boolean }[]> = {
  qualifying: [
    { field: "meddpicc_pain_notes", label: "Identify Pain — what specific problem are you solving?" },
    { field: "meddpicc_eb_notes", label: "Economic Buyer — who controls the budget?" },
  ],
  proposing: [
    { field: "meddpicc_metrics", label: "Metrics — what's the quantified business impact?" },
    { field: "meddpicc_champion_notes", label: "Champion — who is selling this internally for you?" },
    { field: "meddpicc_decision_criteria", label: "Decision Criteria — how will they evaluate vendors?", requiresFull: true },
  ],
  closing: [
    { field: "meddpicc_decision_process", label: "Decision Process — who are all the approvers?", requiresFull: true },
    { field: "meddpicc_paper_process", label: "Paper Process — do you know the procurement/legal timeline?", requiresFull: true },
    { field: "meddpicc_competition", label: "Competition — who else are they evaluating?", requiresFull: true },
  ],
};

function getStageGateWarnings(deal: DealFull, newStage: Stage, liteEnabled: boolean, fullEnabled: boolean): string[] {
  if (!liteEnabled) return [];
  const rules = STAGE_GATE_RULES[newStage] ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = deal as any;
  return rules
    .filter((r) => !r.requiresFull || fullEnabled)
    .filter((r) => !d[r.field]?.trim())
    .map((r) => r.label);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SegmentField({
  segments,
  value,
  saving,
  onSave,
}: {
  segments: SegmentOption[]
  value: string | null
  saving: boolean
  onSave: (v: string | null) => void
}) {
  const selected = segments.find((s) => s.id === value) ?? null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Buyer segment this deal tests
        </label>
        <ConceptBadge slug="ideal_customer_profile" />
        {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      {segments.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No segments yet — map your core ICP and adjacent buyers in{" "}
          <Link href="/settings" className="text-accent hover:underline">Settings → Market &amp; buyers</Link>, then tag deals here to learn which buyers convert.
        </p>
      ) : (
        <>
          <select
            value={value ?? ""}
            onChange={(e) => onSave(e.target.value || null)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Unassigned —</option>
            {segments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} · {s.kind === "core" ? "Core" : "Adjacent"} · {s.confidence}%
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {selected
              ? `When this deal is won or lost, ${selected.label}'s confidence (now ${selected.confidence}%) shifts — that's how the model learns which buyers actually convert.`
              : "Tag the buyer type this deal tests. When it is won or lost, that segment's confidence updates automatically."}
          </p>
        </>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: import("@/lib/supabase/types").Activity & { contact?: import("@/lib/supabase/types").Contact | null } }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (activity.notes?.length ?? 0) > 120;

  // Render **bold** markers as <strong>
  function renderNotes(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-foreground font-medium">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="flex gap-3 text-sm">
      <div className="shrink-0 mt-0.5">
        <ActivityIcon type={activity.type as ActivityType} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-foreground capitalize">
            {activity.title ?? activity.type}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {formatDate(activity.created_at)}
          </span>
          {activity.contact && (
            <span className="text-xs text-muted-foreground truncate">
              · {activity.contact.name}
            </span>
          )}
        </div>
        {activity.agent_summary && (
          <p className="mt-1 text-xs text-accent font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3 shrink-0" />
            {activity.agent_summary}
          </p>
        )}
        {activity.notes && (
          <>
            <p className={cn(
              "mt-0.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap",
              !expanded && isLong && "line-clamp-3"
            )}>
              {renderNotes(activity.notes)}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-0.5 text-xs text-accent hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title, tier, children,
}: {
  title: string; tier?: number; children: React.ReactNode
}) {
  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h2>
          {tier != null && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-mono">
              Tier {tier}
            </span>
          )}
        </div>
      )}
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function EditableField({
  label, badge, value, placeholder, type = "text", onSave, saving, auxiliary,
}: {
  label: string; badge?: React.ReactNode; value: string; placeholder?: string
  type?: string; onSave: (v: string) => void; saving: boolean; auxiliary?: React.ReactNode
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="text-xs font-medium text-muted-foreground">{label}</label>
          {badge}
        </div>
      )}
      {editing ? (
        <input
          type={type}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => { onSave(local); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onSave(local); setEditing(false); } }}
          className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      ) : (
        <button
          onClick={() => { setLocal(value); setEditing(true); }}
          className={cn(
            "w-full text-left rounded px-2.5 py-1.5 text-sm hover:bg-muted transition-colors",
            value ? "text-foreground" : "text-muted-foreground",
            saving && "opacity-50"
          )}
        >
          {value || placeholder || "—"}
        </button>
      )}
      {auxiliary}
    </div>
  );
}

function EditableTextarea({
  label, badge, value, placeholder, onSave, saving,
}: {
  label: string; badge?: React.ReactNode; value: string; placeholder?: string
  onSave: (v: string) => void; saving: boolean
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="text-xs font-medium text-muted-foreground">{label}</label>
          {badge}
        </div>
      )}
      {editing ? (
        <textarea
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => { onSave(local); setEditing(false); }}
          rows={3}
          className="w-full resize-none rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
          placeholder={placeholder}
        />
      ) : (
        <button
          onClick={() => { setLocal(value); setEditing(true); }}
          className={cn(
            "w-full text-left rounded px-2.5 py-1.5 text-sm hover:bg-muted transition-colors leading-relaxed",
            value ? "text-foreground" : "text-muted-foreground",
            saving && "opacity-50"
          )}
        >
          {value || placeholder || "—"}
        </button>
      )}
    </div>
  );
}

function MEDDPICCField({
  label, slug, notes, health, onSaveNotes, onSaveHealth, saving,
}: {
  label: string; slug: string; notes: string; health: Health | null
  onSaveNotes: (v: string) => void; onSaveHealth: (v: Health | null) => void; saving: boolean
}) {
  const [open, setOpen] = useState(false);
  const ratedButEmpty = health && !notes.trim();

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <span className="text-sm font-medium text-foreground">{label}</span>
          <ConceptBadge slug={slug} />
          {ratedButEmpty && (
            <span className="text-xs text-muted-foreground italic">add context →</span>
          )}
        </button>
        <HealthSelector
          value={health}
          onChange={(v) => { onSaveHealth(v); if (v) setOpen(true); }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {open && (
        <div className="border-t border-border px-4 py-3 bg-card">
          <EditableTextarea
            label=""
            value={notes}
            placeholder="Notes on this dimension…"
            onSave={onSaveNotes}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}

function HealthSelector({
  value, onChange, onClick,
}: {
  value: Health | null
  onChange: (v: Health | null) => void
  onClick?: (e: React.MouseEvent) => void
}) {
  const options: { v: Health; label: string; className: string }[] = [
    { v: "red", label: "Red", className: "text-health-red hover:bg-red-50" },
    { v: "amber", label: "Amber", className: "text-health-amber hover:bg-amber-50" },
    { v: "green", label: "Green", className: "text-health-green hover:bg-green-50" },
  ];

  return (
    <div className="flex items-center gap-1" onClick={onClick}>
      {options.map(({ v, label, className }) => (
        <button
          key={v}
          onClick={() => onChange(value === v ? null : v)}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
            value === v ? healthBg(v) : `text-muted-foreground hover:text-foreground ${className}`
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const icons: Record<ActivityType, string> = {
    call: "📞", email: "✉️", meeting: "🤝", note: "📝", transcript: "🎙️", milestone: "🏁", coaching: "🧠",
  };
  return <span className="text-base leading-none">{icons[type]}</span>;
}

function ActivityForm({
  dealId, currentUserId, canDebrief, onSaved, onApplyDebrief, onCancel,
}: {
  dealId: string; currentUserId: string; canDebrief: boolean
  onSaved: () => void; onApplyDebrief: (result: DebriefResult, transcript: string) => Promise<void>
  onCancel: () => void
}) {
  const [type, setType] = useState<ActivityType>("call");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [debriefResult, setDebriefResult] = useState<DebriefResult | null>(null);
  const [debriefError, setDebriefError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const TYPES: ActivityType[] = ["call", "email", "meeting", "note", "transcript"];

  async function saveBasic() {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createClient() as any).from("activities").insert({
      deal_id: dealId,
      created_by: currentUserId,
      type,
      notes: notes || null,
    });
    setSaving(false);
    onSaved();
  }

  async function extractWithAI() {
    if (!notes.trim()) return;
    setExtracting(true);
    setDebriefError(null);
    try {
      const res = await fetch("/api/agents/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, transcript: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setDebriefResult(data as DebriefResult);
    } catch (err) {
      setDebriefError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  async function applyResult() {
    if (!debriefResult) return;
    setApplying(true);
    await onApplyDebrief(debriefResult, notes);
    setApplying(false);
  }

  if (debriefResult) {
    return (
      <div className="rounded-md border border-border bg-card p-4 mb-4 space-y-4">
        {/* Summary */}
        <div>
          <p className="text-xs font-medium text-accent flex items-center gap-1 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> AI Summary
          </p>
          <p className="text-sm text-foreground">{debriefResult.agent_summary}</p>
        </div>

        {/* Key signals */}
        {debriefResult.key_signals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Key signals</p>
            <ul className="space-y-1">
              {debriefResult.key_signals.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                  <span className="text-accent shrink-0">·</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Proposed field updates */}
        {debriefResult.meddpicc_updates.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Proposed updates</p>
            <div className="space-y-2">
              {debriefResult.meddpicc_updates.map((u, i) => (
                <div key={i} className="rounded border border-border bg-background px-3 py-2">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-xs font-mono text-muted-foreground">{u.field}</p>
                    <span className={cn(
                      "text-xs rounded px-1.5 py-0.5 font-medium",
                      u.confidence >= 0.8 ? "bg-green-50 text-health-green" :
                      u.confidence >= 0.6 ? "bg-amber-50 text-health-amber" :
                      "bg-red-50 text-health-red"
                    )}>
                      {Math.round(u.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{u.new_value}</p>
                  {u.evidence_quote && (
                    <p className="mt-1 text-xs text-muted-foreground italic border-l-2 border-border pl-2 line-clamp-2">
                      "{u.evidence_quote}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New contacts */}
        {debriefResult.new_contacts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">New contacts to add</p>
            {debriefResult.new_contacts.map((c, i) => (
              <div key={i} className="text-xs text-foreground">
                <span className="font-medium">{c.name}</span>
                {c.title && <span className="text-muted-foreground"> · {c.title}</span>}
                <span className="text-muted-foreground"> ({c.role_in_deal})</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button onClick={() => setDebriefResult(null)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors">
            Discard
          </button>
          <button onClick={saveBasic} disabled={saving} className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5 transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Log transcript only"}
          </button>
          <button
            onClick={applyResult}
            disabled={applying}
            className="text-xs font-medium bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
          >
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {applying ? "Applying…" : "Apply updates"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-4 mb-4 space-y-3">
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors",
              type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {type === "transcript" && !canDebrief && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          Paste the transcript — enable AI Debrief Agent in Settings to auto-extract MEDDPICC updates.
        </p>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={type === "transcript" ? "Paste meeting transcript…" : "Notes…"}
        rows={type === "transcript" ? 6 : 3}
        className="w-full resize-none rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        autoFocus
      />

      {debriefError && (
        <p className="text-xs text-health-red">{debriefError}</p>
      )}

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors">
          Cancel
        </button>

        {type === "transcript" && canDebrief && notes.trim().length > 50 && (
          <button
            onClick={extractWithAI}
            disabled={extracting}
            className="flex items-center gap-1.5 text-xs font-medium border border-accent text-accent hover:bg-accent/5 rounded px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {extracting ? "Extracting…" : "Extract with AI"}
          </button>
        )}

        <button
          onClick={saveBasic}
          disabled={saving}
          className="text-xs font-medium bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving…" : "Log activity"}
        </button>
      </div>
    </div>
  );
}

function LockedTierHint({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground/70">{description}</p>
      <Link href="/settings" className="mt-1.5 inline-block text-xs text-accent hover:underline">
        Enable in Settings →
      </Link>
    </div>
  );
}

const MEDDPICC_LITE = [
  { notesField: "meddpicc_metrics", healthField: "meddpicc_metrics_health", label: "Metrics", slug: "meddpicc_metrics" },
  { notesField: "meddpicc_eb_notes", healthField: "meddpicc_eb_health", label: "Economic Buyer", slug: "economic_buyer" },
  { notesField: "meddpicc_pain_notes", healthField: "meddpicc_pain_health", label: "Identified Pain", slug: "pain" },
  { notesField: "meddpicc_champion_notes", healthField: "meddpicc_champion_health", label: "Champion", slug: "meddpicc_champion" },
];

const MEDDPICC_FULL = [
  { notesField: "meddpicc_decision_criteria", healthField: "meddpicc_decision_criteria_health", label: "Decision Criteria", slug: "meddpicc_decision_criteria" },
  { notesField: "meddpicc_decision_process", healthField: "meddpicc_decision_process_health", label: "Decision Process", slug: "meddpicc_decision_process" },
  { notesField: "meddpicc_paper_process", healthField: "meddpicc_paper_process_health", label: "Paper Process", slug: "meddpicc_paper_process" },
  { notesField: "meddpicc_competition", healthField: "meddpicc_competition_health", label: "Competition", slug: "meddpicc_competition" },
];
