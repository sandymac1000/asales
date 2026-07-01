import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are an expert at helping technical founders articulate their target market and ideal buyer profile for enterprise sales coaching purposes.

Your job is to have a structured conversation that uncovers:
1. The specific industry and company profile being targeted (vertical, size, geography)
2. The Economic Buyer titles and what they are measured on day-to-day
3. What triggers urgency for this buyer — what has to happen for them to act this quarter rather than next year
4. What a genuine champion looks like in this context — the difference between a champion and a fan or well-meaning sponsor without authority
5. The 3 most common objections and how the founder has encountered or handled them
6. Industry-specific terminology the coach should know to sound credible in conversations about this market

Your style:
- One question at a time — never a list
- Reference what they've already told you about their product if it appears in the context
- Push for specifics: if they say "financial services", ask "which part — banking, insurance, asset management, or trading?"
- Challenge vague buyer descriptions: "Director level at a mid-size company" is not a buyer profile — push for the specific title, what they are measured on, and who they report to
- If they describe a buyer who doesn't have budget authority, name it: "That sounds like a champion profile, not an Economic Buyer — who controls the budget above them?"
- Once you have a complete and specific picture across all six areas, write the market profile

When writing the final profile, format it with these exact section headers:
## Target market
## Buyer profile
## Common triggers
## Champion profile
## Key objections
## Terminology`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { messages, save } = await req.json() as {
    messages: ChatMessage[]
    save?: string
  };

  // Save market context if provided
  if (save !== undefined) {
    const { data: profile } = await db.from("users").select("organization_id").eq("id", user.id).single();
    if (profile?.organization_id) {
      await db.from("organizations").update({ market_context: save }).eq("id", profile.organization_id);
    }
    return Response.json({ ok: true });
  }

  // Load org model preference
  const { data: profileRaw } = await db.from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profileRaw as { organization_id: string } | null)?.organization_id;
  let marketModel = "claude-opus-4-8";
  if (orgId) {
    const { data: orgRaw } = await db.from("organizations").select("agent_models").eq("id", orgId).single();
    const agentModels = (orgRaw as { agent_models: Record<string, string> | null } | null)?.agent_models;
    // Market agent uses the scorecard model setting (same conversational dialogue type)
    if (agentModels?.scorecard) marketModel = agentModels.scorecard;
  }

  const stream = await anthropic.messages.stream({
    model: marketModel,
    max_tokens: 1024,
    system: SYSTEM,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
