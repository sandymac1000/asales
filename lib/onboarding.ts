// The get-started sequence, derived rather than stored.
//
// There is deliberately no `onboarding_step` column. A stored cursor drifts:
// someone clears their value narrative and the app still believes they are on
// step 3, or a half-run seed leaves the pointer past work that never happened.
// Reading the four booleans from the data itself is self-healing, needs no
// migration, and gets multi-user right for free — a second person joining an
// established org sees steps 0-2 already satisfied, because they are.

export type StepId = "key" | "narrative" | "market" | "deal";

export const STEP_ORDER: StepId[] = ["key", "narrative", "market", "deal"];

export interface StepCopy {
  id: StepId
  /** Short label for the progress rail. */
  label: string
  /** The chapter framing shown when the step is current. */
  title: string
  blurb: string
}

export const STEPS: Record<StepId, StepCopy> = {
  key: {
    id: "key",
    label: "AI access",
    title: "First, switch the agents on",
    // The awkward truth of this ordering: we ask for a credential before we
    // have shown anything. The copy owns that rather than glossing it.
    blurb:
      "Salient's agents run on your own Anthropic key, billed to you and capped by you. It is the one piece of setup that has to come first, because every agent after this needs it.",
  },
  narrative: {
    id: "narrative",
    label: "Value narrative",
    title: "So you think you have a product…",
    blurb:
      "Before a single deal goes in, the reckoning: what does your product actually do, which business metrics does it move, and what does a bad month cost a customer without it? Most technical founders cannot answer the third one yet. Everything else in Salient is sharper once you can.",
  },
  market: {
    id: "market",
    label: "Market & buyers",
    title: "Who actually buys this",
    blurb:
      "Your ideal customer is a portfolio of hypotheses, not a single guess. Name the core segment and the adjacent ones worth testing, and the coach will stop giving you generic advice.",
  },
  deal: {
    id: "deal",
    label: "First deal",
    title: "Now put a real deal in",
    blurb:
      "With the narrative and the buyer profile in place, the coach has something to reason against. Add a deal you are actually working — the messier the better.",
  },
};

export interface ReadinessInput {
  hasKey: boolean
  productContext: string | null | undefined
  marketContext: string | null | undefined
  segmentCount: number
  /** Real deals only — demo rows must not count as having started. */
  dealCount: number
}

export interface Readiness {
  done: Record<StepId, boolean>
  /** The first unfinished step, or undefined once everything is done. */
  current: StepId | undefined
  complete: boolean
  completedCount: number
}

export function getReadiness(input: ReadinessInput): Readiness {
  const done: Record<StepId, boolean> = {
    key: input.hasKey,
    narrative: Boolean(input.productContext?.trim()),
    market: Boolean(input.marketContext?.trim()) || input.segmentCount > 0,
    deal: input.dealCount > 0,
  };
  const current = STEP_ORDER.find((s) => !done[s]);
  return {
    done,
    current,
    complete: current === undefined,
    completedCount: STEP_ORDER.filter((s) => done[s]).length,
  };
}

/**
 * Whether to interrupt someone heading for the pipeline.
 *
 * Only when they have neither a narrative nor a real deal — i.e. genuinely at
 * the beginning. Someone who has deliberately skipped the narrative but has
 * deals is working; they get a banner, not a redirect.
 */
export function shouldRedirectToStart(r: Readiness): boolean {
  return !r.done.deal && !r.done.narrative;
}
