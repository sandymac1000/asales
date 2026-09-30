# RESUME — asales (Salient)

_Last updated: 2026-09-30_

Snapshot for picking work back up.

---

## Status on 2026-09-30 — everything is applied, pushed and verified live

Migrations **019, 020 and 021** are applied to production, all commits are
**pushed and deployed**, and each feature was checked in the live app:

- `/start` renders and reads production correctly (four steps green for
  Sandymac, demo door offered)
- `/admin` adoption chart draws real data — cumulative members 1→5, deals 3→4,
  weekly from 29 Jun to 20 Jul
- Settings → AI access shows the spend panel and the key-capping guidance
- Coach playbook resolution verified live via the `countOnly` endpoint:
  returns all nine verticals including the new Software & Technology one
- DB verified: four 019 views + `admin_org_spend`, `agent_usage` with RLS and
  one SELECT policy, `is_demo` on `deals`/`accounts`, `demo_seeded_at` on
  `organizations`, `deals.coach_playbook`, no `anon`/`authenticated` grants on
  any admin view, `admin_org_usage` unchanged in shape (9 orgs)

### Coach domain tuning — fixed, and one thing to do next
`detectVertical` matched keywords *inside* words over lists containing
three-letter acronyms: "large language **mod**els" → Ministry of Defence →
Government; "ent**erp**rises" → Manufacturing; "surveying **pra**ctices" →
Pharma. Every AI-native founder silently got ~1,000 tokens of wrong-domain
coaching. Now word-boundary matched, plural-aware, weighted, thresholded, and
it returns **null** rather than guessing.

Tuning also moved from the org to the deal (`resolvePlaybook` cascade:
explicit override → deal's segment → account industry → product context).

**Next action:** the better rungs of that cascade are mostly empty —
**0 of 3 accounts have `industry` set**, and only 2 of 4 deals are tagged to a
segment (5 segments exist). So live deals currently resolve on the weakest
signal, the org product description. Filling in account industries is the
cheapest quality win available to the coach.

### One thing that will never work on this project
`auth.audit_log_entries` is **completely empty — 0 rows**. Supabase has pruned
it, so the **Sign-in frequency chart will always show "No sign-ins in the
retained auth log"**. The Login recency chart is unaffected (it reads
`auth.users.last_sign_in_at`) and does have data. To get real sign-in history
we need our own table written on successful `verifyOtp` — it would only accrue
from the day it ships. Decide whether to build that or drop the chart.

### How the migrations were applied
`supabase db query --linked -f <file>` worked. An earlier attempt was blocked
by the auto-mode classifier as a production deploy; on retry with the user's
explicit go-ahead it went through. Still never use `supabase db push` — the
remote history has no record of 001–018.

---

## Salient beta — LIVE

- **App:** https://salientbeta.vercel.app — production alias, always use this
- **Operator console:** `/admin` (visible only to `ADMIN_EMAILS` = Sandy)
- **Sending domain:** `sandymac1000.com` via Resend
- **Guides in repo:** `OPERATOR.md`, `DEPLOY.md`

### Login was broken on 2026-09-30 — root cause, for the record
Not email, not Supabase. Sandy was on a **pinned old deployment URL**
(`salientbeta-7tgdxu7cc-…vercel.app`) whose build predates the code sign-in
work, so it asked for a magic link while the Supabase templates had been
rewritten to send `{{ .Token }}` only — a code with no link, and a page with
nowhere to type it. Fixed by using the production alias. **That old deployment
is still publicly reachable and will bite again — delete or password-protect
it in Vercel.**

Shipped alongside (commit `d7115a0`, live): real GoTrue error messages instead
of "Something went wrong"; `shouldCreateUser` gated on an invite code so typos
stop creating limbo accounts; an "I already have a code" route into the code
box; and `proxy.ts` redirects now carry Supabase's cookies so a dead session
can actually die instead of being replayed for ever.

---

## What shipped on 2026-09-30

### Agents
- Models centralised in `lib/agents/models.ts` — one edit to upgrade, not five.
- Opus 4.8 → **Opus 5** (same $5/$25); Sonnet 4.6 → **Sonnet 5** (cheaper,
  $2/$10 vs $3/$15).
- Dialogue ceiling 1024 → 16000. Thinking now bills against the same ceiling,
  so the old cap could be spent entirely on reasoning. Extraction ceilings
  raised for the same reason.
- `effort: medium` on interactive agents; debrief left at default `high`.
- Prompt caching on the **coach only** — scorecard and market system prompts
  are ~394 and ~643 tokens, under the minimum cacheable prefix, so a
  breakpoint there would silently do nothing. The shared org-brief idea (see
  Next) would fix that properly.
- Debrief now **enforces** its own stated 0.5 confidence rule in code.

### Usage metering (migration 020)
`agent_usage` table, one row per call, wired into all five agents. Streamed
calls accumulate usage from events and flag `partial` on cancel. Settings →
AI access shows month-to-date spend, per-agent breakdown and cache share. The
key panel now explains how to **cap** the risk (workspace-scoped key + spend
limit the user sets) rather than asking to be trusted, and states plainly that
Remove deletes our copy but only they can revoke.

### Get-started sequence
`/start` — four **derived** booleans (key → narrative → market → first deal).
No `onboarding_step` column on purpose. Reuses `ApiKeyPanel`, `ScorecardAgent`
and `MarketAgent` rather than adding a sixth agent. Pipeline redirects to
`/start` only when there are no real deals *and* no narrative. Ordering follows
`project-scorecard-chapter-one`: the narrative comes before the first deal.

### Demo mode (migration 020)
Three worked deals with pre-written coaching, seeded as real rows flagged
`is_demo`, excluded from every adoption view so a demo never reads as real
usage. Flag is on `accounts` too, so clearing is one delete and the rest
cascades. Nothing calls Anthropic in demo — that's the point: value before
credential.

### Eval harness
`evals/debrief/` — programmatic grader (output is a tool call over a closed
field set, so no judge needed). `npx tsx evals/debrief/run.ts --dry-run` spends
nothing. **Four synthetic cases only: a smoke test, not an eval.** Noise floor
at n=4 is ~±50 points, and an agent returning nothing scores 2/4 because two
cases are restraint cases. Needs ~20 cases, ideally anchored on real
transcripts. `tsx` added as a devDependency to run it.

**Open question when resuming:** three sign-offs were never given — where the
extra eval cases come from, whether precision-over-recall weighting is right,
and whether to spend ~$0.05–0.20 on a paid smoke run.

---

## DNS — one real fault outstanding
`_dmarc.sandymac1000.com` returns **two** TXT records. RFC 7489 says a receiver
finding more than one must ignore DMARC entirely, so the domain has no
effective policy despite looking configured. **Delete the one containing
`rua=mailto:me@sandymac1000.com`** and keep the bare `"v=DMARC1; p=none;"` —
the apex has no MX, so that rua address cannot receive the reports anyway.
Verified on both 1.1.1.1 and 8.8.8.8.

---

## Local dev limits (bit me repeatedly — see memory `asales-local-dev-limits`)
- `.env.local` has only the 4 public vars. **No `SUPABASE_SERVICE_ROLE_KEY`,
  no `ADMIN_EMAILS`** — so `/admin` and `/start` cannot run locally.
  `supabase projects api-keys` can fetch the service key if a real local
  walkthrough is needed.
- `vercel` CLI token is **expired** — `vercel login` needed to read prod env.
- Supabase CLI **is** authenticated; `supabase db query --linked` works for
  reads (Management API, no DB password).
- Local server: launchd `com.asales.server` on :3007, keepalive + runatload,
  so it comes back by itself after a reboot. Redeploy:
  `npm run build && launchctl kickstart -k gui/$(id -u)/com.asales.server`.

---

## Next, in the order I'd take them
1. **Fill in account industries** — 0 of 3 accounts have `industry` set, so the
   coach's new per-deal tuning falls back to the weakest signal. Cheapest
   quality win available.
2. Delete/protect the stale Vercel deployment (`salientbeta-7tgdxu7cc-…`);
   fix the duplicate DMARC record in Cloudflare
3. Read the new Software & Technology playbook in
   `lib/agents/domain-playbooks.ts` — ~1,000 words of domain opinion in the
   vertical Sandy knows best, written by Claude and not yet human-reviewed
4. Grow the debrief eval set to ~20 cases, then run it. Three sign-offs are
   still outstanding: where cases come from, whether precision-over-recall is
   the right weighting, and approval to spend ~$0.05–0.20 on a run
5. **Shared org brief** — extract product narrative + segments + ICP + targets
   into one cached block all agents read. Fixes caching-below-threshold for
   scorecard and market, and is the prerequisite for the two new roles
6. **Pipeline agent** (portfolio-level: where the quarter breaks, coverage,
   deals with no economic buyer) and **follow-through agent** (nothing
   currently notices every next action is overdue)
7. Debrief UI: per-item apply. Confidence is colour-coded in
   `deal-detail-client.tsx` but "Apply updates" still applies all or nothing
8. Decide on sign-in history: own table written at `verifyOtp`, or drop the
   Sign-in frequency chart (the auth log is permanently empty)

### Deliberately not built, with reasons
- **A `set_playbook` tool for the coach.** An agent that silently rewrites its
  own configuration mid-conversation is the failure mode we spent 30 Sep
  fixing. The coach is instructed to *suggest* a switch and point at the
  selector instead. If this is revisited, make it a proposal the UI renders as
  a one-click button — model proposes, human disposes.
- **Caching on scorecard/market.** Their prefixes are ~394 and ~643 tokens,
  under the minimum cacheable size; a breakpoint there does nothing.

## Branch state
- `main` — pushed and deployed, clean
- `book-updates` — 3 commits not in main, deliberately separate
- `code-signin`, `market-segments`, `operator-console`, `server-supervision`,
  `vercel-multiorg-deploy` — all fully merged into main, safe to delete

---

## Salient book (branch `book-updates`)
Source of truth is the Word docx the user edits (`~/Downloads/salient-book
v1.x.docx`), not the Typst. Four deliverables sit in `~/Downloads/`
(glossary, index concordance, ICP-portfolio subsection, QuickStart guide),
still unassembled as of 2026-09-30 — master is `salient-book v1.0.docx`,
7 Jul. Regenerate on request rather than hand-patch.

---

## Working style
British English. No "honest/honestly" hedging. Minimal AI-isms, dry humour.
Navigate dashboards by ⌘K / what's on screen, not stale menu paths. Pause and
hand off on local-auth blocks (Keychain, Touch ID) rather than retry-looping.
