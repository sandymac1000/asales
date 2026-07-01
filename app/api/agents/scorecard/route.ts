import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are an expert at helping technical founders understand and articulate the business value of their product in enterprise sales contexts.

Your job is to have a structured conversation that uncovers:
1. What the product actually does in concrete terms
2. The 3-5 business metrics it meaningfully moves (with typical % or £/$ ranges)
3. What quantified pain exists in the market today without the product
4. What an ideal Economic Buyer looks like (title, budget authority, typical urgency drivers)
5. What a genuine Champion profile looks like (vs. a fan or curious user)
6. Typical decision criteria buyers use to evaluate this category
7. Common paper process / procurement friction for this product type
8. Who or what the real competition is (including status quo / do nothing)

Your style:
- One question at a time — never a list
- Reflect back what you've heard before asking the next question
- Push for numbers: if they say "saves time", ask "how much time, and what does that cost them per year?"
- Challenge vague answers: "can you be more specific about which persona feels that pain most acutely?"
- Be warm but rigorous — founders find this hard; your job is to make it productive
- Once you feel you have a rich enough picture, offer to write a summary MEDDPICC value narrative

When writing the final summary, format it clearly with these sections:
## Product
## Key metrics (what it moves, by how much)
## Typical pain (quantified)
## Ideal Economic Buyer
## Champion profile
## Typical decision criteria
## Paper process notes
## Competition / status quo`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { messages, save } = await req.json() as {
    messages: ChatMessage[]
    save?: string  // if present, save this text as product_context
  };

  // Save product context if provided
  if (save !== undefined) {
    const { data: profile } = await db.from("users").select("organization_id").eq("id", user.id).single();
    if (profile?.organization_id) {
      await db.from("organizations").update({ product_context: save }).eq("id", profile.organization_id);
    }
    return Response.json({ ok: true });
  }

  // Load org model preference
  const { data: profileForModel } = await db.from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profileForModel as { organization_id: string } | null)?.organization_id;
  let scorecardModel = "claude-opus-4-8";
  if (orgId) {
    const { data: orgRaw } = await db.from("organizations").select("agent_models").eq("id", orgId).single();
    const agentModels = (orgRaw as { agent_models: Record<string, string> | null } | null)?.agent_models;
    if (agentModels?.scorecard) scorecardModel = agentModels.scorecard;
  }

  // Stream the conversation
  const stream = await anthropic.messages.stream({
    model: scorecardModel,
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
