import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildCoachContext, estimateTokens, estimateCost } from "@/lib/agents/coach-context";
import type { DealFull } from "@/lib/supabase/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a seasoned B2B enterprise sales coach with 20 years of experience helping technical founders close their first significant deals. You have been given a snapshot of a specific deal.

Your style:
- Direct and specific — reference actual names, numbers, and dates from the deal data
- One probing question per response — never a list of questions
- Name the problem clearly before asking the question
- Explain WHY a gap matters, not just that it exists
- Use MEDDPICC by name — this is a teaching moment
- Be honest: if a deal looks at risk, say so clearly
- Acknowledge what is working — good hygiene deserves recognition
- Keep responses to 3-5 sentences then one question
- Do not cheerlead. Your job is rigorous thinking, not comfort.`;

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

  // Load org product context (value narrative from Settings scorecard agent)
  const { data: orgRaw } = await db
    .from("organizations")
    .select("product_context")
    .eq("id", (deal as unknown as { organization_id: string }).organization_id)
    .single();
  const productContext = (orgRaw as { product_context: string | null } | null)?.product_context ?? null;

  const dealContext = buildCoachContext(deal as DealFull, lastCoach?.agent_summary ?? null, productContext);

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
      model: "claude-opus-4-8",
      system: SYSTEM,
      messages: allMessages,
    });
    const inputTokens = result.input_tokens;
    return Response.json({
      inputTokens,
      estimatedCostPerExchange: estimateCost(inputTokens),
    });
  }

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: SYSTEM,
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
