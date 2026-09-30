-- ============================================================
-- Agent usage metering + demo mode
-- ============================================================
-- Two features that share a migration because they touch the same views:
--
-- 1. agent_usage — one row per model call, so an org can see what Salient is
--    spending on their own Anthropic key. This is the evidence behind the
--    "here is exactly what we did with your key" conversation; Anthropic's own
--    console remains the authoritative number.
--
-- 2. Demo mode — seeded example deals so a new org can explore before handing
--    over an API key. Demo rows are real rows (same tables, same RLS, same UI)
--    marked with a flag, and every adoption view below excludes them: six
--    seeded deals must never read as six deals of real usage in the operator
--    console.

-- ------------------------------------------------------------
-- 1. Per-call usage records
-- ------------------------------------------------------------
create table if not exists agent_usage (
  id                          uuid primary key default gen_random_uuid(),
  organization_id             uuid not null references organizations(id) on delete cascade,
  user_id                     uuid references users(id) on delete set null,
  -- coach | scorecard | market | qualify | debrief
  agent                       text not null,
  model                       text not null,
  input_tokens                integer not null default 0,
  output_tokens               integer not null default 0,
  cache_read_input_tokens     integer not null default 0,
  cache_creation_input_tokens integer not null default 0,
  -- Set when the call was about a specific deal (coach, qualify, debrief).
  deal_id                     uuid references deals(id) on delete set null,
  -- A streamed call the user cancelled reports partial usage; flagged so the
  -- numbers can be read honestly rather than silently under-counting.
  partial                     boolean not null default false,
  created_at                  timestamptz not null default now()
);

create index if not exists idx_agent_usage_org_created
  on agent_usage (organization_id, created_at desc);

alter table agent_usage enable row level security;

-- Members may read their own org's usage — it is their spend, on their key.
-- There is deliberately no insert/update/delete policy: rows are written by
-- the server with the service role, so a client can never forge or erase one.
drop policy if exists "agent_usage_read_own" on agent_usage;
create policy "agent_usage_read_own" on agent_usage for select
  using (organization_id = current_org_id());

-- ------------------------------------------------------------
-- 2. Demo mode flags
-- ------------------------------------------------------------
-- The flag goes on accounts as well as deals so that clearing a demo is a
-- single delete: contacts, deals, deal_contacts and activities all cascade
-- from accounts, so there is no orphan sweep to get wrong later.
alter table accounts add column if not exists is_demo boolean not null default false;
alter table deals    add column if not exists is_demo boolean not null default false;
alter table organizations add column if not exists demo_seeded_at timestamptz;

-- Demo deals are excluded from every adoption view, so the flag is worth an
-- index on the column the views filter by.
create index if not exists idx_deals_is_demo on deals (organization_id) where is_demo = false;

-- ------------------------------------------------------------
-- 3. Re-cut the adoption views to exclude demo data
--    (redefines the 018 and 019 views; safe to re-run)
-- ------------------------------------------------------------
create or replace view admin_org_usage as
select
  o.id                         as organization_id,
  o.name                       as name,
  o.created_at                 as created_at,
  (select code from org_invites i where i.organization_id = o.id order by i.created_at limit 1) as invite_code,
  (select count(*) from users u where u.organization_id = o.id)  as member_count,
  (select count(*) from deals d where d.organization_id = o.id and d.is_demo = false) as deal_count,
  (
    select max(au.last_sign_in_at)
    from users u
    join auth.users au on au.id = u.id
    where u.organization_id = o.id
  )                            as last_sign_in_at
from organizations o;

create or replace view admin_deals_daily as
select
  d.organization_id,
  o.name                              as org_name,
  (d.created_at at time zone 'UTC')::date as day,
  count(*)::int                       as deals
from deals d
join organizations o on o.id = d.organization_id
where d.is_demo = false
group by d.organization_id, o.name, (d.created_at at time zone 'UTC')::date;

-- ------------------------------------------------------------
-- 4. Operator-console spend rollup (metadata only — token counts, never
--    prompts, never deal contents, never keys).
-- ------------------------------------------------------------
create or replace view admin_org_spend as
select
  u.organization_id,
  o.name                                  as org_name,
  (u.created_at at time zone 'UTC')::date as day,
  u.agent,
  u.model,
  count(*)::int                           as calls,
  sum(u.input_tokens)::bigint                as input_tokens,
  sum(u.output_tokens)::bigint               as output_tokens,
  sum(u.cache_read_input_tokens)::bigint     as cache_read_input_tokens,
  sum(u.cache_creation_input_tokens)::bigint as cache_creation_input_tokens
from agent_usage u
join organizations o on o.id = u.organization_id
group by u.organization_id, o.name, (u.created_at at time zone 'UTC')::date, u.agent, u.model;

revoke all on admin_org_spend from anon, authenticated;
grant select on admin_org_spend to service_role;
