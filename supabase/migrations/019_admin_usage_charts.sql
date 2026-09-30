-- ============================================================
-- Operator console: usage charts (metadata only)
-- ============================================================
-- Adds the time-series and recency views behind the adoption charts in
-- /admin. Same contract as 018: deliberately METADATA ONLY — counts and
-- timestamps, never deal contents and never the Anthropic keys. No client RLS
-- policy is added, so anon/authenticated clients get nothing; the service role
-- bypasses RLS and is gated in the app by ADMIN_EMAILS.
--
-- These are views, not tables, so they cost nothing until read and need no
-- backfill. Views are owned by the migration role, so they may read auth.*.

-- ------------------------------------------------------------
-- 1. Members joining per day, per org.
-- ------------------------------------------------------------
create or replace view admin_signups_daily as
select
  u.organization_id,
  o.name                              as org_name,
  (u.created_at at time zone 'UTC')::date as day,
  count(*)::int                       as members
from users u
join organizations o on o.id = u.organization_id
group by u.organization_id, o.name, (u.created_at at time zone 'UTC')::date;

-- ------------------------------------------------------------
-- 2. Deals created per day, per org. A count, never the contents.
-- ------------------------------------------------------------
create or replace view admin_deals_daily as
select
  d.organization_id,
  o.name                              as org_name,
  (d.created_at at time zone 'UTC')::date as day,
  count(*)::int                       as deals
from deals d
join organizations o on o.id = d.organization_id
group by d.organization_id, o.name, (d.created_at at time zone 'UTC')::date;

-- ------------------------------------------------------------
-- 3. Login recency, bucketed per org. Answers "who is still here?".
--    'never' covers a provisioned account that has not yet signed in —
--    i.e. an invite that was sent but never used.
-- ------------------------------------------------------------
create or replace view admin_login_recency as
select
  u.organization_id,
  o.name as org_name,
  case
    when au.last_sign_in_at is null                          then 'never'
    when au.last_sign_in_at >= now() - interval '1 day'       then 'today'
    when au.last_sign_in_at >= now() - interval '7 days'      then 'week'
    when au.last_sign_in_at >= now() - interval '30 days'     then 'month'
    else                                                          'dormant'
  end            as bucket,
  count(*)::int  as users
from users u
join organizations o on o.id = u.organization_id
left join auth.users au on au.id = u.id
group by u.organization_id, o.name, 3;

-- ------------------------------------------------------------
-- 4. Login frequency over time, per org, from the GoTrue audit log.
--
--    CAVEAT: auth.audit_log_entries is GoTrue's own log and Supabase prunes
--    it, so this is recent history only — treat a missing day as "no data
--    retained", not "nobody logged in". Capped at 90 days to keep the scan
--    small. actor_id is compared as text so a non-uuid actor (a system entry)
--    can never raise a cast error.
-- ------------------------------------------------------------
create or replace view admin_logins_daily as
select
  u.organization_id,
  o.name                                  as org_name,
  (a.created_at at time zone 'UTC')::date as day,
  count(*)::int                           as logins,
  count(distinct u.id)::int               as actors
from auth.audit_log_entries a
join users u          on u.id::text = a.payload->>'actor_id'
join organizations o  on o.id = u.organization_id
where a.payload->>'action' = 'login'
  and a.created_at >= now() - interval '90 days'
group by u.organization_id, o.name, (a.created_at at time zone 'UTC')::date;

-- ------------------------------------------------------------
-- Lock all four down: revoke from client roles; only service_role reads them.
-- ------------------------------------------------------------
revoke all on admin_signups_daily, admin_deals_daily,
              admin_login_recency, admin_logins_daily
  from anon, authenticated;

grant select on admin_signups_daily, admin_deals_daily,
                admin_login_recency, admin_logins_daily
  to service_role;
