-- Rollback for 020_usage_and_demo.sql
-- Drops metering and demo flags, and restores the 018/019 view definitions
-- without the demo exclusion. Run 019 afterwards if you want those views back
-- exactly as that migration left them.

drop view if exists admin_org_spend;
drop table if exists agent_usage;

-- Demo rows become indistinguishable from real ones once the flag is gone,
-- so clear them first. Deleting the accounts cascades to their deals,
-- contacts, deal_contacts and activities.
delete from accounts where is_demo = true;
delete from deals where is_demo = true;
alter table accounts drop column if exists is_demo;
alter table deals    drop column if exists is_demo;
alter table organizations drop column if exists demo_seeded_at;

drop index if exists idx_deals_is_demo;
