// Model and budget defaults for every agent, in one place.
//
// These were previously hardcoded in five separate routes, which meant a model
// upgrade was five edits and a chance to miss one. An org can still override
// per agent via organizations.agent_models; these are the fallbacks.

export const DEFAULT_MODELS = {
  coach: "claude-opus-5",
  scorecard: "claude-opus-5",
  market: "claude-opus-5",
  debrief: "claude-opus-5",
  // Scoring is a narrower judgement than coaching, and Sonnet 5 is both
  // cheaper and newer than the Sonnet 4.6 this used to pin.
  qualify: "claude-sonnet-5",
} as const;

export type AgentName = keyof typeof DEFAULT_MODELS;

/**
 * Ceiling for a streamed conversational turn.
 *
 * This was 1024, which truncated coaching replies mid-sentence — and on these
 * models thinking tokens count against the same ceiling, so a low cap can be
 * spent entirely on reasoning before a single word reaches the user. These
 * requests stream, so a high ceiling costs nothing in latency or HTTP timeout
 * risk; it is a cap, not a target, and response length is governed by the
 * system prompt.
 */
export const DIALOGUE_MAX_TOKENS = 16000;

/** Ceiling for a non-streamed structured extraction (tool call or JSON). */
export const EXTRACTION_MAX_TOKENS = 8000;

/** Ceiling for the debrief agent, the longest structured output we ask for. */
export const DEBRIEF_MAX_TOKENS = 16000;

/**
 * Effort for interactive agents. Thinking is on by default on these models;
 * `medium` keeps the pause before the first token reasonable in a chat UI.
 * The debrief agent deliberately does not set this — it writes to deal
 * records, so it runs at the default (`high`).
 */
export const DIALOGUE_EFFORT = "medium" as const;

/**
 * Minimum confidence for a debrief extraction to be offered to the user.
 *
 * The prompt already tells the model "below 0.5 = don't include", but an
 * instruction is not an enforcement: nothing stopped a 0.3 proposal reaching
 * the Apply button. Keep this in step with the prompt in lib/agents/debrief.ts.
 */
export const MIN_DEBRIEF_CONFIDENCE = 0.5;

// ── Pricing ─────────────────────────────────────────────────────────────────
// USD per million tokens. Cache reads bill at roughly a tenth of input and
// cache writes at roughly 1.25x, which is why they are metered separately —
// on the coach, where the deal brief is cached, they are most of the input.
//
// These are Anthropic first-party rates and they move: this table is what
// Salient *estimates* from. An org's own console is the authoritative number,
// and the UI says so rather than implying our figure is the bill.
export interface ModelPrice {
  /** USD per 1M uncached input tokens. */
  input: number
  /** USD per 1M output tokens. */
  output: number
}

export const MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-opus-4-7": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/** Falls back to Opus rates, so an unknown model over-estimates rather than under. */
export const FALLBACK_PRICE: ModelPrice = { input: 5, output: 25 };

const CACHE_READ_MULTIPLIER = 0.1;
const CACHE_WRITE_MULTIPLIER = 1.25;

export interface TokenCounts {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

/** Estimated USD for one call. */
export function estimateCallCost(model: string, t: TokenCounts): number {
  const p = MODEL_PRICES[model] ?? FALLBACK_PRICE;
  const cacheRead = t.cache_read_input_tokens ?? 0;
  const cacheWrite = t.cache_creation_input_tokens ?? 0;
  return (
    t.input_tokens * p.input +
    cacheRead * p.input * CACHE_READ_MULTIPLIER +
    cacheWrite * p.input * CACHE_WRITE_MULTIPLIER +
    t.output_tokens * p.output
  ) / 1_000_000;
}
