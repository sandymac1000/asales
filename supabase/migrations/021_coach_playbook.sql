-- ============================================================
-- Per-deal coaching playbook override
-- ============================================================
-- Domain tuning used to be an org-level constant derived from what the founder
-- sells. That breaks the moment a founder sells into more than one vertical,
-- which is the normal case and the whole point of treating ICP as a portfolio:
-- the same company has an aerospace deal and a pharma deal, and they need
-- different coaching.
--
-- Tuning now resolves per deal, and this column is the top of that cascade —
-- an explicit human choice that beats anything inferred. Null means "work it
-- out from the deal", which is the default.
--
-- Deliberately text rather than an enum: the playbook set will grow, and a new
-- vertical should not require a migration to become selectable.

alter table deals add column if not exists coach_playbook text;

comment on column deals.coach_playbook is
  'Explicit domain playbook for the coach on this deal. Null = auto-detect from segment, then account industry, then org product context. "none" = deliberately no playbook.';
