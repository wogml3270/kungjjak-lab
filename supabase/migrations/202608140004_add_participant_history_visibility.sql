-- Keep lobby readiness separate from each participant's history preference.
alter table public.participants
  add column if not exists history_visible boolean not null default true;

update public.participants
set history_visible = true;
