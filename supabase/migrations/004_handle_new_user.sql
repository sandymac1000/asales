-- Auto-create org + user profile when a new auth user signs in for the first time.
-- For v1 single-org: reuses the existing org if one exists; creates one if not.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
begin
  -- Single-org model: join existing org if present, else create one
  select id into v_org_id from organizations limit 1;

  if v_org_id is null then
    insert into organizations (name, domain, features)
    values (
      split_part(new.email, '@', 2),
      split_part(new.email, '@', 2),
      '{
        "tier1_expansion": false,
        "tier1_milestones": false,
        "tier2_meddpicc_lite": false,
        "tier3_meddpicc_full": false,
        "tier3_debrief_agent": false,
        "tier3_qualification_agent": false,
        "pipeline_kanban": false
      }'::jsonb
    )
    returning id into v_org_id;
  end if;

  insert into users (id, organization_id, name, role)
  values (
    new.id,
    v_org_id,
    coalesce(
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'founder'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
