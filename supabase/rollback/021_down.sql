-- Rollback for 021_coach_playbook.sql
-- Drops the per-deal override. Coaching falls back to auto-detection, so no
-- deal loses coaching — only explicit choices are lost.

alter table deals drop column if exists coach_playbook;
