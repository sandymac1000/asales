create table deal_actions (
  id              uuid primary key default gen_random_uuid(),
  deal_id         uuid not null references deals(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  description     text not null,
  owner_name      text,
  due_date        date,
  completed_at    timestamptz,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table deal_actions enable row level security;
create policy "deal_actions_all" on deal_actions for all
  using (organization_id = current_org_id());

create index idx_deal_actions_deal on deal_actions(deal_id, completed_at, due_date);
