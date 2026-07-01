import { formatCurrency, formatDate, isOverdue } from "@/lib/format";
import type { DealFull } from "@/lib/supabase/types";

export function buildCoachContext(
  deal: DealFull,
  lastSessionSummary?: string | null,
  productContext?: string | null,
  marketContext?: string | null,
): string {
  const lines: string[] = [];

  // Org value narrative (from Settings scorecard agent)
  if (productContext?.trim()) {
    lines.push("=== PRODUCT VALUE NARRATIVE ===");
    lines.push(productContext.trim());
    lines.push("=== END NARRATIVE ===");
    lines.push("");
  }

  // Market & buyer context (from Settings market agent)
  if (marketContext?.trim()) {
    lines.push("=== MARKET & BUYER CONTEXT ===");
    lines.push(marketContext.trim());
    lines.push("=== END MARKET CONTEXT ===");
    lines.push("");
  }

  // Core deal identity
  lines.push(`DEAL: ${deal.name}`);
  lines.push(`ACCOUNT: ${deal.account.name}`);
  lines.push(`STAGE: ${deal.stage.toUpperCase()}`);
  if (deal.acv_value) lines.push(`ACV: ${formatCurrency(deal.acv_value, deal.currency)}`);
  if (deal.expected_close_date) {
    const overdue = isOverdue(deal.expected_close_date);
    lines.push(`EXPECTED CLOSE: ${formatDate(deal.expected_close_date)}${overdue ? " — OVERDUE" : ""}`);
  }

  // Core qualification
  lines.push("");
  const eb = deal.economic_buyer;
  lines.push(`ECONOMIC BUYER: ${eb ? eb.name + (eb.title ? ` (${eb.title})` : "") : "NOT IDENTIFIED"} | Met: ${deal.economic_buyer_met ? "Yes" : "No"}`);
  lines.push(`PAIN: ${deal.pain ?? "NOT DOCUMENTED"}`);
  lines.push(`SUCCESS CRITERIA: ${deal.success_criteria ?? "NOT DOCUMENTED"}`);
  if (deal.next_action) {
    const od = deal.next_action_date ? isOverdue(deal.next_action_date) : false;
    lines.push(`NEXT ACTION: ${deal.next_action} | Due: ${deal.next_action_date ? formatDate(deal.next_action_date) : "no date"}${od ? " — OVERDUE" : ""}`);
  }

  // MEDDPICC — only non-null fields
  const mLines: string[] = [];
  const mFields = [
    ["Metrics", deal.meddpicc_metrics, deal.meddpicc_metrics_health],
    ["EB notes", deal.meddpicc_eb_notes, deal.meddpicc_eb_health],
    ["Pain", deal.meddpicc_pain_notes, deal.meddpicc_pain_health],
    ["Champion", deal.meddpicc_champion_notes, deal.meddpicc_champion_health],
    ["Decision Criteria", deal.meddpicc_decision_criteria, deal.meddpicc_decision_criteria_health],
    ["Decision Process", deal.meddpicc_decision_process, deal.meddpicc_decision_process_health],
    ["Paper Process", deal.meddpicc_paper_process, deal.meddpicc_paper_process_health],
    ["Competition", deal.meddpicc_competition, deal.meddpicc_competition_health],
  ] as const;
  for (const [label, value, health] of mFields) {
    if (value) mLines.push(`  ${label} [${health ?? "?"}]: ${value}`);
  }
  if (mLines.length) {
    lines.push("");
    lines.push("MEDDPICC:");
    lines.push(...mLines);
  }

  // Buying committee
  if (deal.deal_contacts.length > 0) {
    lines.push("");
    lines.push("BUYING COMMITTEE:");
    for (const dc of deal.deal_contacts) {
      const name = dc.contact?.name ?? "Unknown";
      const role = dc.role.replace(/_/g, " ");
      lines.push(`  ${name} — ${role} [${dc.sentiment}]`);
    }
  }

  // Recent activity (last 5, summaries only)
  const recent = deal.activities.slice(0, 5);
  if (recent.length > 0) {
    lines.push("");
    lines.push("RECENT ACTIVITY:");
    for (const a of recent) {
      const date = formatDate(a.created_at);
      const text = (a.agent_summary ?? a.notes ?? a.title ?? "").slice(0, 180);
      if (text) lines.push(`  [${date}] ${a.type.toUpperCase()}: ${text}`);
    }
  }

  // Previous coaching session
  if (lastSessionSummary) {
    lines.push("");
    lines.push("PREVIOUS COACHING SESSION NOTES:");
    lines.push(lastSessionSummary.slice(0, 600));
  }

  return lines.join("\n");
}

// Rough token estimate (4 chars ≈ 1 token)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Cost estimate in USD
// Opus 4.8: $5/1M input, $25/1M output
export function estimateCost(inputTokens: number, outputTokens = 500): number {
  return (inputTokens * 5 + outputTokens * 25) / 1_000_000;
}
