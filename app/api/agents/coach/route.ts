import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildCoachContext, estimateTokens, estimateCost } from "@/lib/agents/coach-context";
import { resolvePlaybook, getPlaybook, VERTICAL_LABELS } from "@/lib/agents/domain-playbooks";
import { getOrgAnthropic, NoKeyError, noKeyResponse } from "@/lib/agents/anthropic-for-org";
import { DEFAULT_MODELS, DIALOGUE_MAX_TOKENS, DIALOGUE_EFFORT } from "@/lib/agents/models";
import { recordUsage, createUsageAccumulator } from "@/lib/agents/usage";
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

  const { dealId, messages, countOnly, setPlaybook } = await req.json() as {
    dealId: string
    messages: ChatMessage[]
    countOnly?: boolean
    /** Persist an explicit playbook choice for this deal, then return. */
    setPlaybook?: string
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // An explicit playbook choice is a deterministic write, deliberately not
  // something the model can do to itself mid-conversation.
  if (setPlaybook !== undefined) {
    const value = setPlaybook === "auto" ? null : setPlaybook;
    await db.from("deals").update({ coach_playbook: value }).eq("id", dealId);
    return Response.json({ ok: true, coach_playbook: value });
  }

  const { data: deal } = await db
    .from("deals")
    .select(`
      *,
      account:accounts(*),
      economic_buyer:contacts(*),
      segment:market_segments(label, profile),
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
  const coachModel = org?.agent_models?.coach ?? DEFAULT_MODELS.coach;

  // Resolve the org's own Anthropic key (never the app owner's).
  const coachOrgId = (deal as unknown as { organization_id: string }).organization_id;
  let anthropic;
  try {
    anthropic = await getOrgAnthropic(coachOrgId);
  } catch (e) {
    if (e instanceof NoKeyError) return noKeyResponse();
    throw e;
  }

  // Resolve the playbook for THIS deal, not for the org. A founder selling
  // into two verticals needs different coaching on each.
  const dealRow = deal as unknown as {
    coach_playbook: string | null
    account: { name: string | null; industry: string | null } | null
    segment: { label: string | null; profile: string | null } | null
  };
  const resolved = resolvePlaybook({
    override: dealRow.coach_playbook,
    segmentText: [dealRow.segment?.label, dealRow.segment?.profile].filter(Boolean).join(" "),
    accountText: [dealRow.account?.industry, dealRow.account?.name].filter(Boolean).join(" "),
    productContext,
  });

  let systemPrompt = BASE_SYSTEM;
  if (resolved.vertical) {
    systemPrompt += "\n\n" + getPlaybook(resolved.vertical);
  }
  // Tell the coach what it is running on, so that "which playbook are you
  // using?" gets a true answer rather than a plausible guess. Without this the
  // model has no reliable way to know, and would confabulate one.
  systemPrompt += `\n\n=== YOUR CURRENT TUNING ===
Domain playbook in use: ${resolved.vertical ? VERTICAL_LABELS[resolved.vertical] : "none — you are coaching from general enterprise-sales judgement only"}.
Chosen because: ${{
    override: "the user set it explicitly for this deal",
    segment: "it matches the market segment this deal is tagged to",
    account: "it matches this account's industry",
    product: "it matches the organisation's product description (a weaker signal — it describes what they sell, not who they sell to)",
    none: "nothing in the deal matched a playbook confidently enough",
  }[resolved.source]}.
If asked which playbook or domain you are using, answer with exactly this and do not speculate beyond it. If the conversation makes clear the deal actually sits in a different domain, say so plainly and tell them they can change it above the chat — do not pretend to have switched.
=== END TUNING ===`;

  const dealContext = buildCoachContext(
    deal as DealFull,
    lastCoach?.agent_summary ?? null,
    productContext,
    marketContext,
  );

  // The opening exchange — seeds the conversation so the user can ask anything
  // or ask for an initial read without the model needing to re-read the context
  //
  // The cache breakpoint sits on the deal context, the last stable block of the
  // prefix. Caching is a prefix match, so one breakpoint here covers the system
  // prompt, the domain playbook (~1,000 tokens on its own) and the whole deal
  // brief — every turn of a coaching session re-sends all of that unchanged.
  // Cached reads bill at roughly a tenth of input, and since each org pays with
  // its own Anthropic key, this comes straight off their bill. Everything that
  // varies per turn (the user's actual messages) stays after the breakpoint.
  const seedMessages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Here is the deal I want coaching on:\n\n${dealContext}`,
          cache_control: { type: "ephemeral" },
        },
      ],
    },
    {
      role: "assistant",
      content: "I've reviewed it. What would you like to work through, or shall I give you my initial read?",
    },
  ];

  const allMessages: Anthropic.MessageParam[] = [...seedMessages, ...messages];

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
      playbook: {
        vertical: resolved.vertical,
        label: resolved.label,
        source: resolved.source,
        options: VERTICAL_LABELS,
      },
    });
  }

  const stream = anthropic.messages.stream({
    model: coachModel,
    max_tokens: DIALOGUE_MAX_TOKENS,
    output_config: { effort: DIALOGUE_EFFORT },
    system: systemPrompt,
    messages: allMessages,
  });

  const encoder = new TextEncoder();

  // Usage is not handed to you on a streamed call: input and cache counts
  // arrive on message_start, output accrues on message_delta. Accumulate as
  // events pass through and write one row once the stream ends — including
  // when the user cancelled it, which under-reports and is flagged as partial.
  const meter = createUsageAccumulator();
  let cancelled = false;

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            meter.add(event);
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
          // Never let metering break the response.
          await recordUsage({
            organizationId: coachOrgId, userId: user.id, agent: "coach",
            model: coachModel, usage: meter.totals, dealId, partial: cancelled,
          });
        }
      },
      cancel() {
        cancelled = true;
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
