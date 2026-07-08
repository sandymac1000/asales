-- ============================================================
-- Operator console: per-org usage metadata (metadata only)
-- ============================================================
-- A view the global operator reads (via the service role) to see adoption
-- across all orgs. Deliberately METADATA ONLY — counts and last activity,
-- never deal contents and never the Anthropic keys. No client RLS policy is
-- added, so anon/authenticated clients get nothing; the service role bypasses
-- RLS and is gated in the app by ADMIN_EMAILS.

-- Record who an invite was emailed to (operator convenience).
alter table org_invites add column if not exists sent_to text;
alter table org_invites add column if not exists sent_at timestamptz;

-- Per-org rollup. Owned by the migration role, so it may read auth.users.
create or replace view admin_org_usage as
select
  o.id                         as organization_id,
  o.name                       as name,
  o.created_at                 as created_at,
  (select code from org_invites i where i.organization_id = o.id order by i.created_at limit 1) as invite_code,
  (select count(*) from users u where u.organization_id = o.id)  as member_count,
  (select count(*) from deals d where d.organization_id = o.id)  as deal_count,
  (
    select max(au.last_sign_in_at)
    from users u
    join auth.users au on au.id = u.id
    where u.organization_id = o.id
  )                            as last_sign_in_at
from organizations o;

-- Lock the view down: revoke from client roles; only service_role reads it.
revoke all on admin_org_usage from anon, authenticated;
grant select on admin_org_usage to service_role;
