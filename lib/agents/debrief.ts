import Anthropic from "@anthropic-ai/sdk";
import type { DealFull, Health } from "@/lib/supabase/types";

const client = new Anthropic();

export interface DebriefUpdate {
  field: string
  new_value: string
  confidence: number      // 0–1
  evidence_quote: string
}

export interface HealthUpdate {
  field: string
  new_value: Health
  reasoning: string
  confidence: number
}

export interface NewContact {
  name: string
  title: string
  role_in_deal: string
}

export interface DebriefResult {
  meddpicc_updates: DebriefUpdate[]
  health_updates: HealthUpdate[]
  new_contacts: NewContact[]
  agent_summary: string
  key_signals: string[]
}

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: "extract_meddpicc_updates",
  description: "Extract structured MEDDPICC updates, health changes, new contacts, and key signals from a meeting transcript.",
  input_schema: {
    type: "object" as const,
    properties: {
      meddpicc_updates: {
        type: "array",
        description: "Fields to update. Only include if there is clear new evidence in the transcript.",
        items: {
          type: "object",
          properties: {
            field: {
              type: "string",
              enum: [
                "meddpicc_metrics", "meddpicc_eb_notes", "meddpicc_pain_notes",
                "meddpicc_champion_notes", "meddpicc_decision_criteria",
                "meddpicc_decision_process", "meddpicc_paper_process", "meddpicc_competition",
                "pain", "success_criteria", "next_action",
              ],
            },
            new_value: { type: "string", description: "The updated text for the field" },
            confidence: { type: "number", description: "0.0–1.0 confidence in this extraction" },
            evidence_quote: { type: "string", description: "Verbatim quote from transcript that supports this update" },
          },
          required: ["field", "new_value", "confidence"],
        },
      },
      health_updates: {
        type: "array",
        description: "MEDDPICC health indicator changes based on transcript signals.",
        items: {
          type: "object",
          properties: {
            field: {
              type: "string",
              enum: [
                "meddpicc_metrics_health", "meddpicc_eb_health", "meddpicc_pain_health",
                "meddpicc_champion_health", "meddpicc_decision_criteria_health",
                "meddpicc_decision_process_health", "meddpicc_paper_process_health",
                "meddpicc_competition_health",
              ],
            },
            new_value: { type: "string", enum: ["red", "amber", "green"] },
            reasoning: { type: "string", description: "One sentence explaining why this health rating" },
            confidence: { type: "number" },
          },
          required: ["field", "new_value", "reasoning", "confidence"],
        },
      },
      new_contacts: {
        type: "array",
        description: "People mentioned in the transcript who are not already in the buying committee.",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            role_in_deal: {
              type: "string",
              enum: ["economic_buyer", "champion", "technical_buyer", "user_buyer", "blocker", "influencer"],
            },
          },
          required: ["name", "role_in_deal"],
        },
      },
      agent_summary: {
        type: "string",
        description: "One sentence summarising the most important insight from this meeting.",
      },
      key_signals: {
        type: "array",
        items: { type: "string" },
        description: "3–5 notable buying signals, risk signals, or next steps implied by the transcript.",
      },
    },
    required: ["meddpicc_updates", "health_updates", "new_contacts", "agent_summary", "key_signals"],
  },
};

function buildSystemPrompt(deal: DealFull): string {
  const knownContacts = deal.deal_contacts
    .map((dc) => `- ${dc.contact?.name ?? "Unknown"} (${dc.role})`)
    .join("\n") || "None recorded yet";

  return `You are a sales intelligence assistant analysing a B2B enterprise sales meeting transcript.

Your task is to extract structured updates for a deal qualification framework called MEDDPICC:
- **Metrics**: Quantified business value — the cost of the problem or value of the solution in numbers
- **Economic Buyer**: The person who controls the budget and has final approval authority
- **Identified Pain**: The specific business problem that is costing the customer if unsolved
- **Champion**: The internal advocate who will sell on the vendor's behalf without them in the room
- **Decision Criteria**: The formal and informal standards used to evaluate vendors
- **Decision Process**: The sequence of steps and approvals needed to reach a signed contract
- **Paper Process**: Legal review, procurement, security assessment, DPA/MSA negotiation
- **Competition**: Other vendors being evaluated, or the option to build/do nothing

CURRENT DEAL STATE:
Account: ${deal.account.name}
Deal: ${deal.name}
Stage: ${deal.stage}
Pain: ${deal.pain ?? "Not yet identified"}
Success criteria: ${deal.success_criteria ?? "Not yet defined"}
Economic buyer: ${deal.economic_buyer?.name ?? "Not yet identified"} (met: ${deal.economic_buyer_met ? "yes" : "no"})

Known buying committee:
${knownContacts}

Current MEDDPICC notes:
- Metrics: ${deal.meddpicc_metrics ?? "empty"}
- EB notes: ${deal.meddpicc_eb_notes ?? "empty"}
- Pain notes: ${deal.meddpicc_pain_notes ?? "empty"}
- Champion: ${deal.meddpicc_champion_notes ?? "empty"}
- Decision criteria: ${deal.meddpicc_decision_criteria ?? "empty"}
- Decision process: ${deal.meddpicc_decision_process ?? "empty"}
- Paper process: ${deal.meddpicc_paper_process ?? "empty"}
- Competition: ${deal.meddpicc_competition ?? "empty"}

IMPORTANT RULES:
1. Only suggest updates when there is clear, specific new information in the transcript
2. Do not repeat information already captured in the current state above
3. Health updates should reflect your assessment of the deal's strength on each dimension based on everything you know
4. For confidence: 0.9+ = explicitly stated, 0.7 = clearly implied, 0.5 = inferred, below 0.5 = don't include
5. For new contacts: only include people not already in the buying committee above
6. The agent_summary should capture the single most important insight a sales leader would want to know`;
}

export async function runDebriefAgent(deal: DealFull, transcript: string): Promise<DebriefResult> {
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "any" },
    system: buildSystemPrompt(deal),
    messages: [
      {
        role: "user",
        content: `Please analyse this meeting transcript and extract MEDDPICC updates:\n\n${transcript}`,
      },
    ],
  });

  // Find the tool use block
  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Agent did not return structured extraction");
  }

  return toolUse.input as DebriefResult;
}
