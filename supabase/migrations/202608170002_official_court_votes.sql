-- Fixed operator-curated cases use their own shared vote stream.
create table if not exists public.court_template_votes (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.court_templates(id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  choice text not null check (choice in ('plaintiff', 'defendant', 'both')),
  opinion text check (opinion is null or char_length(opinion) <= 300),
  created_at timestamptz not null default now(),
  constraint court_template_votes_once unique (template_id, voter_user_id)
);

create index if not exists court_template_votes_template_idx
  on public.court_template_votes(template_id, created_at desc);

alter table public.court_template_votes enable row level security;

create policy "court_template_votes_read" on public.court_template_votes
  for select to authenticated using (true);
create policy "court_template_votes_insert" on public.court_template_votes
  for insert to authenticated with check (
    voter_user_id = auth.uid()
    and exists (
      select 1 from public.court_templates template
      where template.id = template_id and template.is_active = true
    )
  );

grant select, insert on public.court_template_votes to authenticated;

create policy "court_cases_read_public_anon" on public.court_cases
  for select to anon
  using (visibility = 'public' and moderation_status = 'approved');

grant select on public.court_cases to anon;
