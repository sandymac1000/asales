"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/lib/hooks/use-org";
import { formatCurrency } from "@/lib/format";
import { ScorecardAgent } from "@/components/settings/scorecard-agent";
import { MarketAgent } from "@/components/settings/market-agent";
import { ModelPicker } from "@/components/settings/model-picker";
import type { Features } from "@/lib/supabase/types";

// Grouped by what they UNLOCK, not by internal key naming
const TIER_FLAGS: Record<1 | 2 | 3, {
  key: keyof Features
  label: string
  adds: string
  requiresAI?: boolean
}[]> = {
  1: [
    {
      key: "tier1_expansion",
      label: "Expansion motion",
      adds: "Expansion Vision and Expansion EB fields on Won deals — who signs the larger renewal and have you met them.",
    },
    {
      key: "tier1_milestones",
      label: "Milestone dates",
      adds: "30/60/90-day check-in dates on Won deals. The prompt to re-engage before the relationship cools.",
    },
  ],
  2: [
    {
      key: "tier2_meddpicc_lite",
      label: "MEDDPICC — core 4",
      adds: "Metrics, Economic Buyer notes, Identified Pain, and Champion — each with Red/Amber/Green health. Appears on every active deal.",
    },
    {
      key: "tier3_meddpicc_full",
      label: "MEDDPICC — full 8",
      adds: "Decision Criteria, Decision Process, Paper Process, and Competition added to every deal. Enable once you are running 6+ concurrent deals where things start to slip.",
    },
  ],
  3: [
    {
      key: "tier3_debrief_agent",
      label: "AI Debrief",
      adds: "After logging a transcript, an Extract with AI button appears. Claude reads it and proposes MEDDPICC updates, new contacts, and key signals to act on.",
      requiresAI: true,
    },
    {
      key: "tier3_qualification_agent",
      label: "AI Qualification Score",
      adds: "A 0–100 score in each deal header, weighted by field recency. Surfaces deals going stale before you notice.",
      requiresAI: true,
    },
  ],
};

const TIER_COPY: Record<1 | 2 | 3, { heading: string; when: string }> = {
  1: {
    heading: "Land and expand",
    when: "Enable when you close your first deal and want a disciplined expansion motion from day one.",
  },
  2: {
    heading: "Qualification rigour",
    when: "Enable when you have 3+ concurrent active deals and start losing track of where each one actually stands.",
  },
  3: {
    heading: "AI intelligence",
    when: "Enable when qualification hygiene is already a habit and you want to reduce the admin cost of keeping it current. Requires ANTHROPIC_API_KEY.",
  },
};

const ALWAYS_ON = [
  "Economic Buyer — identity and whether you have met them",
  "Pain statement",
  "Success criteria",
  "Next action and date",
  "ACV, TCV, and NRE values",
  "Buying committee with role and sentiment",
  "Activity timeline — calls, emails, meetings, transcripts",
  "Win/loss debrief when closing a deal",
];

export default function SettingsPage() {
  const { org, refreshOrg } = useOrg();
  const [saving, setSaving] = useState<string | null>(null);
  const [orgName, setOrgName] = useState(org?.name ?? "");
  const [editingName, setEditingName] = useState(false);

  if (!org) return null;

  const nameLooksGeneric =
    org.name === "My Organisation" ||
    (/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(org.name) && !org.name.includes(" "));

  async function saveOrgName() {
    if (!org || !orgName.trim()) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createClient() as any).from("organizations").update({ name: orgName.trim() }).eq("id", org.id);
    await refreshOrg();
    setEditingName(false);
  }

  async function toggleFeature(key: keyof Features) {
    if (!org) return;
    setSaving(key);
    const next = { ...org.features, [key]: !org.features[key] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (createClient() as any).from("organizations").update({ features: next }).eq("id", org.id);
    await refreshOrg();
    setSaving(null);
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <h1 className="text-lg font-semibold text-foreground mb-8">Settings</h1>

      {/* Organisation */}
      <section className="mb-10">
        <SectionHeading>Organisation</SectionHeading>
        <div className="rounded-md border border-border bg-card px-5 py-4">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Company name</label>
          {editingName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveOrgName()}
                className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <button onClick={saveOrgName} className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
                Save
              </button>
              <button onClick={() => { setOrgName(org.name); setEditingName(false); }} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setOrgName(org.name); setEditingName(true); }}
                className="text-sm text-foreground hover:text-accent transition-colors"
              >
                {org.name}
              </button>
              {nameLooksGeneric && (
                <span className="text-xs text-accent">← update this</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Value narrative / MEDDPICC scorecard */}
      <section className="mb-10">
        <SectionHeading>Value narrative</SectionHeading>
        <p className="text-xs text-muted-foreground mb-4 -mt-2">
          Have a guided conversation with an AI coach to build your MEDDPICC value narrative — what your product moves, who buys it, and how to quantify the pain. The Team Coach reads this to give sharper deal-level advice.
        </p>
        <ScorecardAgent savedContext={org.product_context ?? null} />
      </section>

      {/* Market & buyers */}
      <section className="mb-10">
        <SectionHeading>Market &amp; buyers</SectionHeading>
        <p className="text-xs text-muted-foreground mb-4 -mt-2">
          Build a buyer profile for your target market. The Team Coach uses this to give advice specific to your sector — EB titles, procurement norms, common objections, and the right terminology.
        </p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MarketAgent marketContext={(org as any).market_context ?? null} productContext={org.product_context ?? null} />
      </section>

      {/* Agent models */}
      <section className="mb-10">
        <SectionHeading>Agent models</SectionHeading>
        <p className="text-xs text-muted-foreground mb-4 -mt-2">
          Choose which Claude model powers each agent. Opus 4.8 gives the best coaching quality; Sonnet 4.6 is a strong default for structured tasks at lower cost.
        </p>
        <ModelPicker />
      </section>

      {/* Targets */}
      <section className="mb-10">
        <SectionHeading>Targets</SectionHeading>
        <p className="text-xs text-muted-foreground mb-4 -mt-2">
          Used to calculate pipeline coverage and the forecast strip on the Pipeline page.
        </p>
        <QuarterTargets org={org} refreshOrg={refreshOrg} />
      </section>

      {/* Features */}
      <section>
        <SectionHeading>Features</SectionHeading>
        <p className="text-xs text-muted-foreground mb-6 -mt-2 leading-relaxed">
          Salient starts simple and unlocks complexity as your process matures. Enable a tier when
          your deals consistently demand it — earlier is not better.
        </p>

        {/* Always on */}
        <div className="mb-5">
          <Divider label="Always on" />
          <div className="rounded-md border border-border bg-card/50 px-5 py-4">
            <p className="text-xs font-medium text-foreground mb-2.5">
              Core deal fields — present on every deal, no toggle needed.
            </p>
            <ul className="space-y-1.5">
              {ALWAYS_ON.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 mt-0.5 text-muted-foreground/40">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tiers 1–3 */}
        <div className="space-y-5">
          {([1, 2, 3] as const).map((tier) => {
            const flags = TIER_FLAGS[tier];
            const copy = TIER_COPY[tier];
            return (
              <div key={tier}>
                <Divider label={`Tier ${tier} — ${copy.heading}`} />
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{copy.when}</p>
                <div className="rounded-md border border-border overflow-hidden">
                  {flags.map((flag) => (
                    <div
                      key={flag.key}
                      className="flex items-start gap-4 bg-card px-5 py-4 border-b border-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">{flag.label}</p>
                          {flag.requiresAI && (
                            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent font-medium">AI</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <span className="text-foreground/50">Adds: </span>
                          {flag.adds}
                        </p>
                      </div>
                      <Toggle
                        checked={org.features[flag.key]}
                        disabled={saving === flag.key}
                        onToggle={() => toggleFeature(flag.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* General */}
        <div className="mt-5">
          <Divider label="General" />
          <div className="rounded-md border border-border overflow-hidden">
            <div className="flex items-start gap-4 bg-card px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1">Kanban view</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-foreground/50">Adds: </span>
                  A board layout on the Pipeline page. Most useful once you have 15+ active deals across stages.
                </p>
              </div>
              <Toggle
                checked={org.features.pipeline_kanban}
                disabled={saving === "pipeline_kanban"}
                onToggle={() => toggleFeature("pipeline_kanban")}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

// ── Quarter targets ────────────────────────────────────────────────────────────

const QUARTERS: { key: "q1_target_acv" | "q2_target_acv" | "q3_target_acv" | "q4_target_acv"; label: string; months: string }[] = [
  { key: "q1_target_acv", label: "Q1", months: "Jan – Mar" },
  { key: "q2_target_acv", label: "Q2", months: "Apr – Jun" },
  { key: "q3_target_acv", label: "Q3", months: "Jul – Sep" },
  { key: "q4_target_acv", label: "Q4", months: "Oct – Dec" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuarterTargets({ org, refreshOrg }: { org: any; refreshOrg: () => Promise<void> }) {
  const currentQ = Math.floor(new Date().getMonth() / 3) + 1; // 1-4
  const year = new Date().getFullYear();

  return (
    <div className="space-y-3">
      {/* Per-quarter rows */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        {QUARTERS.map((q, i) => {
          const isPast = i + 1 < currentQ;
          const isCurrent = i + 1 === currentQ;
          return (
            <div
              key={q.key}
              className={`flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 ${isPast ? "opacity-50" : ""}`}
            >
              <div className="w-24 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isCurrent ? "text-accent" : isPast ? "text-muted-foreground" : "text-foreground"}`}>
                    {q.label}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                      now
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{q.months}</p>
              </div>
              <div className="flex-1">
                <TargetField
                  value={org[q.key]}
                  onSave={async (v) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { error } = await (createClient() as any).from("organizations").update({ [q.key]: v }).eq("id", org.id);
                    if (error) throw new Error(error.message);
                    await refreshOrg();
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Annual */}
      <div className="rounded-md border border-border bg-card px-5 py-3.5 flex items-center gap-4">
        <div className="w-24 shrink-0">
          <p className="text-sm font-semibold text-foreground">{year}</p>
          <p className="text-xs text-muted-foreground">Annual</p>
        </div>
        <div className="flex-1">
          <TargetField
            value={org.annual_target_acv}
            onSave={async (v) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error } = await (createClient() as any).from("organizations").update({ annual_target_acv: v }).eq("id", org.id);
              if (error) throw new Error(error.message);
              await refreshOrg();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
      {children}
    </h2>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function Toggle({
  checked, disabled, onToggle,
}: {
  checked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      className={`
        relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
        transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:opacity-50 cursor-pointer
        ${checked ? "bg-primary" : "bg-muted"}
      `}
    >
      <span className={`
        pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
        ${checked ? "translate-x-4" : "translate-x-0"}
      `} />
    </button>
  );
}

function TargetField({
  value, onSave,
}: {
  value: number | null | undefined
  onSave: (v: number | null) => Promise<void>
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function openEdit() {
    setLocal(value != null ? String(Math.round(value / 100)) : "");
    setSaveError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    const num = parseFloat(local.replace(/,/g, "").trim());
    const pence = local.trim() && !isNaN(num) ? Math.round(num * 100) : null;
    try {
      await onSave(pence);
      setEditing(false);
    } catch (err: unknown) {
      setSaveError((err as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {editing ? (
        <>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                £
              </span>
              <input
                type="number"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                className="pl-7 rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-44"
                placeholder="e.g. 100000"
                autoFocus
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
          {saveError && (
            <p className="mt-1 text-xs text-red-500">{saveError}</p>
          )}
        </>
      ) : (
        <button onClick={openEdit} className="text-sm hover:text-accent transition-colors">
          {value != null
            ? <span className="text-foreground font-medium">{formatCurrency(value)}</span>
            : <span className="text-muted-foreground italic text-xs">Not set — click to add</span>
          }
        </button>
      )}
    </div>
  );
}
