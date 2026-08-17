-- Add a safe public byline snapshot without exposing auth user metadata.
alter table public.court_template_votes
  add column if not exists display_name text
  check (display_name is null or char_length(display_name) between 1 and 10);
