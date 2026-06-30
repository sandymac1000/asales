import Anthropic from "@anthropic-ai/sdk";
import type { Deal } from "@/lib/supabase/types";

const client = new Anthropic();

export interface QualificationResult {
  score: number              // 0–100
  confidence: number         // 0–1
  score_rationale: string    // one sentence
  stale_fields: string[]     // fields not updated in 30+ days
  recommended_actions: string[]  // 2–3 specific next steps
}

interface DealWithStaleness extends Deal {
  field_ages: Record<string, number>  // field name → days since last update
}

const SCORING_TOOL: Anthropic.Tool = {
  name: "compute_qualification_score",
  description: "Compute a qualification score for a B2B enterprise deal based on MEDDPICC health and signal freshness.",
  input_schema: {
    type: "object" as const,
    properties: {
      score: {
        type: "number",
        description: "Overall qualification score 0–100. 0 = completely unqualified, 100 = perfectly qualified with fresh signals across all dimensions.",
      },
      confidence: {
        type: "number",
        description: "Confidence in the score 0–1. Low if few MEDDPICC dimensions have been assessed.",
      },
      score_rationale: {
        type: "string",
        description: "One sentence explaining the score — what is the primary driver up or down?",
      },
      stale_fields: {
        type: "array",
        items: { type: "string" },
        description: "MEDDPICC fields whose signals are 30+ days old and need refreshing.",
      },
      recommended_actions: {
        type: "array",
        items: { type: "string" },
        description: "2–3 specific next actions to improve qualification. Be concrete — name what to do, not just categories.",
      },
    },
    required: ["score", "confidence", "score_rationale", "stale_fields", "recommended_actions"],
  },
};

function buildQualifyPrompt(deal: DealWithStaleness): string {
  const health = (field: string, label: string) => {
    const h = (deal as unknown as Record<string, unknown>)[`${field}_health`];
    const age = deal.field_ages[field] ?? null;
    const stale = age != null && age > 30;
    const decayed = stale ? ` [STALE: ${age}d — reduced weight]` : "";
    return `- ${label}: ${h ?? "unassessed"}${decayed}`;
  };

  return `You are scoring an enterprise B2B deal for qualification health.

DEAL: ${deal.name}
ACCOUNT: ${deal.account_id}
STAGE: ${deal.stage}
ACV: ${deal.acv_value != null ? `£${deal.acv_value / 100}` : "unknown"}
Economic buyer identified: ${deal.economic_buyer_contact_id ? "yes" : "no"}
Economic buyer met: ${deal.economic_buyer_met ? "yes" : "no"}
Pain defined: ${deal.pain ? "yes" : "no"}
Success criteria defined: ${deal.success_criteria ? "yes" : "no"}
Expected close: ${deal.expected_close_date ?? "unknown"}

MEDDPICC HEALTH (Red=weak/2pts, Amber=progressing/7pts, Green=strong/12pts, unassessed=0pts):
${health("meddpicc_metrics", "Metrics")}
${health("meddpicc_eb", "Economic Buyer")}
${health("meddpicc_pain", "Identified Pain")}
${health("meddpicc_champion", "Champion")}
${health("meddpicc_decision_criteria", "Decision Criteria")}
${health("meddpicc_decision_process", "Decision Process")}
${health("meddpicc_paper_process", "Paper Process")}
${health("meddpicc_competition", "Competition")}

SCORING GUIDANCE:
- Apply time decay: fields 30–60 days old contribute at 70% weight; 60+ days at 40%
- Stage weighting: at Exploring stage, weight M/E/I/C most heavily; at Proposing/Closing, all 8 dimensions matter
- The Economic Buyer met (not just identified) is a significant positive signal at any stage
- Defined success criteria is a significant positive signal — most technical founders skip this
- A missing champion at Qualifying+ is a major risk regardless of other signals
- Score should reflect realistic probability of closing, not optimistic pipeline view

Compute the score. Be conservative — it is better to flag risk early than to validate false confidence.`;
}

export async function runQualificationAgent(
  deal: Deal,
  fieldAges: Record<string, number>
): Promise<QualificationResult> {
  const dealWithAges: DealWithStaleness = { ...deal, field_ages: fieldAges };

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2000,
    tools: [SCORING_TOOL],
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: buildQualifyPrompt(dealWithAges),
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Qualification agent did not return structured output");
  }

  return toolUse.input as QualificationResult;
}
