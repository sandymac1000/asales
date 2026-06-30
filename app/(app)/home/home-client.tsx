"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Tooltip, Legend,
} from "chart.js";
import Link from "next/link";
import { AlertCircle, Clock, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const STAGE_LABELS: Record<string, string> = {
  exploring: "Exploring",
  qualifying: "Qualifying",
  proposing: "Proposing",
  closing: "Closing",
};

interface StageGroup { stage: string; count: number; acv: number }

interface Props {
  year: number
  currentQ: number
  wonByQ: number[]
  targets: (number | null)[]
  annualTarget: number | null
  currentWon: number
  currentTarget: number | null
  pipelineAcv: number
  stageGroups: StageGroup[]
  overdueCount: number
  dueTodayCount: number
}

export function HomeClient({
  year, currentQ, wonByQ, targets, annualTarget,
  currentWon, currentTarget, pipelineAcv,
  stageGroups, overdueCount, dueTodayCount,
}: Props) {
  const coverage = currentTarget && currentTarget > 0
    ? pipelineAcv / currentTarget : null;

  const coverageColour = coverage == null
    ? "text-muted-foreground"
    : coverage >= 3 ? "text-health-green"
    : coverage >= 2 ? "text-health-amber"
    : "text-health-red";

  const wonAnnual = wonByQ.reduce((s, v) => s + v, 0);

  // Chart data — values in £ thousands for readability
  const labels = ["Q1", "Q2", "Q3", "Q4"];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Won ACV",
        data: wonByQ.map((v) => Math.round(v / 100)), // pence → pounds → no thousands needed, Chart formats
        backgroundColor: "#c96442",
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Target",
        data: targets.map((t) => t != null ? Math.round(t / 100) : 0),
        backgroundColor: "#e8e0d4",
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 2,
          useBorderRadius: true,
          font: { size: 11, family: "system-ui" },
          color: "#6b6259",
        },
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) =>
            `${ctx.dataset.label ?? ""}: £${Number(ctx.raw).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, family: "system-ui" }, color: "#6b6259" },
        border: { display: false },
      },
      y: {
        grid: { color: "#f0ece5" },
        ticks: {
          font: { size: 11, family: "system-ui" },
          color: "#6b6259",
          callback: (v: number | string) => `£${Number(v).toLocaleString()}`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{year}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your number at a glance</p>
      </div>

      {/* Current quarter summary */}
      <div className="grid grid-cols-3 gap-4">
        <Stat
          label={`Q${currentQ} Won`}
          value={formatCurrency(currentWon)}
          sub={currentTarget ? `of ${formatCurrency(currentTarget)} target` : "no target set"}
          accent={currentTarget != null && currentWon >= currentTarget}
        />
        <Stat
          label="Active Pipeline"
          value={formatCurrency(pipelineAcv)}
          sub={`Q${currentQ} open deals`}
        />
        <Stat
          label="Coverage"
          value={coverage != null ? `${coverage.toFixed(1)}×` : "—"}
          sub={coverage != null
            ? coverage >= 3 ? "healthy" : coverage >= 2 ? "tight" : "at risk"
            : "set a target to calculate"}
          valueClassName={coverageColour}
        />
      </div>

      {/* Attention banner */}
      {(overdueCount > 0 || dueTodayCount > 0) && (
        <div className="flex items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-health-amber shrink-0" />
          <div className="flex gap-4 text-sm">
            {overdueCount > 0 && (
              <span className="text-foreground">
                <strong>{overdueCount}</strong> overdue next {overdueCount === 1 ? "action" : "actions"}
              </span>
            )}
            {dueTodayCount > 0 && (
              <span className="text-foreground">
                <strong>{dueTodayCount}</strong> due today
              </span>
            )}
          </div>
          <Link href="/pipeline" className="ml-auto text-xs text-accent hover:underline shrink-0">
            Go to pipeline →
          </Link>
        </div>
      )}

      {/* Chart + annual */}
      <div className="grid grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Won vs Target — {year}</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-sm bg-accent" />
              Won
              <span className="inline-block h-2 w-2 rounded-sm bg-[#e8e0d4] ml-2" />
              Target
            </div>
          </div>
          <div className="h-52">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Annual target card */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Annual</h2>
            <p className="text-xs text-muted-foreground">{year} total</p>
          </div>
          <div className="space-y-3 mt-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Won to date</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(wonAnnual)}</p>
            </div>
            {annualTarget != null && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Target</p>
                  <p className="text-lg font-medium text-muted-foreground">{formatCurrency(annualTarget)}</p>
                </div>
                <div className="w-full rounded-full bg-muted h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(wonAnnual / annualTarget * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(wonAnnual / annualTarget * 100)}% of annual target
                </p>
              </>
            )}
            {annualTarget == null && (
              <Link href="/settings" className="text-xs text-accent hover:underline">
                Set annual target →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline by stage */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Pipeline
          </h2>
          <Link href="/pipeline" className="text-xs text-accent hover:underline">
            Open pipeline →
          </Link>
        </div>
        <div className="grid grid-cols-4 divide-x divide-border">
          {stageGroups.map((g) => (
            <div key={g.stage} className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1">{STAGE_LABELS[g.stage]}</p>
              <p className="text-lg font-semibold text-foreground">{g.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(g.acv)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label, value, sub, accent, valueClassName,
}: {
  label: string; value: string; sub?: string; accent?: boolean; valueClassName?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <p className={cn(
        "text-2xl font-semibold",
        accent ? "text-health-green" : valueClassName ?? "text-foreground"
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
