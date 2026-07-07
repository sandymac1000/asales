-- ============================================================
-- Multi-org: invite-based signup + per-org secrets
-- ============================================================
-- Replaces the single-org model (004) where every signup joined the first
-- organization. Now: a user has no org until they claim an invite code, and
-- each org stores its own (encrypted) Anthropic key, server-side only.

-- ── Invites ─────────────────────────────────────────────────────────────────
-- One shareable code per org (a member can read their own org's code to invite
-- colleagues; nobody can read another org's).
create table org_invites (
  code            text primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  label           text,
  created_at      timestamptz not null default now()
);

create index idx_org_invites_org on org_invites(organization_id);

alter table org_invites enable row level security;
create policy "org_invites_read_own" on org_invites for select
  using (organization_id = current_org_id());

-- ── Per-org secrets (Anthropic key) ─────────────────────────────────────────
-- RLS grants NO access to normal clients; only the service role (server) reads
-- or writes. The plaintext key is encrypted app-side before it lands here.
create table org_secrets (
  organization_id           uuid primary key references organizations(id) on delete cascade,
  anthropic_key_ciphertext  text,
  anthropic_key_last4       text,
  updated_at                timestamptz not null default now()
);

alter table org_secrets enable row level security;
-- No policies for anon/authenticated => default deny. Service role bypasses RLS.

create trigger trg_org_secrets_updated_at before update on org_secrets
  for each row execute function set_updated_at();

-- ── Rewrite handle_new_user: no auto-join ───────────────────────────────────
-- A new auth user gets NO org and NO users row. They must claim an invite
-- (see claim_invite) which creates their users row against a specific org.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Intentionally does nothing on signup. Org membership is established by
  -- claim_invite() after the user presents a valid invite code.
  return new;
end;
$$;

-- ── claim_invite: join the org for a valid code ─────────────────────────────
-- Security definer so it can validate the code and insert the users row under
-- RLS. Idempotent: if the caller already has a users row, it is left as-is.
create or replace function claim_invite(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
  v_existing uuid;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Already a member? Return current org, ignore the code.
  select organization_id into v_existing from users where id = auth.uid();
  if v_existing is not null then
    return v_existing;
  end if;

  select organization_id into v_org_id
  from org_invites where code = trim(invite_code);

  if v_org_id is null then
    raise exception 'invalid invite code';
  end if;

  select coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1))
    into v_name from auth.users where id = auth.uid();

  insert into users (id, organization_id, name, role)
  values (auth.uid(), v_org_id, coalesce(v_name, ''), 'founder')
  on conflict (id) do nothing;

  return v_org_id;
end;
$$;

grant execute on function claim_invite(text) to authenticated;
