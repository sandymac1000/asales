# Salient — Operator Playbook

How to run the Salient beta: onboard organisations, manage access, and handle the
common snags. This is the day-to-day guide; `DEPLOY.md` covers the one-time infra setup.

- **App URL:** https://salientbeta.vercel.app
- **Operator console:** https://salientbeta.vercel.app/admin (the **Admin** item in the
  sidebar, visible only to you — gated by the `ADMIN_EMAILS` environment variable)
- **Sending domain:** `sandymac1000.com` (sign-in and invite emails come from here via Resend)

## The model in one paragraph

Every organisation is a separate, isolated workspace. People join an org with an invite
code, and only ever see their own org's data (enforced by row-level security). Each org
supplies its own Anthropic API key, so their AI usage is billed to them, not you. You are the
only operator: you can provision orgs and see usage metadata (member counts, activity), but
never their deal contents or keys.

## Onboarding an organisation

1. **Provision it.** Admin console → *Provision an organisation* → enter the org name (e.g.
   "Twin Path"). Optionally enter the person's email to have Salient email them the invite.
   Click **Provision**. You get an invite code (also shown in the Organisations table).
2. **Get them the code.** If you entered their email, they receive an invite from
   `invites@sandymac1000.com`. Otherwise, copy the code and send it to them yourself with the
   URL.
3. **Warn them about the first email** (see Deliverability below) — this saves a support round.

## What the new person does

1. Go to https://salientbeta.vercel.app, enter their email and the invite code (first time
   only), click *Email me a sign-in code*.
2. They receive an 8-digit **code** (not a link) from `noreply@sandymac1000.com`. They type it
   in. No password, no link.
3. First time, they enter the invite code once more to join their org, then they're in.
4. **To switch the AI on:** Settings → AI access → paste their own Anthropic API key
   (from console.anthropic.com). The agents stay off until they do this. It's their key, their
   bill.
5. **To bring colleagues in:** Settings → Team shows their org's code to share.

## Deliverability — the one thing to tell every invitee

`sandymac1000.com` is a young sending domain. Strict corporate gateways (Mimecast, Proofpoint,
Microsoft Safe Links — i.e. most VCs and banks) will often **hold the first email in
quarantine** while they scan it. This is delivery lag, not a failure — the code always arrives
intact.

Give every corporate invitee this line up front:

> "The first email may land in your quarantine / held-messages digest on first contact —
> release it, or ask IT to allowlist sandymac1000.com. After that, mail flows normally."

We switched sign-in from a clickable link to a typed code precisely because gateways
pre-click links and destroy the single-use token. A code can't be clicked to death, so it
survives — it just may be slow to arrive the first time. This eases as the domain warms up.

## Managing access (all in the Admin console)

- **Rotate a code** — Organisations table → *Rotate*. Generates a new invite code and kills
  the old one. Use if a code leaks.
- **Remove an org** — Organisations table → *Remove*. Deletes the org, its members, its deals,
  and its code. Full, irreversible cut-off. Use to cancel a company.
- **Remove a user** — *Remove a user* box → enter their email. Deletes the account, including
  "limbo" accounts stuck mid sign-in (someone who started but never finished). They can then be
  invited again from scratch.
- **Re-add** — just Provision again (or re-invite with the existing code).

## Watching adoption

The Organisations table shows, per org: member count, deal count, last active, provisioned
date, and invite code. Metadata only — never their deal contents. This is your read on whether
the beta is landing (are people coming back, are they adding deals).

## Troubleshooting

- **"They didn't get the code."** Check Resend → Emails/Logs. *Delivered* means it reached
  their server and their gateway is holding it (release from quarantine / allowlist). *Bounced*
  means a real address or DNS problem.
- **Someone is stuck / got a confusing "confirm your email" state.** Remove their user in the
  Admin console and have them start again cleanly.
- **Agents show "No Anthropic key set".** That org hasn't added its key yet (Settings → AI
  access). Expected until they do.
- **Sign-in email says the wrong thing / links appear.** The two Supabase email templates
  ("Magic link or OTP" and "Confirm signup") must both send `{{ .Token }}` with no link.

## Notes

- The Vercel deploy tracks the `main` branch — push to `main` and it redeploys automatically.
- Isolation, per-org keys, and the operator gate are enforced server-side. Keep `ADMIN_EMAILS`
  to yourself; it grants whole-system visibility, not per-portfolio scope.
