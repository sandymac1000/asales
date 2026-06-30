"use client";

import { useState } from "react";
import Link from "next/link";
import { ConceptBadge } from "@/components/learn/concept-badge";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  quarterLabel: string           // e.g. "Q2 2026"
  yearLabel: string              // e.g. "2026"
  wonAcvQ: number               // won ACV this quarter (pence)
  wonAcvY: number               // won ACV this year (pence)
  pipelineAcv: number           // all active deals ACV (pence)
  quarterlyTarget: number | null
  annualTarget: number | null
}

export function ForecastStrip({
  quarterLabel, yearLabel,
  wonAcvQ, wonAcvY,
  pipelineAcv,
  quarterlyTarget, annualTarget,
}: Props) {
  const [period, setPeriod] = useState<"quarter" | "year">("quarter");

  const wonAcv = period === "quarter" ? wonAcvQ : wonAcvY;
  const target = period === "quarter" ? quarterlyTarget : annualTarget;
  const label = period === "quarter" ? quarterLabel : yearLabel;

  const remaining = target != null ? Math.max(0, target - wonAcv) : null;
  const coverage = remaining != null && remaining > 0
    ? pipelineAcv / remaining
    : target != null && wonAcv >= target
    ? Infinity
    : null;

  const coverageLabel = coverage === Infinity
    ? "Target hit"
    : coverage != null
    ? `${coverage.toFixed(1)}×`
    : "—";

  const coverageColour =
    coverage === Infinity ? "text-health-green" :
    coverage == null ? "text-muted-foreground" :
    coverage >= 3 ? "text-health-green" :
    coverage >= 2 ? "text-health-amber" :
    "text-health-red";

  const hasTarget = target != null;

  return (
    <div className="border-b border-border bg-card px-8 py-3">
      <div className="flex items-center gap-6">
        {/* Period toggle */}
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-background">
          <button
            onClick={() => setPeriod("quarter")}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              period === "quarter" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {quarterLabel}
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              period === "year" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {yearLabel}
          </button>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Won */}
        <Stat
          label="Won"
          value={hasTarget
            ? `${formatCurrency(wonAcv)} / ${formatCurrency(target!)}`
            : formatCurrency(wonAcv)
          }
          valueClass={hasTarget && wonAcv >= target! ? "text-health-green" : "text-foreground"}
        />

        {/* Pipeline */}
        <Stat label="Pipeline" value={formatCurrency(pipelineAcv)} />

        {/* Coverage */}
        <div className="flex items-center gap-1.5">
          <Stat
            label="Coverage"
            value={coverageLabel}
            valueClass={coverageColour}
          />
          <ConceptBadge slug="pipeline_coverage" />
        </div>

        {!hasTarget && (
          <>
            <div className="h-4 w-px bg-border" />
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Set {period === "quarter" ? "quarterly" : "annual"} target →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-mono font-medium", valueClass ?? "text-foreground")}>{value}</p>
    </div>
  );
}
