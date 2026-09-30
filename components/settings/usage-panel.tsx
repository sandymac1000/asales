"use client";

import { useState, useEffect } from "react";
import { Gauge, Loader2 } from "lucide-react";

const AGENT_LABELS: Record<string, string> = {
  coach: "Deal coach",
  scorecard: "Value narrative",
  market: "Market & buyers",
  qualify: "Qualification",
  debrief: "Debrief",
};

interface UsageSummary {
  available: boolean
  reason?: string
  since?: string
  calls?: number
  partialCalls?: number
  estimatedCostUsd?: number
  cachedInputTokens?: number
  uncachedInputTokens?: number
  byAgent?: Record<string, { calls: number; cost: number }>
}

function usd(n: number): string {
  // Sub-cent totals are normal early on; "$0.00" would read as "nothing ran".
  if (n > 0 && n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

export function UsagePanel() {
  const [data, setData] = useState<UsageSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/org/usage")
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((d) => { if (active) setData(d); })
      .catch(() => { if (active) setData({ available: false }); });
    return () => { active = false; };
  }, []);

  const month = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const cached = data?.cachedInputTokens ?? 0;
  const uncached = data?.uncachedInputTokens ?? 0;
  const cacheShare = cached + uncached > 0 ? Math.round((cached / (cached + uncached)) * 100) : 0;

  const agents = Object.entries(data?.byAgent ?? {}).sort((a, b) => b[1].cost - a[1].cost);

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold text-foreground">Agent usage · {month}</span>
        {data === null && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      {data && !data.available ? (
        <p className="text-xs text-muted-foreground">
          Usage metering isn&apos;t switched on yet — it needs migration{" "}
          <span className="font-mono">020_usage_and_demo.sql</span>.
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold text-foreground">
              {usd(data?.estimatedCostUsd ?? 0)}
            </span>
            <span className="text-xs text-muted-foreground">
              across {data?.calls ?? 0} agent {data?.calls === 1 ? "call" : "calls"}
            </span>
          </div>

          {agents.length > 0 && (
            <ul className="space-y-1">
              {agents.map(([agent, v]) => (
                <li key={agent} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {AGENT_LABELS[agent] ?? agent}
                    <span className="ml-1.5 text-muted-foreground/70">· {v.calls}</span>
                  </span>
                  <span className="font-mono text-foreground">{usd(v.cost)}</span>
                </li>
              ))}
            </ul>
          )}

          {cacheShare > 0 && (
            <p className="text-xs text-muted-foreground">
              {cacheShare}% of input tokens were served from cache this month, billed at roughly a
              tenth of the normal rate.
            </p>
          )}

          {(data?.partialCalls ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              {data?.partialCalls} {data?.partialCalls === 1 ? "call was" : "calls were"} stopped
              part-way, so the figure above is slightly under-counted.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            This is our own estimate from token counts and published prices. The authoritative
            number is on{" "}
            <a
              href="https://console.anthropic.com/settings/usage"
              target="_blank" rel="noreferrer"
              className="text-accent hover:underline"
            >
              your Anthropic usage page
            </a>
            . If the two ever disagree meaningfully, trust theirs and tell us.
          </p>
        </>
      )}
    </div>
  );
}
