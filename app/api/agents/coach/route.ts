import { createClient } from "@/lib/supabase/server";
import { buildCoachContext, estimateTokens, estimateCost } from "@/lib/agents/coach-context";
import { detectVertical, getPlaybook } from "@/lib/agents/domain-playbooks";
import { getOrgAnthropic, NoKeyError, noKeyResponse } from "@/lib/agents/anthropic-for-org";
import type { DealFull } from "@/lib/supabase/types";

const BASE_SYSTEM = `You are a senior B2B enterprise sales coach. You have spent 20 years in the room with technical founders learning to sell. You know what good looks like and you say so.

TONE — apply these without exception:
- Never open with "Great question", "Absolutely", "Certainly", "That's a tough one", "I understand your frustration", or any validation before substance. Start with the observation.
- Never be condescending. You are talking to an intelligent person learning a new skill, not a student who needs correcting.
- Speak with candour: if a deal looks at risk, name it plainly — "This deal is at risk. Here is why: [specific evidence from the deal]."
- Challenge by questioning, not by telling: "What's your evidence that the CFO supports this?" not "You're assuming the CFO supports this."
- Reference deal specifics — actual names, actual amounts, actual dates from the context. Generic advice is worthless.
- One probing question per response. Never a list of questions.
- Structure: 3–5 sentences of specific observation, then one question.
- Disagree explicitly when the founder's read looks wrong — state your read, your reasoning, then ask what they're seeing that you're not.
- Acknowledge what is working — good discipline deserves recognition without fanfare.
- Do not cheerlead. Your job is rigorous thinking, not comfort.
- Use MEDDPICC by name when coaching on qualification gaps.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { dealId, messages, countOnly } = await req.json() as {
    dealId: string
    messages: ChatMessage[]
    countOnly?: boolean
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: deal } = await db
    .from("deals")
    .select(`
      *,
      account:accounts(*),
      economic_buyer:contacts(*),
      deal_contacts(*, contact:contacts(*)),
      activities(*, contact:contacts(*), user:users(*))
    `)
    .eq("id", dealId)
    .order("created_at", { ascending: false, referencedTable: "activities" })
    .limit(5, { referencedTable: "activities" })
    .single();

  if (!deal) return new Response("Deal not found", { status: 404 });

  // Load last coaching session summary for cross-session memory
  const { data: lastCoach } = await db
    .from("activities")
    .select("agent_summary, created_at")
    .eq("deal_id", dealId)
    .eq("type", "coaching")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Load org context: product narrative, market context, agent model preference
  const { data: orgRaw } = await db
    .from("organizations")
    .select("product_context, market_context, agent_models")
    .eq("id", (deal as unknown as { organization_id: string }).organization_id)
    .single();

  const org = orgRaw as {
    product_context: string | null;
    market_context: string | null;
    agent_models: Record<string, string> | null;
  } | null;

  const productContext = org?.product_context ?? null;
  const marketContext = org?.market_context ?? null;
  const coachModel = org?.agent_models?.coach ?? "claude-opus-4-8";

  // Resolve the org's own Anthropic key (never the app owner's).
  const coachOrgId = (deal as unknown as { organization_id: string }).organization_id;
  let anthropic;
  try {
    anthropic = await getOrgAnthropic(coachOrgId);
  } catch (e) {
    if (e instanceof NoKeyError) return noKeyResponse();
    throw e;
  }

  // Auto-detect vertical from product context and inject domain playbook
  let systemPrompt = BASE_SYSTEM;
  if (productContext) {
    const vertical = detectVertical(productContext);
    if (vertical) {
      systemPrompt += "\n\n" + getPlaybook(vertical);
    }
  }

  const dealContext = buildCoachContext(
    deal as DealFull,
    lastCoach?.agent_summary ?? null,
    productContext,
    marketContext,
  );

  // The opening exchange — seeds the conversation so the user can ask anything
  // or ask for an initial read without the model needing to re-read the context
  const seedMessages: ChatMessage[] = [
    {
      role: "user",
      content: `Here is the deal I want coaching on:\n\n${dealContext}`,
    },
    {
      role: "assistant",
      content: "I've reviewed it. What would you like to work through, or shall I give you my initial read?",
    },
  ];

  const allMessages: ChatMessage[] = [...seedMessages, ...messages];

  if (countOnly) {
    const result = await anthropic.messages.countTokens({
      model: coachModel,
      system: systemPrompt,
      messages: allMessages,
    });
    const inputTokens = result.input_tokens;
    return Response.json({
      inputTokens,
      estimatedCostPerExchange: estimateCost(inputTokens),
    });
  }

  const stream = anthropic.messages.stream({
    model: coachModel,
    max_tokens: 1024,
    system: systemPrompt,
    messages: allMessages,
  });

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
      cancel() {
        stream.abort();
      },
    }),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
    }
  );
}

// Re-export for use in token counting (estimateTokens is used by the client)
export { estimateTokens };
