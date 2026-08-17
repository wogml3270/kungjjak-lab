-- Phase 2 reset approved on 2026-08-18. Phase 1 tables are not touched.
drop trigger if exists auth_user_court_admin on auth.users;
drop function if exists public.register_court_admin() cascade;
drop function if exists public.is_court_admin() cascade;
drop table if exists public.court_round_reactions cascade;
drop table if exists public.court_sessions cascade;
drop table if exists public.court_verdicts cascade;
drop table if exists public.court_template_votes cascade;
drop table if exists public.court_votes cascade;
drop table if exists public.court_rounds cascade;
drop table if exists public.moderation_actions cascade;
drop table if exists public.court_cases cascade;
drop table if exists public.court_templates cascade;
drop table if exists public.admin_users cascade;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'moderator' check (role in ('owner', 'moderator')),
  created_at timestamptz not null default now()
);

insert into public.admin_users (user_id, email, role)
select id, email, 'owner' from auth.users
where email in ('wogml3270@gmail.com', 'wogml3270@naver.com');

create function public.register_court_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email in ('wogml3270@gmail.com', 'wogml3270@naver.com') then
    insert into public.admin_users (user_id, email, role)
    values (new.id, new.email, 'owner')
    on conflict (user_id) do update set email = excluded.email, role = 'owner';
  end if;
  return new;
end;
$$;

create trigger auth_user_court_admin after insert or update of email on auth.users
for each row execute function public.register_court_admin();

create function public.is_court_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create table public.court_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category text not null,
  title text not null check (char_length(title) between 5 and 80),
  summary text not null check (char_length(summary) between 10 and 500),
  plaintiff_claim text not null check (char_length(plaintiff_claim) between 10 and 1000),
  defendant_claim text not null check (char_length(defendant_claim) between 10 and 1000),
  emoji text not null default '⚖️',
  difficulty text not null default '가볍게',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  play_count integer not null default 0 check (play_count >= 0),
  created_at timestamptz not null default now()
);

create table public.court_cases (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  title text not null check (char_length(title) between 5 and 80),
  summary text not null check (char_length(summary) between 10 and 500),
  plaintiff_name text not null check (char_length(plaintiff_name) between 1 and 10),
  defendant_name text not null check (char_length(defendant_name) between 1 and 10),
  plaintiff_claim text not null check (char_length(plaintiff_claim) between 10 and 1000),
  defendant_claim text not null check (char_length(defendant_claim) between 10 and 1000),
  status text not null default 'voting' check (status in ('voting', 'completed', 'expired')),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  moderation_status text not null default 'private' check (moderation_status in ('private', 'pending_review', 'approved', 'rejected', 'hidden')),
  moderation_reason text,
  closes_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.court_rounds (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.court_templates(id) on delete cascade,
  case_id uuid references public.court_cases(id) on delete cascade,
  round_order smallint not null check (round_order between 1 and 20),
  round_type text not null check (round_type in ('briefing', 'plaintiff', 'defendant', 'evidence', 'verdict')),
  title text not null check (char_length(title) between 2 and 80),
  content text not null check (char_length(content) between 5 and 1500),
  emoji text not null default '📄',
  evidence_label text,
  created_at timestamptz not null default now(),
  check ((template_id is not null)::integer + (case_id is not null)::integer = 1)
);

create unique index court_rounds_template_order on public.court_rounds(template_id, round_order) where template_id is not null;
create unique index court_rounds_case_order on public.court_rounds(case_id, round_order) where case_id is not null;

create table public.court_sessions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.court_templates(id) on delete cascade,
  case_id uuid references public.court_cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_round_order smallint not null default 1,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((template_id is not null)::integer + (case_id is not null)::integer = 1),
  unique nulls not distinct (template_id, case_id, user_id)
);

create table public.court_round_reactions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.court_rounds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stance text not null check (stance in ('plaintiff', 'both', 'defendant')),
  created_at timestamptz not null default now(),
  unique (round_id, user_id)
);

create table public.court_verdicts (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.court_templates(id) on delete cascade,
  case_id uuid references public.court_cases(id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  choice text not null check (choice in ('plaintiff', 'both', 'defendant')),
  opinion text check (opinion is null or char_length(opinion) <= 300),
  display_name text check (display_name is null or char_length(display_name) between 1 and 10),
  created_at timestamptz not null default now(),
  check ((template_id is not null)::integer + (case_id is not null)::integer = 1)
);

create unique index court_verdicts_template_user on public.court_verdicts(template_id, voter_user_id) where template_id is not null;
create unique index court_verdicts_case_user on public.court_verdicts(case_id, voter_user_id) where case_id is not null;

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.court_cases(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('approve', 'reject', 'hide', 'restore')),
  reason text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.court_templates enable row level security;
alter table public.court_cases enable row level security;
alter table public.court_rounds enable row level security;
alter table public.court_sessions enable row level security;
alter table public.court_round_reactions enable row level security;
alter table public.court_verdicts enable row level security;
alter table public.moderation_actions enable row level security;

create policy "admin_read" on public.admin_users for select to authenticated using (public.is_court_admin());
create policy "templates_read" on public.court_templates for select to anon, authenticated using (is_active or public.is_court_admin());
create policy "templates_admin" on public.court_templates for all to authenticated using (public.is_court_admin()) with check (public.is_court_admin());
create policy "cases_read_anon" on public.court_cases for select to anon using (visibility = 'public' and moderation_status = 'approved');
create policy "cases_read_auth" on public.court_cases for select to authenticated using (visibility = 'public' or creator_user_id = auth.uid() or public.is_court_admin() or status = 'voting');
create policy "cases_insert" on public.court_cases for insert to authenticated with check (creator_user_id = auth.uid() and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);
create policy "cases_update_owner" on public.court_cases for update to authenticated using (creator_user_id = auth.uid() and moderation_status in ('private', 'rejected')) with check (creator_user_id = auth.uid() and visibility = 'private' and moderation_status in ('private', 'pending_review', 'rejected'));
create policy "cases_delete_owner" on public.court_cases for delete to authenticated using (creator_user_id = auth.uid() and moderation_status in ('private', 'rejected'));
create policy "cases_admin" on public.court_cases for all to authenticated using (public.is_court_admin()) with check (public.is_court_admin());

create policy "rounds_read" on public.court_rounds for select to authenticated using (
  exists (select 1 from public.court_templates t where t.id = template_id and t.is_active)
  or exists (select 1 from public.court_cases c where c.id = case_id and (c.visibility = 'public' or c.status = 'voting' or c.creator_user_id = auth.uid()))
  or public.is_court_admin()
);
create policy "rounds_read_anon" on public.court_rounds for select to anon using (
  exists (select 1 from public.court_templates t where t.id = template_id and t.is_active)
  or exists (select 1 from public.court_cases c where c.id = case_id and c.visibility = 'public' and c.moderation_status = 'approved')
);
create policy "rounds_insert_owner" on public.court_rounds for insert to authenticated with check (exists (select 1 from public.court_cases c where c.id = case_id and c.creator_user_id = auth.uid() and c.moderation_status in ('private', 'rejected')));
create policy "rounds_update_owner" on public.court_rounds for update to authenticated using (exists (select 1 from public.court_cases c where c.id = case_id and c.creator_user_id = auth.uid() and c.moderation_status in ('private', 'rejected')));
create policy "rounds_delete_owner" on public.court_rounds for delete to authenticated using (exists (select 1 from public.court_cases c where c.id = case_id and c.creator_user_id = auth.uid() and c.moderation_status in ('private', 'rejected')));

create policy "sessions_own" on public.court_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reactions_read" on public.court_round_reactions for select to authenticated using (true);
create policy "reactions_write" on public.court_round_reactions for insert to authenticated with check (user_id = auth.uid());
create policy "verdicts_read" on public.court_verdicts for select to authenticated using (true);
create policy "verdicts_insert" on public.court_verdicts for insert to authenticated with check (voter_user_id = auth.uid());
create policy "moderation_read" on public.moderation_actions for select to authenticated using (public.is_court_admin());
create policy "moderation_insert" on public.moderation_actions for insert to authenticated with check (public.is_court_admin() and admin_user_id = auth.uid());

grant select on public.admin_users to authenticated;
grant select on public.court_templates to anon, authenticated;
grant select on public.court_cases to anon;
grant select, insert, update, delete on public.court_cases to authenticated;
grant select on public.court_rounds to anon;
grant select, insert, update, delete on public.court_rounds to authenticated;
grant select, insert, update on public.court_sessions to authenticated;
grant select, insert on public.court_round_reactions to authenticated;
grant select, insert on public.court_verdicts to authenticated;
grant select, insert on public.moderation_actions to authenticated;
grant execute on function public.is_court_admin() to authenticated;
