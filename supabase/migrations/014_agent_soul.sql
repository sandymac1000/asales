alter table organizations
  add column if not exists market_context text,
  add column if not exists agent_models jsonb not null default '{"coach":"claude-opus-4-8","debrief":"claude-sonnet-4-6","qualify":"claude-sonnet-4-6","scorecard":"claude-opus-4-8"}';
