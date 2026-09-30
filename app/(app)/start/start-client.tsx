"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Circle, Loader2, PlayCircle, Sparkles, Trash2 } from "lucide-react";
import { ApiKeyPanel } from "@/components/settings/api-key-panel";
import { ScorecardAgent } from "@/components/settings/scorecard-agent";
import { MarketAgent } from "@/components/settings/market-agent";
import { STEPS, STEP_ORDER, type Readiness, type StepId } from "@/lib/onboarding";

export function StartClient({
  orgName, readiness, productContext, marketContext, inDemo,
}: {
  orgName: string
  readiness: Readiness
  productContext: string | null
  marketContext: string | null
  inDemo: boolean
}) {
  const router = useRouter();
  // The sequence decides where you land; you can still step back to revisit.
  const [viewing, setViewing] = useState<StepId>(readiness.current ?? "deal");
  const [busy, setBusy] = useState<null | "seed" | "clear">(null);
  const [error, setError] = useState<string | null>(null);

  async function demo(action: "seed" | "clear") {
    setBusy(action); setError(null);
    const res = await fetch(`/api/demo/${action}`, { method: "POST" });
    setBusy(null);
    if (!res.ok) { setError(await res.text()); return; }
    router.push(action === "seed" ? "/pipeline" : "/start");
    router.refresh();
  }

  const step = STEPS[viewing];

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{orgName}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {readiness.complete ? "You're set up" : "Getting started"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {readiness.complete
          ? "Everything's in place. This page stays here if you want to revisit any of it."
          : "Four steps, in this order. Each one makes the next one sharper."}
      </p>

      {/* Progress rail */}
      <ol className="mt-7 space-y-1">
        {STEP_ORDER.map((id, i) => {
          const done = readiness.done[id];
          const isCurrent = id === viewing;
          return (
            <li key={id}>
              <button
                onClick={() => setViewing(id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                  isCurrent ? "bg-accent/10" : "hover:bg-surface"
                }`}
              >
                {done
                  ? <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  : <Circle className={`h-4 w-4 shrink-0 ${isCurrent ? "text-accent" : "text-muted-foreground/50"}`} />}
                <span className={`text-sm ${done ? "text-muted-foreground" : "text-foreground"}`}>
                  <span className="text-muted-foreground/70 mr-1.5">{i + 1}.</span>
                  {STEPS[id].label}
                </span>
                {done && <span className="ml-auto text-xs text-muted-foreground">done</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Current step */}
      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">{step.title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{step.blurb}</p>

        <div className="mt-5">
          {viewing === "key" && <ApiKeyPanel />}

          {viewing === "narrative" && (
            <ScorecardAgent savedContext={productContext} onSaved={() => router.refresh()} />
          )}

          {viewing === "market" && (
            <MarketAgent
              marketContext={marketContext}
              productContext={productContext}
              onSaved={() => router.refresh()}
            />
          )}

          {viewing === "deal" && (
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Sparkles className="h-4 w-4" />
              {readiness.done.deal ? "Go to your pipeline" : "Add your first deal"}
            </Link>
          )}
        </div>
      </section>

      {/* Demo door — the way to see the product before handing over a key */}
      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        {inDemo ? (
          <>
            <h3 className="text-sm font-semibold text-foreground">You&apos;re exploring demo data</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              The deals in your pipeline are worked examples, and the agent output on them is
              pre-written rather than live. Clear them whenever you want to start for real —
              nothing of yours is touched.
            </p>
            <button
              onClick={() => demo("clear")}
              disabled={busy !== null}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-foreground hover:bg-card transition-colors disabled:opacity-50"
            >
              {busy === "clear" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Clear the demo data
            </button>
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-foreground">Want a look around first?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Load three worked deals with example coaching, and explore the whole product before
              deciding about an API key. The agent output is pre-written and labelled as such —
              nothing calls Anthropic, so it costs you nothing.
            </p>
            <button
              onClick={() => demo("seed")}
              disabled={busy !== null}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-background transition-colors disabled:opacity-50"
            >
              {busy === "seed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
              Show me around
            </button>
          </>
        )}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </section>
    </div>
  );
}
