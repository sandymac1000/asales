-- ============================================================
-- Salient — initial schema
-- ============================================================

-- Extensions (gen_random_uuid is built-in on Postgres 13+; no extension needed)

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  domain      text,
  -- feature flags — controls tier unlocks per org
  features    jsonb not null default '{
    "tier1_expansion":          false,
    "tier1_milestones":         false,
    "tier2_meddpicc_lite":      false,
    "tier3_meddpicc_full":      false,
    "tier3_debrief_agent":      false,
    "tier3_qualification_agent":false,
    "pipeline_kanban":          false
  }'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- USERS (profile, extends auth.users)
-- ============================================================
create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null default '',
  role            text not null default 'member' check (role in ('founder','sales_rep','manager','member')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- ACCOUNTS (companies being sold to)
-- ============================================================
create table accounts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  domain          text,
  industry        text,
  size_band       text check (size_band in ('1-50','51-200','201-1000','1001+')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- CONTACTS
-- ============================================================
create table contacts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  account_id      uuid not null references accounts(id) on delete cascade,
  name            text not null,
  title           text,
  email           text,
  linkedin_url    text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- DEALS
-- All tier columns present from day one — nullable until the
-- relevant feature flag is enabled. Zero schema migrations
-- when a tier is unlocked.
-- ============================================================
create table deals (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  account_id      uuid not null references accounts(id) on delete cascade,
  owner_id        uuid references users(id) on delete set null,
  name            text not null,

  -- Stage & type
  stage           text not null default 'exploring'
                  check (stage in ('exploring','qualifying','proposing','closing','won','lost')),
  type            text not null default 'new_business'
                  check (type in ('new_business','expansion')),
  parent_deal_id  uuid references deals(id) on delete set null,

  -- ── Tier 0: core five ──────────────────────────────────────
  economic_buyer_contact_id  uuid references contacts(id) on delete set null,
  economic_buyer_met         boolean not null default false,
  pain                       text,   -- one sentence
  success_criteria           text,
  next_action                text,
  next_action_date           date,

  -- ── Deal value ─────────────────────────────────────────────
  acv_value               integer,   -- annual contract value, in pence
  tcv_value               integer,   -- computed: acv × contract_length_months ÷ 12
  nre_value               integer,   -- non-recurring engineering (one-time)
  contract_length_months  integer not null default 12,
  currency                text not null default 'GBP',
  expected_close_date     date,
  lost_reason             text,

  -- ── Tier 1: expansion tracking ────────────────────────────
  expansion_vision    text,
  expansion_eb_name   text,
  expansion_eb_met    boolean not null default false,
  milestone_30_date   date,
  milestone_60_date   date,
  milestone_90_date   date,

  -- ── Tier 2: MEDDPICC lite (M, E, I, C) ───────────────────
  meddpicc_metrics        text,
  meddpicc_metrics_health text check (meddpicc_metrics_health in ('red','amber','green')),

  meddpicc_eb_notes       text,
  meddpicc_eb_health      text check (meddpicc_eb_health in ('red','amber','green')),

  meddpicc_pain_notes     text,
  meddpicc_pain_health    text check (meddpicc_pain_health in ('red','amber','green')),

  meddpicc_champion_notes  text,
  meddpicc_champion_health text check (meddpicc_champion_health in ('red','amber','green')),

  -- ── Tier 3: full MEDDPICC (D, D, P, C) ───────────────────
  meddpicc_decision_criteria        text,
  meddpicc_decision_criteria_health text check (meddpicc_decision_criteria_health in ('red','amber','green')),

  meddpicc_decision_process         text,
  meddpicc_decision_process_health  text check (meddpicc_decision_process_health in ('red','amber','green')),

  meddpicc_paper_process            text,
  meddpicc_paper_process_health     text check (meddpicc_paper_process_health in ('red','amber','green')),

  meddpicc_competition              text,
  meddpicc_competition_health       text check (meddpicc_competition_health in ('red','amber','green')),

  -- ── Qualification score (agent-computed) ──────────────────
  qualification_score       integer check (qualification_score between 0 and 100),
  qualification_updated_at  timestamptz,

  -- ── Timestamps ────────────────────────────────────────────
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  closed_at   timestamptz
);

-- ============================================================
-- DEAL CONTACTS (buying committee)
-- ============================================================
create table deal_contacts (
  id              uuid primary key default gen_random_uuid(),
  deal_id         uuid not null references deals(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  role            text not null default 'influencer'
                  check (role in ('economic_buyer','champion','technical_buyer','user_buyer','blocker','influencer')),
  sentiment       text not null default 'unknown'
                  check (sentiment in ('positive','neutral','negative','unknown')),
  last_engaged_at timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (deal_id, contact_id)
);

-- ============================================================
-- ACTIVITIES (timeline per deal)
-- ============================================================
create table activities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  deal_id         uuid not null references deals(id) on delete cascade,
  contact_id      uuid references contacts(id) on delete set null,
  created_by      uuid references users(id) on delete set null,
  type            text not null
                  check (type in ('call','email','meeting','note','transcript','milestone')),
  title           text,
  notes           text,
  raw_transcript  text,
  agent_summary   text,          -- written by Debrief Agent
  created_at      timestamptz not null default now()
);

-- ============================================================
-- CONCEPTS (didactic content — seeded, not user-edited)
-- ============================================================
create table concepts (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  short_explanation text not null,   -- 2–3 sentences, shown inline
  full_explanation  text not null,   -- markdown, shown in drawer / learn page
  test_question     text not null,   -- the question to ask the prospect
  red_pattern       text not null,   -- what weak coverage looks like
  green_pattern     text not null,   -- what strong coverage looks like
  failure_anecdote  text not null,   -- generalised story — book material
  tier              integer not null default 0 check (tier in (0,1,2,3)),
  sort_order        integer not null default 0
);

-- ============================================================
-- CONCEPT VIEWS (track which concepts each user has read)
-- ============================================================
create table concept_views (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  concept_id  uuid not null references concepts(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  unique (user_id, concept_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_accounts_org       on accounts(organization_id);
create index idx_contacts_account   on contacts(account_id);
create index idx_deals_org          on deals(organization_id);
create index idx_deals_account      on deals(account_id);
create index idx_deals_stage        on deals(organization_id, stage);
create index idx_deals_next_action  on deals(organization_id, next_action_date) where stage not in ('won','lost');
create index idx_deal_contacts_deal on deal_contacts(deal_id);
create index idx_activities_deal    on activities(deal_id, created_at desc);

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_organizations_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();
create trigger trg_accounts_updated_at before update on accounts
  for each row execute function set_updated_at();
create trigger trg_contacts_updated_at before update on contacts
  for each row execute function set_updated_at();
create trigger trg_deals_updated_at before update on deals
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table organizations  enable row level security;
alter table users          enable row level security;
alter table accounts       enable row level security;
alter table contacts       enable row level security;
alter table deals          enable row level security;
alter table deal_contacts  enable row level security;
alter table activities     enable row level security;
alter table concepts       enable row level security;
alter table concept_views  enable row level security;

-- Helper: get the org for the current user
create or replace function current_org_id()
returns uuid language sql stable security definer as $$
  select organization_id from users where id = auth.uid()
$$;

-- Organizations: members can read their own org
create policy "org_read"   on organizations for select using (id = current_org_id());
create policy "org_update" on organizations for update using (id = current_org_id());

-- Users: read/update own org members
create policy "users_read"   on users for select using (organization_id = current_org_id());
create policy "users_insert" on users for insert with check (organization_id = current_org_id());
create policy "users_update" on users for update using (organization_id = current_org_id());

-- Accounts
create policy "accounts_all" on accounts for all using (organization_id = current_org_id());

-- Contacts
create policy "contacts_all" on contacts for all using (organization_id = current_org_id());

-- Deals
create policy "deals_all" on deals for all using (organization_id = current_org_id());

-- Deal contacts (scoped via deal)
create policy "deal_contacts_all" on deal_contacts for all
  using (deal_id in (select id from deals where organization_id = current_org_id()));

-- Activities (scoped via deal)
create policy "activities_all" on activities for all using (organization_id = current_org_id());

-- Concepts: readable by everyone (public didactic content)
create policy "concepts_read" on concepts for select using (true);

-- Concept views: own rows only
create policy "concept_views_all" on concept_views for all using (user_id = auth.uid());
