alter table contacts
  add column if not exists referred_by text;
