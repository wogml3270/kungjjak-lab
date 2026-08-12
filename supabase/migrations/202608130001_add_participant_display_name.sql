-- Preserve existing participants and add an optional name for new Co-op records.
alter table public.participants
  add column if not exists display_name text;

alter table public.participants
  drop constraint if exists participants_display_name_length;

alter table public.participants
  add constraint participants_display_name_length
  check (display_name is null or char_length(display_name) between 1 and 20);
