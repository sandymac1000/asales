# RESUME — asales

_Last updated: 2026-07-08_

Snapshot for picking work back up.

---

## Salient beta — LIVE and battle-tested

The multi-org private beta is deployed on Vercel and proven end-to-end (including a real
corporate user onboarded through a Mimecast gateway). `main` is the deployed branch; push to
`main` and Vercel auto-deploys.

- **App:** https://salientbeta.vercel.app
- **Operator console:** `/admin` (sidebar "Admin", visible only to `ADMIN_EMAILS` = Sandy)
- **Sending domain:** `sandymac1000.com` via Resend (SPF+DKIM+DMARC done in Cloudflare)
- **Guides in repo:** `OPERATOR.md` (day-to-day onboarding) and `DEPLOY.md` (infra setup)

**What's built and working:**
- Multi-tenant orgs with row-level isolation; per-org invite codes; `claim_invite` + `/join`.
- **Sign-in is an 8-digit email code, not a link** (survives Mimecast/Proofpoint/Safe-Links
  which pre-click and destroy links). Both Supabase email templates ("Magic link or OTP" and
  "Confirm signup") send `{{ .Token }}`, no link. Login verifies `email` then falls back to
  `signup` for brand-new users.
- BYO per-org Anthropic key (encrypted in `org_secrets`, server-only); all agents gated — show
  "No Anthropic key set" until an org adds one (Settings → AI access).
- **Operator console:** provision org, rotate code, remove org, remove user (incl. limbo
  accounts), and per-org usage metadata (member/deal counts, last active). Metadata only —
  never deal contents or keys.
- Feedback button → Resend. Invite emails from `invites@sandymac1000.com`.
- Migrations 015 (segments), 016 (ICP concept), 017 (multi-org), 018 (admin usage) all applied.

**Deliverability caveat (not a bug):** first email from a young domain to a strict corporate
gateway is often quarantined/slow. Tell invitees to release it from quarantine; eases as the
domain warms up. (Written up in `OPERATOR.md`.)

**Deferred / future (noted, not built):**
- Login-frequency view / richer usage charts in the operator console.
- **Fund/portfolio scoping** — a "this fund oversees these orgs" layer so a fund (e.g. Twin
  Path) could run oversight over only *its* portfolio. This is what would justify a separate
  "super-salient". Today `ADMIN_EMAILS` is whole-system, Sandy-only.

---

## Branch state

- `main` — **deployed** (Vercel auto-deploys from it). Contains the server-supervision work,
  the market-segments feature, and the whole multi-org beta.
- `book-updates` — book images/layout + Markdown export. **Not merged** (book artefacts, kept
  separate from the app). See Book section below.

---

## Local production server (:3007) — separate from the Vercel beta

The launchd-supervised local server still exists for local dev (memory:
`asales-server-supervision.md`). Install/reinstall `./scripts/install-service.sh`; redeploy
`npm run build && launchctl kickstart -k gui/$(id -u)/com.asales.server`. Note: `main` now has
the multi-org code, so the local server points at the same Supabase — mostly a dev convenience;
the real beta is Vercel.

---

## Salient book (branch `book-updates`, not merged)

Source of truth is now the **Word docx the user edits** (`~/Downloads/salient-book v1.x.docx`),
not the Typst — editing `.typ` / dragging a PDF in Affinity proved too brittle. Typst
(`book/salient-book.typ`) is the legacy master; `book/typ2md.py` regenerates `salient-book.md`.

Deliverables handed to the user (in `~/Downloads/`, paste into the Word master):
- `Salient-glossary.docx` (45 terms), `Salient-index-concordance.docx` (Word AutoMark index),
  `Salient-subsection-ICP-portfolio.docx` (new "ICP is a portfolio" Chapter-1 section),
  `Salient-QuickStart-Guide.docx` (2-page back-of-book guide).
- Word runbook given for: paste sections → page numbers → build index last.

**Open:** user assembling these into the Word master. Regenerate/adjust docx on request rather
than hand-patch. The ICP concept card in-app was synced (migration 016) to match the book.

---

## Working style (memory: `writing-style-preferences`)

British English. No "honest/honestly" self-referential hedging. Minimal AI-isms, a bit of dry
humour. Navigate dashboards by **⌘K search** / by what's actually on the user's screen, not
stale menu paths (they change constantly). Pause and hand off on local-auth blocks (Keychain,
Touch ID) rather than retry-looping (memory: `pause-on-local-auth`).
