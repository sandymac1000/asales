-- Replace single quarterly_target_acv with per-quarter fields
alter table organizations
  add column if not exists q1_target_acv integer,
  add column if not exists q2_target_acv integer,
  add column if not exists q3_target_acv integer,
  add column if not exists q4_target_acv integer;

-- Migrate any existing value into the current quarter's field
do $$
declare
  q integer := ceil(extract(month from now()) / 3.0)::integer;
begin
  if q = 1 then
    update organizations set q1_target_acv = quarterly_target_acv where quarterly_target_acv is not null;
  elsif q = 2 then
    update organizations set q2_target_acv = quarterly_target_acv where quarterly_target_acv is not null;
  elsif q = 3 then
    update organizations set q3_target_acv = quarterly_target_acv where quarterly_target_acv is not null;
  else
    update organizations set q4_target_acv = quarterly_target_acv where quarterly_target_acv is not null;
  end if;
end;
$$;

alter table organizations drop column if exists quarterly_target_acv;
