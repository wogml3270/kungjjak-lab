-- Keep a snapshot of the profile shown at the time of a Co-op experiment.
alter table public.participants add column if not exists avatar_url text;
