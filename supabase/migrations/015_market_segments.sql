-- ============================================================
-- Salient — market segments (ICP hypotheses + adjacencies)
-- ============================================================
-- A structured, iterable layer alongside the market_context blob.
-- One row per {market scope, ICP, buyer} hypothesis, each carrying an
-- explainable confidence, an evidence count, and the reasoning behind it.
-- Deal outcomes nudge confidence via a trigger (see below).

create table market_segments (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  kind                 text not null default 'adjacent' check (kind in ('core','adjacent')),
  axis                 text not null default 'buyer'    check (axis in ('buyer','market')),
  label                text not null,
  -- descriptive ICP fields (agent-authored, human-editable):
  -- {industry,size,geography,buyer_title,measured_on,trigger,champion,objections,terminology}
  profile              jsonb   not null default '{}',
  -- explainable belief
  confidence           integer not null default 40 check (confidence between 0 and 100),
  confidence_rationale text,
  evidence_count       integer not null default 0,
  status               text not null default 'active' check (status in ('active','disproven')),
  source               text not null default 'agent'  check (source in ('agent','user','evidence')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Link a deal to the segment hypothesis it tests (nullable; detaches on segment delete)
alter table deals add column if not exists segment_id uuid references market_segments(id) on delete set null;

create index idx_market_segments_org on market_segments(organization_id);
create index idx_deals_segment       on deals(segment_id) where segment_id is not null;

-- updated_at trigger (reuses set_updated_at from 001)
create trigger trg_market_segments_updated_at before update on market_segments
  for each row execute function set_updated_at();

-- ============================================================
-- Evidence loop: won/lost deals nudge their segment's confidence.
-- Coarse and explainable — no fake precision. Each closed outcome
-- moves confidence a fixed step (won up, lost down), clamps to
-- [5,95], increments the evidence count, and records the rationale.
-- ============================================================
create or replace function apply_segment_evidence()
returns trigger language plpgsql as $$
declare
  delta integer;
begin
  if new.segment_id is not null
     and new.stage in ('won','lost')
     and new.stage is distinct from old.stage then
    delta := case when new.stage = 'won' then 10 else -6 end;
    update market_segments
       set confidence           = greatest(5, least(95, confidence + delta)),
           evidence_count       = evidence_count + 1,
           confidence_rationale = 'Adjusted from ' || (evidence_count + 1) || ' closed deal outcome(s)',
           source               = 'evidence',
           updated_at           = now()
     where id = new.segment_id;
  end if;
  return new;
end;
$$;

create trigger trg_deals_segment_evidence after update of stage on deals
  for each row execute function apply_segment_evidence();

-- ============================================================
-- RLS
-- ============================================================
alter table market_segments enable row level security;
create policy "market_segments_all" on market_segments for all
  using (organization_id = current_org_id());
