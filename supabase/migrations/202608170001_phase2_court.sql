-- KungJjak Lab v2: curated/custom court cases, voting, and manual moderation.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'moderator' check (role in ('owner', 'moderator')),
  created_at timestamptz not null default now()
);

insert into public.admin_users (user_id, email, role)
select id, email, 'owner'
from auth.users
where email in ('wogml3270@gmail.com', 'wogml3270@naver.com')
on conflict (user_id) do update set email = excluded.email, role = 'owner';

create or replace function public.register_court_admin()
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

drop trigger if exists auth_user_court_admin on auth.users;
create trigger auth_user_court_admin after insert or update of email on auth.users
for each row execute function public.register_court_admin();

create or replace function public.is_court_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create table if not exists public.court_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category text not null,
  title text not null check (char_length(title) between 5 and 80),
  summary text not null check (char_length(summary) between 10 and 500),
  plaintiff_claim text not null check (char_length(plaintiff_claim) between 10 and 1000),
  defendant_claim text not null check (char_length(defendant_claim) between 10 and 1000),
  emoji text not null default '⚖️',
  difficulty text not null default '가볍게' check (difficulty in ('가볍게', '진지하게', '뜨겁게')),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  play_count integer not null default 0 check (play_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.court_cases (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.court_templates(id) on delete set null,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('template', 'custom')),
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
  closes_at timestamptz not null default now() + interval '3 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.court_votes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.court_cases(id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  choice text not null check (choice in ('plaintiff', 'defendant', 'both')),
  opinion text check (opinion is null or char_length(opinion) <= 300),
  created_at timestamptz not null default now(),
  constraint court_votes_once unique (case_id, voter_user_id)
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.court_cases(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('approve', 'reject', 'hide', 'restore')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists court_cases_creator_idx on public.court_cases(creator_user_id, created_at desc);
create index if not exists court_cases_moderation_idx on public.court_cases(moderation_status, created_at);
create index if not exists court_votes_case_idx on public.court_votes(case_id);

alter table public.admin_users enable row level security;
alter table public.court_templates enable row level security;
alter table public.court_cases enable row level security;
alter table public.court_votes enable row level security;
alter table public.moderation_actions enable row level security;

create policy "admin_users_read_admin" on public.admin_users for select to authenticated using (public.is_court_admin());
create policy "court_templates_read_active" on public.court_templates for select to anon, authenticated using (is_active or public.is_court_admin());
create policy "court_templates_manage_admin" on public.court_templates for all to authenticated using (public.is_court_admin()) with check (public.is_court_admin());
create policy "court_cases_read" on public.court_cases for select to authenticated using (visibility = 'public' or status in ('voting', 'completed') or creator_user_id = auth.uid() or public.is_court_admin());
create policy "court_cases_create_signed_in" on public.court_cases for insert to authenticated with check (creator_user_id = auth.uid() and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);
create policy "court_cases_update_owner" on public.court_cases for update to authenticated
  using (creator_user_id = auth.uid())
  with check (
    creator_user_id = auth.uid()
    and visibility = 'private'
    and moderation_status in ('private', 'pending_review', 'rejected')
  );
create policy "court_cases_update_admin" on public.court_cases for update to authenticated using (public.is_court_admin()) with check (public.is_court_admin());
create policy "court_votes_read" on public.court_votes for select to authenticated using (voter_user_id = auth.uid() or public.is_court_admin() or exists (select 1 from public.court_cases c where c.id = case_id and (c.status = 'completed' or c.creator_user_id = auth.uid())));
create policy "court_votes_insert" on public.court_votes for insert to authenticated with check (voter_user_id = auth.uid() and exists (select 1 from public.court_cases c where c.id = case_id and c.status = 'voting' and c.closes_at > now()));
create policy "moderation_actions_read_admin" on public.moderation_actions for select to authenticated using (public.is_court_admin());
create policy "moderation_actions_insert_admin" on public.moderation_actions for insert to authenticated with check (public.is_court_admin() and admin_user_id = auth.uid());

grant select on public.admin_users to authenticated;
grant select on public.court_templates to anon;
grant select, insert, update on public.court_templates to authenticated;
grant select, insert, update on public.court_cases to authenticated;
grant select, insert on public.court_votes to authenticated;
grant select, insert on public.moderation_actions to authenticated;
grant execute on function public.is_court_admin() to authenticated;
