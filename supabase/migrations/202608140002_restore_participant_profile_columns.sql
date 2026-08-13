-- Repair fresh databases created from an older schema and preserve existing rows.
alter table public.participants
  add column if not exists display_name text,
  add column if not exists avatar_url text;

alter table public.participants
  drop constraint if exists participants_display_name_length;

alter table public.participants
  add constraint participants_display_name_length
  check (display_name is null or char_length(display_name) between 1 and 10) not valid;

alter table public.participants
  validate constraint participants_display_name_length;
