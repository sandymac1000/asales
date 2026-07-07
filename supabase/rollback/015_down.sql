-- Rollback for 015_market_segments.sql
-- Fully reverses the market-segments feature at the database level.
-- Run in the Supabase SQL editor (or: supabase db execute) if you need to undo.
-- Order matters: drop dependents before the table.

drop trigger if exists trg_deals_segment_evidence on deals;
drop function if exists apply_segment_evidence();

drop index if exists idx_deals_segment;
alter table deals drop column if exists segment_id;

-- cascade removes the RLS policy, the updated_at trigger, and remaining indexes
drop table if exists market_segments cascade;
