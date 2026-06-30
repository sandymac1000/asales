-- Add 'coaching' activity type by dropping and recreating the check constraint
alter table activities drop constraint if exists activities_type_check;
alter table activities add constraint activities_type_check
  check (type in ('call', 'email', 'meeting', 'note', 'transcript', 'milestone', 'coaching'));
