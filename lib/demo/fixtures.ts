// Worked example data for demo mode.
//
// These are real rows in the org's own tables, flagged is_demo, so the demo
// exercises the actual UI, the actual queries and the actual RLS — what you
// explore is what you get. Every adoption view filters them out, so a seeded
// demo never reads as real usage in the operator console.
//
// Agent output here is PRE-WRITTEN. Nothing in demo mode calls Anthropic, which
// is the entire point: see the product before deciding about an API key. The UI
// labels it as an example rather than passing it off as live.

export interface DemoContact {
  name: string
  title: string
  role: "economic_buyer" | "champion" | "technical_buyer" | "user_buyer" | "blocker" | "influencer"
}

export interface DemoActivity {
  type: "meeting" | "note" | "coaching"
  title: string
  notes?: string
  /** Pre-written coaching output, shown labelled as an example. */
  agent_summary?: string
}

export interface DemoDeal {
  account: { name: string; domain: string; industry: string; size_band: "1-50" | "51-200" | "201-1000" | "1001+" }
  name: string
  stage: "exploring" | "qualifying" | "proposing" | "closing"
  pain: string | null
  success_criteria: string | null
  next_action: string
  /** Days from today; negative is deliberately overdue. */
  next_action_in_days: number
  acv_value: number | null   // pence
  economic_buyer_met: boolean
  contacts: DemoContact[]
  activities: DemoActivity[]
}

export const DEMO_DEALS: DemoDeal[] = [
  {
    account: { name: "Northwind Rail", domain: "northwindrail.example", industry: "Transport", size_band: "1001+" },
    name: "Northwind Rail — depot condition monitoring",
    stage: "qualifying",
    pain: "Unplanned depot withdrawals cost roughly £40k per incident and they had 60 last year.",
    success_criteria: "Cut unplanned withdrawals by a third within two quarters of go-live.",
    next_action: "Get the maintenance director to confirm the £40k figure in writing",
    next_action_in_days: 3,
    acv_value: 9_000_000,
    economic_buyer_met: false,
    contacts: [
      { name: "Priya Raghavan", title: "Head of Fleet Engineering", role: "champion" },
      { name: "Alan Whitcombe", title: "Engineering Director", role: "economic_buyer" },
      { name: "Sam Okoro", title: "Lead Systems Architect", role: "technical_buyer" },
    ],
    activities: [
      {
        type: "meeting",
        title: "Discovery call with fleet engineering",
        notes: "Priya walked through the withdrawal process. Numbers came from her own spreadsheet, not a system of record.",
      },
      {
        type: "coaching",
        title: "Coaching session (example)",
        agent_summary:
          "The £40k figure is the whole deal and it currently rests on one person's spreadsheet. Priya is a genuine champion — she has the problem and the language for it — but she does not hold the budget, and you have not met Alan. A quantified pain that only the champion can vouch for tends to shrink the moment finance looks at it. Get the number confirmed by someone who owns the cost line before you propose anything.",
      },
    ],
  },
  {
    account: { name: "Caldera Bioscience", domain: "calderabio.example", industry: "Pharma", size_band: "201-1000" },
    name: "Caldera Bioscience — lab data platform",
    stage: "exploring",
    pain: null,
    success_criteria: null,
    next_action: "Book a session with whoever owns the validation budget",
    next_action_in_days: -6,
    acv_value: null,
    economic_buyer_met: false,
    contacts: [
      { name: "Dr Helen Mbeki", title: "Head of Informatics", role: "influencer" },
    ],
    activities: [
      {
        type: "note",
        title: "Inbound from a conference talk",
        notes: "Helen liked the demo. No budget conversation yet. No named sponsor.",
      },
      {
        type: "coaching",
        title: "Coaching session (example)",
        agent_summary:
          "This is enthusiasm, not a deal. Helen is a fan: she likes the technology and has no budget authority, no stated pain and no timeline. The next action has been overdue for six days, which is usually what a deal looks like just before it quietly stops. Either find the person whose budget this comes out of this week, or move it out of the active pipeline so it stops flattering your coverage.",
      },
    ],
  },
  {
    account: { name: "Ardent Manufacturing", domain: "ardentmfg.example", industry: "Manufacturing", size_band: "201-1000" },
    name: "Ardent Manufacturing — line yield analytics",
    stage: "proposing",
    pain: "Scrap rate on line 3 runs at 4.1% against an internal target of 2%.",
    success_criteria: "Hold scrap under 2.5% for a full quarter.",
    next_action: "Chase procurement on the security questionnaire",
    next_action_in_days: 1,
    acv_value: 5_500_000,
    economic_buyer_met: true,
    contacts: [
      { name: "Marta Lindqvist", title: "Operations Director", role: "economic_buyer" },
      { name: "Joe Bannerman", title: "Continuous Improvement Lead", role: "champion" },
      { name: "Ruth Deane", title: "Procurement Manager", role: "blocker" },
    ],
    activities: [
      {
        type: "meeting",
        title: "Proposal walkthrough with Marta",
        notes: "Marta accepted the scrap numbers and asked for a phased rollout. Procurement now the gate.",
      },
      {
        type: "coaching",
        title: "Coaching session (example)",
        agent_summary:
          "This is the healthiest deal on the board: quantified pain, a met economic buyer, and a champion who has done the arithmetic for you. The risk has moved from whether they want it to how long paper takes, and you have no dates on the paper process. Ruth is not a blocker by temperament, she is a blocker by position — ask Joe what procurement's actual cycle time is, because that number, not Marta's enthusiasm, is your close date.",
      },
    ],
  },
];

/** Canned agent output for the org-level agents while demo mode is on. */
export const DEMO_VALUE_NARRATIVE = `## What the product does
Continuous condition monitoring for heavy industrial assets, surfaced as a single operational dashboard.

## Business metrics it moves
- Unplanned downtime incidents — typically 25–40% reduction in the first year
- Maintenance cost per asset — 10–15% lower through condition-based rather than calendar-based servicing
- Mean time to diagnosis — hours rather than days

## Quantified pain without it
A single unplanned withdrawal costs £30–50k in a rail depot and £50k–£500k per hour in continuous process plants.

## Ideal economic buyer
Engineering or Operations Director with a maintenance budget line, measured on availability, typically urgent after an incident or ahead of a regulatory audit.`;
