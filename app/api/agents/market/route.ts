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

Be didactic as you go. When you push back, explain the principle briefly so the founder learns the reasoning, not just the answer — e.g. "I'm treating that as a champion, not an Economic Buyer, because they don't own the budget line; the distinction matters because a champion can advocate but cannot approve."

Surface ADJACENCIES. The core ICP is rarely the only place the product creates value. As the picture firms up, probe gently for:
- Adjacent buyers: the same technology used by a different role (e.g. a code-generation tool whose core buyer is the Head of Engineering may also serve platform/DevEx leads, QA/test automation, or AppSec).
- Adjacent markets: the same value delivered in a different vertical.
Raise these as hypotheses to explore, not claims — "have you seen interest from security teams?" — and note the founder's evidence for or against.

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

const SYNTH_SYSTEM = `You convert a founder's market and buyer notes into a structured set of segment hypotheses for an enterprise-sales coaching tool.

Return ONLY a JSON object, no prose and no markdown fences, of exactly this shape:
{
  "core": {
    "label": "short name of the core buyer or market, e.g. 'Head of Engineering'",
    "axis": "buyer" | "market",
    "profile": {
      "industry": "", "size": "", "geography": "",
      "buyer_title": "", "measured_on": "", "trigger": "",
      "champion": "", "objections": "", "terminology": ""
    },
    "confidence": 0-100,
    "rationale": "one sentence on why this confidence"
  },
  "adjacencies": [
    { "label": "", "axis": "buyer" | "market", "profile": { ... same keys ... }, "confidence": 0-100, "rationale": "" }
  ]
}

Rules:
- The core is the ICP the founder is most committed to; give it the highest confidence.
- Adjacencies are candidate expansions: 'buyer' axis = same technology, a different role; 'market' axis = same value, a different vertical. Provide 3 to 6.
- Confidence is a coarse, honest prior — the strength of the case from what the founder has said, NOT a precise probability. Core typically 60-80; speculative adjacencies 15-35. Never imply precision the evidence does not support; explain each number in one sentence in 'rationale'.
- Leave a profile field as an empty string if unknown. Do not invent specifics.
- Output valid JSON only.`;

type ChatMessage = { role: "user" | "assistant"; content: string };
type SegProfile = Record<string, string>;
type SegInput = { label?: string; axis?: string; profile?: SegProfile; confidence?: number; rationale?: string };

const PROFILE_KEYS = ["industry", "size", "geography", "buyer_title", "measured_on", "trigger", "champion", "objections", "terminology"];

function clampConfidence(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function cleanProfile(p: unknown): SegProfile {
  const out: SegProfile = {};
  if (p && typeof p === "object") {
    for (const k of PROFILE_KEYS) {
      const v = (p as Record<string, unknown>)[k];
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
  }
  return out;
}

function normSeg(raw: SegInput, kind: "core" | "adjacent", fallbackConf: number) {
  const label = typeof raw?.label === "string" ? raw.label.trim() : "";
  if (!label) return null;
  const axis = raw?.axis === "market" ? "market" : "buyer";
  return {
    kind,
    axis,
    label,
    profile: cleanProfile(raw?.profile),
    confidence: clampConfidence(raw?.confidence, fallbackConf),
    confidence_rationale: typeof raw?.rationale === "string" ? raw.rationale.trim() : null,
    source: "agent" as const,
  };
}

function extractJson(text: string): unknown {
  const fenced = text.replace(/```json/gi, "```").split("```");
  const candidate = fenced.length > 1 ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("no json object found");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const body = await req.json() as {
    messages?: ChatMessage[];
    save?: string;
    action?: "synthesize" | "adjust" | "list";
    segmentId?: string;
    confidence?: number;
    status?: "active" | "disproven";
  };
  const { messages, save, action } = body;

  const { data: profile } = await db.from("users").select("organization_id").eq("id", user.id).single();
  const orgId = (profile as { organization_id: string } | null)?.organization_id;
  if (!orgId) return new Response("No organization", { status: 400 });

  // ── Save market_context blob (unchanged, back-compat) ──────────────────────
  if (save !== undefined) {
    await db.from("organizations").update({ market_context: save }).eq("id", orgId);
    return Response.json({ ok: true });
  }

  // ── List segments (for panel refresh) ──────────────────────────────────────
  if (action === "list") {
    const { data } = await db
      .from("market_segments")
      .select("*")
      .eq("organization_id", orgId)
      .order("kind", { ascending: true })
      .order("confidence", { ascending: false });
    return Response.json({ segments: data ?? [] });
  }

  // ── Manual user override of a segment's belief ─────────────────────────────
  if (action === "adjust") {
    if (!body.segmentId) return new Response("Missing segmentId", { status: 400 });
    const patch: Record<string, unknown> = { source: "user" };
    if (typeof body.confidence === "number") patch.confidence = clampConfidence(body.confidence, 40);
    if (body.status === "active" || body.status === "disproven") patch.status = body.status;
    await db.from("market_segments").update(patch).eq("id", body.segmentId).eq("organization_id", orgId);
    return Response.json({ ok: true });
  }

  // Resolve model (market agent shares the scorecard/dialogue model setting)
  let marketModel = "claude-opus-4-8";
  const { data: orgRaw } = await db.from("organizations").select("agent_models").eq("id", orgId).single();
  const agentModels = (orgRaw as { agent_models: Record<string, string> | null } | null)?.agent_models;
  if (agentModels?.scorecard) marketModel = agentModels.scorecard;

  // ── Synthesize structured segments from the conversation / saved profile ────
  if (action === "synthesize") {
    const resp = await anthropic.messages.create({
      model: marketModel,
      max_tokens: 4096,
      system: SYNTH_SYSTEM,
      messages: messages && messages.length ? messages : [{ role: "user", content: "No conversation supplied." }],
    });
    const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("");

    let parsed: { core?: SegInput; adjacencies?: SegInput[] };
    try {
      parsed = extractJson(text) as { core?: SegInput; adjacencies?: SegInput[] };
    } catch {
      return new Response("Could not parse segments from the model output.", { status: 422 });
    }

    const desired = [
      normSeg(parsed.core ?? {}, "core", 70),
      ...(parsed.adjacencies ?? []).slice(0, 8).map((a) => normSeg(a, "adjacent", 30)),
    ].filter((s): s is NonNullable<typeof s> => s !== null);

    if (desired.length === 0) return new Response("No usable segments produced.", { status: 422 });

    const { data: existingRaw } = await db.from("market_segments").select("*").eq("organization_id", orgId);
    const existing = (existingRaw ?? []) as Array<{ id: string; label: string; evidence_count: number }>;

    for (const seg of desired) {
      const match = existing.find((e) => e.label.toLowerCase() === seg.label.toLowerCase());
      if (match) {
        // Preserve earned belief: keep confidence once real deal evidence exists.
        const patch: Record<string, unknown> = {
          kind: seg.kind, axis: seg.axis, profile: seg.profile,
          confidence_rationale: seg.confidence_rationale, source: seg.source,
        };
        if (match.evidence_count === 0) patch.confidence = seg.confidence;
        await db.from("market_segments").update(patch).eq("id", match.id).eq("organization_id", orgId);
      } else {
        await db.from("market_segments").insert({ organization_id: orgId, ...seg });
      }
    }

    const { data } = await db
      .from("market_segments")
      .select("*")
      .eq("organization_id", orgId)
      .order("kind", { ascending: true })
      .order("confidence", { ascending: false });
    return Response.json({ segments: data ?? [] });
  }

  // ── Default: stream the coaching dialogue ──────────────────────────────────
  // 4096 (not 1024) so the final multi-section profile write-up isn't truncated;
  // normal Q&A turns are short and only bill for tokens actually produced.
  const stream = await anthropic.messages.stream({
    model: marketModel,
    max_tokens: 4096,
    system: SYSTEM,
    messages: messages ?? [],
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
