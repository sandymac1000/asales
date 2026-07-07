"use client";

import { useState, useEffect } from "react";
import { Layers, Sparkles, RefreshCw, Ban, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketSegment } from "@/lib/supabase/types";

const PROFILE_LABELS: Record<string, string> = {
  industry: "Industry", size: "Size", geography: "Geography",
  buyer_title: "Buyer title", measured_on: "Measured on", trigger: "Trigger",
  champion: "Champion", objections: "Objections", terminology: "Terminology",
};

function confidenceColour(c: number): string {
  if (c >= 60) return "bg-emerald-500";
  if (c >= 35) return "bg-amber-500";
  return "bg-muted-foreground";
}

export function SegmentsPanel({
  canSynthesize,
  synthInput,
}: {
  canSynthesize: boolean;
  synthInput: string;
}) {
  const [segments, setSegments] = useState<MarketSegment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/agents/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list" }),
    })
      .then((r) => (r.ok ? r.json() : { segments: [] }))
      .then((d) => { if (active) setSegments(d.segments ?? []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  async function synthesize() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "synthesize",
          messages: [{ role: "user", content: synthInput }],
        }),
      });
      if (!res.ok) { setError(await res.text()); return; }
      const { segments } = await res.json();
      setSegments(segments);
    } catch {
      setError("Something went wrong generating segments.");
    } finally {
      setBusy(false);
    }
  }

  async function adjust(segmentId: string, patch: { confidence?: number; status?: "active" | "disproven" }) {
    // optimistic
    setSegments((prev) => prev.map((s) => (s.id === segmentId ? { ...s, ...patch } : s)));
    await fetch("/api/agents/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "adjust", segmentId, ...patch }),
    });
  }

  const core = segments.filter((s) => s.kind === "core");
  const adjacent = segments.filter((s) => s.kind === "adjacent");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold text-foreground">Segment hypotheses</span>
        </div>
        <button
          onClick={synthesize}
          disabled={busy || !canSynthesize}
          title={canSynthesize ? undefined : "Save a market profile first"}
          className="flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-40 disabled:no-underline"
        >
          {busy ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {segments.length ? "Refresh from profile" : "Generate from profile"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {segments.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">
          Turn your market profile into a core ICP plus adjacent buyers and markets — each with a confidence that updates as deals close. {canSynthesize ? "Generate to begin." : "Save a market profile above first."}
        </p>
      )}

      {[...core, ...adjacent].map((s) => (
        <SegmentCard key={s.id} segment={s} onAdjust={adjust} />
      ))}
    </div>
  );
}

function SegmentCard({
  segment: s,
  onAdjust,
}: {
  segment: MarketSegment;
  onAdjust: (id: string, patch: { confidence?: number; status?: "active" | "disproven" }) => void;
}) {
  const [confidence, setConfidence] = useState(s.confidence);
  const disproven = s.status === "disproven";
  const profileEntries = Object.entries(s.profile ?? {}).filter(([, v]) => v);

  return (
    <div className={cn(
      "rounded-md border p-4 space-y-3",
      disproven ? "border-border bg-muted/30 opacity-60" : "border-border bg-card"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{s.label}</span>
          <Badge>{s.kind === "core" ? "Core" : "Adjacent"}</Badge>
          <Badge>{s.axis === "buyer" ? "Buyer" : "Market"}</Badge>
          {s.evidence_count > 0 && (
            <Badge>{s.evidence_count} deal{s.evidence_count === 1 ? "" : "s"}</Badge>
          )}
        </div>
        <button
          onClick={() => onAdjust(s.id, { status: disproven ? "active" : "disproven" })}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {disproven ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
          {disproven ? "Reactivate" : "Disprove"}
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-mono text-foreground">{confidence}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", confidenceColour(confidence))} style={{ width: `${confidence}%` }} />
        </div>
        <input
          type="range" min={0} max={100} value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          onPointerUp={() => onAdjust(s.id, { confidence })}
          onKeyUp={() => onAdjust(s.id, { confidence })}
          className="w-full accent-accent cursor-pointer"
        />
        {s.confidence_rationale && (
          <p className="text-xs text-muted-foreground italic">
            {s.confidence_rationale}
            {s.source === "evidence" && " · from deal evidence"}
          </p>
        )}
      </div>

      {profileEntries.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {profileEntries.map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt className="text-muted-foreground shrink-0">{PROFILE_LABELS[k] ?? k}:</dt>
              <dd className="text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}
