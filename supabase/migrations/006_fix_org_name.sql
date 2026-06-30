-- Fix handle_new_user to use 'My Organisation' instead of the email domain
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from organizations limit 1;

  if v_org_id is null then
    insert into organizations (name, domain, features)
    values (
      'My Organisation',
      split_part(new.email, '@', 2),
      '{"tier1_expansion":false,"tier1_milestones":false,"tier2_meddpicc_lite":false,"tier3_meddpicc_full":false,"tier3_debrief_agent":false,"tier3_qualification_agent":false,"pipeline_kanban":false}'::jsonb
    )
    returning id into v_org_id;
  end if;

  insert into users (id, organization_id, name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'founder'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Fix existing orgs where name was set to an email domain (no spaces, contains a dot)
update organizations
set name = 'My Organisation'
where name ~ '^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$'
  and position(' ' in name) = 0;
