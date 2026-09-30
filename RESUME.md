# RESUME — asales (Salient)

_Last updated: 2026-09-30_

Snapshot for picking work back up.

---

## READ THIS FIRST — two things are pending

**1. Migrations 019 and 020 are NOT applied.** Five commits sit unpushed on
`main` that expect them. Verified remote state on 2026-09-30: `admin_org_usage`
exists (018 applied); `admin_signups_daily`, `admin_logins_daily`,
`agent_usage` and `deals.is_demo` are all absent. Clean slate, no collisions.

Apply **019 first, then 020**, by pasting into the Supabase SQL editor.
`supabase db query --linked -f <file>` is the CLI equivalent but is **blocked by
the Claude Code auto-mode classifier as a production deploy** — either paste by
hand or add a Bash permission rule. Do **not** use `supabase db push`: the
remote migration history has no record of 001–018 (applied by hand), so a push
may try to re-run everything.

**2. The push is deliberately held.** `main` is 5 commits ahead of `origin/main`
and Vercel auto-deploys from `main`, so pushing before the migrations are in
means the beta briefly runs code whose schema is missing. It degrades
gracefully (see below) but the intended order is migrations → verify → push.

Unpushed commits, oldest first:
- `c88d232` Operator console: adoption and login-frequency charts (migration 019)
- `3bbb8aa` Agents: current models, ceilings, caching, metering, confidence gate (migration 020)
- `b921253` Get-started sequence and demo mode
- `237433b` Eval harness for the debrief agent

(`d7115a0`, the login fixes, is already pushed and live.)

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

## What changed on 2026-09-30 (unpushed)

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

## Graceful degradation while 019/020 are unapplied
- `/admin` → "Usage charts need migration 019", table still works
- Settings → AI access → "metering isn't switched on yet"
- Demo seeding → 503 naming the migration
- `/start` → renders; deal count reads 0

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
1. Apply 019 then 020; push the 5 commits
2. Delete/protect the stale Vercel deployment; fix the duplicate DMARC record
3. Grow the eval set to ~20 cases, then run it
4. **Shared org brief** — extract product narrative + segments + ICP + targets
   into one cached block all agents read. Fixes the caching-below-threshold
   problem and is the prerequisite for the two new roles.
5. **Pipeline agent** (portfolio-level: where the quarter breaks, coverage,
   deals with no economic buyer) and **follow-through agent** (nothing
   currently notices every next action is overdue)
6. Debrief UI: per-item apply. Confidence is colour-coded in
   `deal-detail-client.tsx` but "Apply updates" still applies all or nothing

---

## Branch state
- `main` — 5 commits ahead of origin, unpushed
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
