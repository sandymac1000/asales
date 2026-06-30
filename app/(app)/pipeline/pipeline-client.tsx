"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DealCard } from "@/components/deal/deal-card";
import { NewDealModal } from "@/components/deal/new-deal-modal";
import { ForecastStrip } from "@/components/pipeline/forecast-strip";
import { ACTIVE_STAGES, STAGE_LABELS, formatCurrency } from "@/lib/format";
import type { DealWithAccount, Stage, Health } from "@/lib/supabase/types";

interface Props {
  deals: (DealWithAccount & { meddpicc_healths: (Health | null)[] })[]
  wonAcvQ: number
  wonAcvY: number
  pipelineAcv: number
  quarterLabel: string
  yearLabel: string
  quarterlyTarget: number | null
  annualTarget: number | null
}

export function PipelineClient({
  deals,
  wonAcvQ, wonAcvY, pipelineAcv,
  quarterLabel, yearLabel,
  quarterlyTarget, annualTarget,
}: Props) {
  const [showNew, setShowNew] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<Stage>>(new Set());

  function toggle(stage: Stage) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(stage) ? next.delete(stage) : next.add(stage);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {deals.length} active {deals.length === 1 ? "deal" : "deals"}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          New deal
        </button>
      </div>

      {/* Forecast strip */}
      <ForecastStrip
        quarterLabel={quarterLabel}
        yearLabel={yearLabel}
        wonAcvQ={wonAcvQ}
        wonAcvY={wonAcvY}
        pipelineAcv={pipelineAcv}
        quarterlyTarget={quarterlyTarget}
        annualTarget={annualTarget}
      />

      {/* Stage groups */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {deals.length === 0 ? (
          <PipelineEmptyState onNew={() => setShowNew(true)} />
        ) : (
          ACTIVE_STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            const isCollapsed = collapsed.has(stage);
            const totalAcv = stageDeals.reduce((sum, d) => sum + (d.acv_value ?? 0), 0);

            return (
              <section key={stage}>
                <button
                  onClick={() => toggle(stage)}
                  className="flex w-full items-center gap-3 pb-3 text-left group"
                >
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    {STAGE_LABELS[stage]}
                  </h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                    {stageDeals.length}
                  </span>
                  {totalAcv > 0 && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatCurrency(totalAcv)} ACV
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground group-hover:text-foreground">
                    {isCollapsed ? "show" : "hide"}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {stageDeals.length === 0 ? (
                      <StageEmptyState stage={stage} />
                    ) : (
                      stageDeals.map((deal) => (
                        <DealCard key={deal.id} deal={deal} />
                      ))
                    )}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>

      {showNew && <NewDealModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function PipelineEmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-base font-medium text-foreground">No active deals yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Every deal starts with five questions: who is the economic buyer, what
        is the pain, what does success look like, what is the next action, and
        when is it happening.
      </p>
      <button
        onClick={onNew}
        className="mt-6 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" />
        Add your first deal
      </button>
    </div>
  );
}

function StageEmptyState({ stage }: { stage: Stage }) {
  const prompts: Record<Stage, string> = {
    exploring: "Deals you are in initial conversations with live here.",
    qualifying: "Deals where you have confirmed pain and met the economic buyer.",
    proposing: "Deals where you have submitted a formal proposal.",
    closing: "Deals in final commercial and legal negotiation.",
    won: "",
    lost: "",
  };
  return (
    <p className="col-span-full text-sm text-muted-foreground py-2">
      {prompts[stage]}
    </p>
  );
}
