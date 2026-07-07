-- Provision an organisation + its invite code.
-- Run once per org in the Supabase dashboard SQL editor (service-role context,
-- bypasses RLS). Change the name and code for each org. Give each org its code;
-- members enter it once on the sign-in page, and can see it later in
-- Settings > Team to invite colleagues.
--
-- Use a hard-to-guess code (random suffix) so signups stay controlled.

-- ── Example: repeat this block per org ──────────────────────────────────────
with o as (
  insert into organizations (name) values ('Twin Path') returning id
)
insert into org_invites (code, organization_id, label)
select 'twinpath-7f3a91', id, 'Twin Path' from o;

-- with o as (insert into organizations (name) values ('Portfolio Co 1') returning id)
-- insert into org_invites (code, organization_id, label)
-- select 'portco1-b2e4c8', id, 'Portfolio Co 1' from o;

-- ── List all orgs + codes (to hand out) ─────────────────────────────────────
-- select o.name, i.code
-- from organizations o join org_invites i on i.organization_id = o.id
-- order by o.name;
