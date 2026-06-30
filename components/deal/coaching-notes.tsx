"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOverdue, formatDate } from "@/lib/format";
import type { DealFull, Features } from "@/lib/supabase/types";

export interface CoachObservation {
  severity: "critical" | "warning";
  title: string;
  question: string;
}

const STAGE_IDX: Record<string, number> = {
  exploring: 0, qualifying: 1, proposing: 2, closing: 3,
};

export function getCoachObservations(deal: DealFull, features: Features): CoachObservation[] {
  const obs: CoachObservation[] = [];
  const si = STAGE_IDX[deal.stage] ?? -1;
  if (si < 0) return obs; // won / lost — no coaching

  // ── Critical: overdue next action ────────────────────────────────────────────
  if (deal.next_action_date && isOverdue(deal.next_action_date)) {
    obs.push({
      severity: "critical",
      title: "Next action is overdue",
      question: `It was due ${formatDate(deal.next_action_date)}. Deals without a live next action are already cooling.`,
    });
  }

  // ── Critical: no activity in 14 days (qualifying or beyond) ──────────────────
  if (si >= 1 && deal.activities.length > 0) {
    const lastDate = new Date(deal.activities[0].created_at);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86_400_000);
    if (daysSince >= 14) {
      obs.push({
        severity: "critical",
        title: `No activity for ${daysSince} days`,
        question: "Deals that go quiet for two weeks are usually already lost — the prospect has moved on. Have you confirmed this is still live?",
      });
    }
  }

  // ── Warning: pain not documented ─────────────────────────────────────────────
  if (!deal.pain) {
    obs.push({
      severity: "warning",
      title: "Pain not documented",
      question: "What happens to this company if they do nothing? Not 'they want to improve X' — what is the actual cost of the status quo?",
    });
  }

  // ── Warning: EB not met (qualifying or beyond) ────────────────────────────────
  if (si >= 1 && !deal.economic_buyer_met) {
    obs.push({
      severity: "warning",
      title: "Economic Buyer not met",
      question: "Without meeting the EB directly, your champion is selling on your behalf unprepared. When is the next meeting where the EB will be in the room?",
    });
  }

  // ── MEDDPICC: champion (qualifying or beyond) ─────────────────────────────────
  if (si >= 1 && features.tier2_meddpicc_lite) {
    if (!deal.meddpicc_champion_notes) {
      obs.push({
        severity: "warning",
        title: "No Champion documented",
        question: "A champion is not someone who likes your product — it is someone whose career improves if you win. Who at this account fits that description?",
      });
    } else if (deal.meddpicc_champion_health === "red") {
      obs.push({
        severity: "critical",
        title: "Champion health is red",
        question: "Is your champion still in role? Are they actively advocating or just staying friendly? When did you last speak with them directly?",
      });
    }
  }

  // ── MEDDPICC: metrics (qualifying or beyond) ──────────────────────────────────
  if (si >= 1 && features.tier2_meddpicc_lite && !deal.meddpicc_metrics) {
    obs.push({
      severity: "warning",
      title: "Success not quantified",
      question: "'Reduce churn' is not a metric. What specific number, with a deadline, tells the buyer this investment paid off?",
    });
  }

  // ── MEDDPICC: decision process (proposing or beyond) ─────────────────────────
  if (si >= 2 && features.tier3_meddpicc_full && !deal.meddpicc_decision_process) {
    obs.push({
      severity: "warning",
      title: "Decision process unknown",
      question: "You have submitted a proposal without knowing the exact steps to a signed contract. Who signs, who approves, does it go to legal — in what order?",
    });
  }

  // ── Critical: paper process (closing) ────────────────────────────────────────
  if (si >= 3 && features.tier3_meddpicc_full && !deal.meddpicc_paper_process) {
    obs.push({
      severity: "critical",
      title: "Paper process not documented",
      question: "You are in Closing. Every unknown step between verbal yes and signed contract is a place the deal can die quietly. What is the exact sequence?",
    });
  }

  return obs;
}

export function CoachingNotes({ deal, features }: { deal: DealFull; features: Features }) {
  const obs = getCoachObservations(deal, features);
  if (obs.length === 0) return null;

  return (
    <div className="border-b border-border bg-amber-50/40 px-8 py-3.5">
      <div className="flex items-start gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0 mt-0.5">
          Coach
        </span>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {obs.map((o, i) => (
            <ObsRow key={i} obs={o} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ObsRow({ obs }: { obs: CoachObservation }) {
  return (
    <div className="flex items-start gap-2">
      {obs.severity === "critical" ? (
        <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-health-red" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-health-amber" />
      )}
      <p className="text-xs leading-relaxed text-foreground">
        <span className={cn(
          "font-semibold mr-1",
          obs.severity === "critical" ? "text-health-red" : "text-health-amber"
        )}>
          {obs.title}.
        </span>
        <span className="text-muted-foreground">{obs.question}</span>
      </p>
    </div>
  );
}
