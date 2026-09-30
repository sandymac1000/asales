import { createClient } from "@/lib/supabase/server";
import { estimateCallCost } from "@/lib/agents/models";
import type { AgentName } from "@/lib/agents/models";

// Month-to-date agent spend for the calling org.
//
// Read with the caller's own client, not the service role: agent_usage has a
// select policy scoped to the member's org, so RLS is what enforces the
// boundary here rather than application code.
//
// Every figure is an ESTIMATE from our own token counts and a price table that
// Anthropic can change. The org's console is authoritative, and the UI says so.

interface UsageRow {
  agent: AgentName
  model: string
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
  partial: boolean
  created_at: string
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Start of the current UTC month.
  const now = new Date();
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("agent_usage")
    .select("agent, model, input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens, partial, created_at")
    .gte("created_at", since);

  if (error) {
    // Most likely the 020 migration hasn't been run yet. Report that plainly
    // rather than showing a confident £0.00.
    return Response.json({ available: false, reason: error.message }, { status: 200 });
  }

  const rows = (data ?? []) as UsageRow[];

  let totalCost = 0;
  let calls = 0;
  let cachedInput = 0;
  let uncachedInput = 0;
  let partialCalls = 0;
  const byAgent: Record<string, { calls: number; cost: number }> = {};

  for (const r of rows) {
    const cost = estimateCallCost(r.model, r);
    totalCost += cost;
    calls += 1;
    cachedInput += r.cache_read_input_tokens ?? 0;
    uncachedInput += r.input_tokens ?? 0;
    if (r.partial) partialCalls += 1;
    const slot = byAgent[r.agent] ?? { calls: 0, cost: 0 };
    slot.calls += 1;
    slot.cost += cost;
    byAgent[r.agent] = slot;
  }

  return Response.json({
    available: true,
    since,
    calls,
    partialCalls,
    estimatedCostUsd: totalCost,
    // What caching actually saved, as a share of input tokens served.
    cachedInputTokens: cachedInput,
    uncachedInputTokens: uncachedInput,
    byAgent,
  });
}
