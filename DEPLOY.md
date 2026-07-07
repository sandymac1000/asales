# Deploying Salient (Vercel + Supabase)

A cost-neutral private beta for ~5 organisations. LLM usage is billed to each org
(they supply their own Anthropic key); the only fixed costs are hosting.

## 1. Supabase (reuse the existing project)

Migrations `001`–`017` define the schema. Apply any unapplied ones:

```
supabase db push
```

Then, in **Project Settings → API**, note:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `publishable`/`anon` key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never in the browser)

**Auth → URL Configuration:** add the Vercel URL to *Site URL* and *Redirect URLs*
(e.g. `https://salient.vercel.app/**`).

**Auth → Emails / SMTP:** the built-in sender is rate-limited (test-grade). For real
magic-link delivery to 5 orgs, set **custom SMTP** using Resend (host `smtp.resend.com`,
port 465, user `resend`, pass = your `RESEND_API_KEY`).

## 2. Provision the orgs + invite codes

Run once per org in the Supabase SQL editor (service-role, bypasses RLS):

```sql
with o as (
  insert into organizations (name) values ('Twin Path') returning id
)
insert into org_invites (code, organization_id, label)
select 'twinpath-7f3a', id, 'Twin Path' from o;
```

Change the name and code per org. Give each org its code; members enter it once on the
sign-in page. The code is also shown in that org's **Settings → Team**.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Var | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (server-only) |
| `KEY_ENCRYPTION_SECRET` | a long random string (stable — see below) |
| `RESEND_API_KEY` | from resend.com |
| `FEEDBACK_EMAIL` | where feedback emails go (your inbox) |
| `NEXT_PUBLIC_APP_URL` | the Vercel URL |

`KEY_ENCRYPTION_SECRET` encrypts each org's Anthropic key at rest. **Keep it stable** —
changing it makes stored keys undecryptable (orgs would just re-paste their key). Generate
with e.g. `openssl rand -base64 48`.

## 4. Deploy

Import the repo into Vercel (Next.js autodetected). Set the env vars above, then deploy.
Confirm the Supabase redirect URLs match the deployed domain.

## 5. Per-org onboarding (what each org does)

1. Sign in with the invite code (first time only).
2. **Settings → AI access:** paste the org's own Anthropic API key
   (console.anthropic.com — an API key, not a Claude.ai plan). Agents stay disabled until
   this is set. Remove anytime; revoke at Anthropic's console.
3. Invite colleagues via the code in **Settings → Team**.

## Cost model

- **Hosting:** Vercel Hobby + Supabase Free = £0 to start. Supabase free projects pause
  after ~7 days idle; upgrade to Supabase Pro (~$25/mo) if that bites.
- **LLM:** each org's Anthropic usage is billed to their own key. None reaches the operator.

## Rollback

- Code: this work is on branch `vercel-multiorg-deploy`; revert by not merging, or
  `git revert` the merge.
- DB: `supabase/migrations/017_multi_org_invites.sql` is additive plus a rewrite of
  `handle_new_user`. To revert the signup behaviour, restore the body from
  `004_handle_new_user.sql`.
