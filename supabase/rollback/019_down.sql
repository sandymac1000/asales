-- Rollback for 019_admin_usage_charts.sql
-- Drops the four operator-console chart views. Views only — no data is
-- touched, so this is safe to run at any time; /admin loses the charts and
-- falls back to the 018 usage table.
-- Run in the Supabase SQL editor (or: supabase db execute).

drop view if exists admin_logins_daily;
drop view if exists admin_login_recency;
drop view if exists admin_deals_daily;
drop view if exists admin_signups_daily;
