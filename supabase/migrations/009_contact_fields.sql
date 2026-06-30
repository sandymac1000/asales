alter table contacts
  add column if not exists phone text,
  add column if not exists whatsapp text;
