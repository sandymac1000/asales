import type Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/service";
import type { AgentName } from "@/lib/agents/models";

// Records what each agent call cost, in tokens, against the org whose key paid
// for it. Written with the service role: agent_usage has a read policy for
// members and no write policy at all, so a client can neither forge a row nor
// quietly erase one.
//
// Metering must never be able to break an agent. Every function here swallows
// its own errors — a failed write costs us a usage row, while a thrown error
// would cost the user their answer.

export interface RecordUsageArgs {
  organizationId: string
  userId?: string | null
  agent: AgentName
  model: string
  usage: Anthropic.Usage | TokenLike | null | undefined
  dealId?: string | null
  /** True when a streamed call was cancelled and the totals are incomplete. */
  partial?: boolean
}

interface TokenLike {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
}

export async function recordUsage(args: RecordUsageArgs): Promise<void> {
  const u = args.usage as TokenLike | null | undefined;
  if (!u) return;
  try {
    const svc = createServiceClient();
    await svc.from("agent_usage").insert({
      organization_id: args.organizationId,
      user_id: args.userId ?? null,
      agent: args.agent,
      model: args.model,
      input_tokens: u.input_tokens ?? 0,
      output_tokens: u.output_tokens ?? 0,
      cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
      deal_id: args.dealId ?? null,
      partial: args.partial ?? false,
    });
  } catch (e) {
    console.error("[usage] failed to record agent usage:", e);
  }
}

/**
 * Accumulates usage from a stream's events.
 *
 * Streamed calls don't hand you a usage object: input and cache counts arrive
 * on `message_start`, and output tokens accrue on `message_delta`. Callers
 * feed every event through `add` and read `totals` once the stream ends —
 * including when the user cancelled it, which is why `partial` exists.
 */
export interface TokenTotals {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export function createUsageAccumulator() {
  const totals: TokenTotals = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  };

  function add(event: Anthropic.MessageStreamEvent): void {
    if (event.type === "message_start") {
      const u = event.message.usage as TokenLike | undefined;
      totals.input_tokens += u?.input_tokens ?? 0;
      totals.cache_read_input_tokens += u?.cache_read_input_tokens ?? 0;
      totals.cache_creation_input_tokens += u?.cache_creation_input_tokens ?? 0;
      totals.output_tokens += u?.output_tokens ?? 0;
    } else if (event.type === "message_delta") {
      const u = event.usage as TokenLike | undefined;
      // message_delta reports the running output total, not an increment.
      totals.output_tokens = u?.output_tokens ?? totals.output_tokens;
    }
  }

  return { add, totals };
}
