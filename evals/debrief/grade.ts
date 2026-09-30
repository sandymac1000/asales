import type { DebriefResult } from "@/lib/agents/debrief";

// Programmatic grading. The debrief agent's output is a structured tool call
// with a closed set of field names, so a check measures the answer rather than
// the phrasing — no judge needed, no judge cost, no judge drift.
//
// The metric that matters most is not recall. This agent proposes writes into
// customer deal records, so inventing a field nobody mentioned is worse than
// missing one: `precision` and `restraint` carry the cases where the honest
// answer is "nothing new was said".

export interface EvalCase {
  id: string
  tags: string[]
  note: string
  deal: {
    account_name: string
    deal_name: string
    stage: string
    pain: string | null
    success_criteria: string | null
    economic_buyer_name: string | null
    economic_buyer_met: boolean
    contacts: Array<{ name: string; role: string }>
    meddpicc: Record<string, string>
  }
  transcript: string
  expect: {
    must_extract: string[]
    may_extract?: string[]
    must_not_extract: string[]
    expected_contacts?: string[]
    min_confidence_on_must?: number
    max_updates?: number
  }
}

export interface CaseGrade {
  grade: Record<string, number>
  explanation: Record<string, string>
}

export function gradeCase(c: EvalCase, r: DebriefResult): CaseGrade {
  const proposed = [
    ...(r.meddpicc_updates ?? []).map((u) => u.field),
    ...(r.health_updates ?? []).map((u) => u.field),
  ];
  const proposedSet = new Set(proposed);
  const allowed = new Set([...(c.expect.must_extract ?? []), ...(c.expect.may_extract ?? [])]);

  // Recall over the fields a competent reader could not miss.
  const must = c.expect.must_extract ?? [];
  const foundMust = must.filter((f) => proposedSet.has(f));
  const recall = must.length === 0 ? 1 : foundMust.length / must.length;

  // Anything proposed that wasn't licensed by the transcript.
  const forbidden = (c.expect.must_not_extract ?? []).filter((f) => proposedSet.has(f));
  // Health updates are assessments rather than extractions, so they are judged
  // only against the forbidden list, not counted as precision misses.
  const meddOnly = (r.meddpicc_updates ?? []).map((u) => u.field);
  const unlicensed = meddOnly.filter((f) => !allowed.has(f));
  const precision = meddOnly.length === 0 ? 1 : 1 - unlicensed.length / meddOnly.length;

  // Restraint: did it respect a cap on how much it should have found at all?
  const cap = c.expect.max_updates;
  const restraint = cap === undefined ? 1 : (r.meddpicc_updates ?? []).length <= cap ? 1 : 0;

  // Contacts must actually be named in the transcript.
  const names = (r.new_contacts ?? []).map((n) => n.name);
  const invented = names.filter((n) => {
    const first = n.split(/\s+/)[0];
    return first.length > 1 && !c.transcript.toLowerCase().includes(first.toLowerCase());
  });
  const noHalluc = invented.length === 0 ? 1 : 0;

  // The confidence gate should already have removed sub-0.5 items upstream.
  const floorBreaches = [...(r.meddpicc_updates ?? []), ...(r.health_updates ?? [])]
    .filter((u) => typeof u.confidence !== "number" || u.confidence < 0.5);
  // And things it was told it could not miss should be asserted confidently.
  const minConf = c.expect.min_confidence_on_must ?? 0;
  const weakMust = (r.meddpicc_updates ?? [])
    .filter((u) => must.includes(u.field) && u.confidence < minConf);
  const confidenceOk = floorBreaches.length === 0 && weakMust.length === 0 ? 1 : 0;

  const pass =
    recall === 1 && forbidden.length === 0 && restraint === 1 &&
    noHalluc === 1 && confidenceOk === 1 ? 1 : 0;

  const reasons: string[] = [];
  if (recall < 1) reasons.push(`missed ${must.filter((f) => !proposedSet.has(f)).join(", ")}`);
  if (forbidden.length) reasons.push(`proposed forbidden ${forbidden.join(", ")}`);
  if (unlicensed.length) reasons.push(`unlicensed ${unlicensed.join(", ")}`);
  if (restraint === 0) reasons.push(`${(r.meddpicc_updates ?? []).length} updates over cap of ${cap}`);
  if (invented.length) reasons.push(`contacts not in transcript: ${invented.join(", ")}`);
  if (floorBreaches.length) reasons.push(`${floorBreaches.length} below the 0.5 gate`);
  if (weakMust.length) reasons.push(`under-confident on ${weakMust.map((u) => u.field).join(", ")}`);

  return {
    grade: { pass, precision, recall, restraint, no_halluc: noHalluc, confidence_ok: confidenceOk },
    explanation: { pass: reasons.length ? reasons.join("; ") : "all checks clean" },
  };
}

export const METRICS = [
  { id: "pass", label: "Pass", kind: "binary" as const },
  { id: "precision", label: "Precision", kind: "rate" as const },
  { id: "recall", label: "Recall", kind: "rate" as const },
  { id: "restraint", label: "Restraint", kind: "binary" as const },
  { id: "no_halluc", label: "No invented", kind: "binary" as const },
  { id: "confidence_ok", label: "Confidence", kind: "binary" as const },
];
