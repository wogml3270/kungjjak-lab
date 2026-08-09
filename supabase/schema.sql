-- KungJjak Lab Phase 1 schema
-- Authentication model: Supabase Anonymous Auth. Every client receives auth.uid().

create extension if not exists pgcrypto;

do $$ begin
  create type public.room_mode as enum ('solo', 'co_op');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.room_status as enum (
    'created',
    'waiting_for_guest',
    'ready',
    'in_progress',
    'calculating',
    'completed',
    'expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.participant_role as enum ('host', 'guest');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.mbti_dimension as enum ('EI', 'SN', 'TF', 'JP');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.choice_label as enum ('A', 'B');
exception when duplicate_object then null;
end $$;

create or replace function public.generate_room_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    floor(random() * 32)::integer + 1, 1), '')
  from generate_series(1, 4);
$$;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null default public.generate_room_code(),
  mode public.room_mode not null,
  status public.room_status not null default 'created',
  host_user_id uuid not null references auth.users(id) on delete cascade,
  current_question integer not null default 1 check (current_question between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  constraint rooms_code_format check (code ~ '^[A-Z2-9]{4}$'),
  constraint rooms_code_unique unique (code)
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.participant_role not null,
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  ready_at timestamptz,
  constraint participants_room_user_unique unique (room_id, user_id),
  constraint participants_room_role_unique unique (room_id, role)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  mode public.room_mode not null,
  position smallint not null check (position between 1 and 12),
  dimension public.mbti_dimension not null,
  prompt text not null,
  option_a text not null,
  option_a_trait char(1) not null,
  option_b text not null,
  option_b_trait char(1) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint questions_mode_position_unique unique (mode, position),
  constraint questions_a_trait_valid check (option_a_trait in ('E','I','S','N','T','F','J','P')),
  constraint questions_b_trait_valid check (option_b_trait in ('E','I','S','N','T','F','J','P'))
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  choice public.choice_label not null,
  submitted_at timestamptz not null default now(),
  constraint responses_once_per_question unique (room_id, participant_id, question_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  match_count smallint not null check (match_count between 0 and 12),
  score numeric(5,2) generated always as
    (round((match_count::numeric / 12::numeric) * 100, 2)) stored,
  summary text not null,
  guide jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists participants_user_id_idx on public.participants(user_id);
create index if not exists responses_room_question_idx on public.responses(room_id, question_id);
create index if not exists rooms_expires_at_idx on public.rooms(expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

-- SECURITY DEFINER helpers prevent recursive RLS evaluation. They expose booleans only.
create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.participants p
    where p.room_id = target_room_id
      and p.user_id = auth.uid()
  );
$$;

create or replace function public.is_question_complete(
  target_room_id uuid,
  target_question_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) = case
    when (select mode from public.rooms where id = target_room_id) = 'solo' then 1
    else 2
  end
  from public.responses r
  where r.room_id = target_room_id
    and r.question_id = target_question_id;
$$;

revoke all on function public.is_room_member(uuid) from public;
revoke all on function public.is_question_complete(uuid, uuid) from public;
grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.is_question_complete(uuid, uuid) to authenticated;

-- Guests join by room code without receiving access to unrelated rooms.
create or replace function public.join_room(room_code text)
returns public.participants
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_room public.rooms;
  joined_participant public.participants;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into target_room
  from public.rooms
  where code = upper(room_code)
    and mode = 'co_op'
    and status in ('created', 'waiting_for_guest')
    and expires_at > now()
  for update;

  if target_room.id is null then
    raise exception 'Room not found or unavailable';
  end if;

  insert into public.participants (room_id, user_id, role)
  values (target_room.id, auth.uid(), 'guest')
  on conflict (room_id, user_id) do update set user_id = excluded.user_id
  returning * into joined_participant;

  update public.rooms
  set status = 'ready'
  where id = target_room.id;

  return joined_participant;
end;
$$;

revoke all on function public.join_room(text) from public;
grant execute on function public.join_room(text) to authenticated;

alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.reports enable row level security;

-- Rooms: creators can create; only members can read/update their room.
create policy "rooms_insert_as_host"
on public.rooms for insert to authenticated
with check (host_user_id = auth.uid());

create policy "rooms_select_for_members"
on public.rooms for select to authenticated
using (public.is_room_member(id) or host_user_id = auth.uid());

create policy "rooms_update_by_host"
on public.rooms for update to authenticated
using (host_user_id = auth.uid())
with check (host_user_id = auth.uid());

-- Participants: host registers itself; guests use join_room(code).
create policy "participants_select_for_members"
on public.participants for select to authenticated
using (public.is_room_member(room_id) or user_id = auth.uid());

create policy "participants_host_insert"
on public.participants for insert to authenticated
with check (
  user_id = auth.uid()
  and role = 'host'
  and exists (
    select 1 from public.rooms r
    where r.id = room_id and r.host_user_id = auth.uid()
  )
);

create policy "participants_update_self"
on public.participants for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Questions contain no private user data.
create policy "questions_read_active"
on public.questions for select to authenticated
using (is_active);

-- A participant can submit only their own response in their room.
create policy "responses_insert_own"
on public.responses for insert to authenticated
with check (
  public.is_room_member(room_id)
  and exists (
    select 1 from public.participants p
    where p.id = participant_id
      and p.room_id = responses.room_id
      and p.user_id = auth.uid()
  )
  and exists (
    select 1 from public.rooms r
    join public.questions q on q.id = question_id
    where r.id = room_id and r.mode = q.mode
  )
);

-- Own answer is recoverable. A partner's choice becomes readable only after both submit.
create policy "responses_read_after_reveal"
on public.responses for select to authenticated
using (
  public.is_room_member(room_id)
  and (
    exists (
      select 1 from public.participants p
      where p.id = participant_id and p.user_id = auth.uid()
    )
    or public.is_question_complete(room_id, question_id)
  )
);

create policy "reports_read_for_members"
on public.reports for select to authenticated
using (public.is_room_member(room_id));

-- Table grants are still constrained by the RLS policies above.
grant select, insert, update on public.rooms to authenticated;
grant select, insert, update on public.participants to authenticated;
grant select on public.questions to authenticated;
grant select, insert on public.responses to authenticated;
grant select on public.reports to authenticated;

-- Realtime payloads must never include A/B before both submissions. The app broadcasts
-- only { roomId, questionId, participantId, completed: true } on private room channels.
alter table public.rooms replica identity full;
alter table public.participants replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.participants;
exception when duplicate_object then null;
end $$;
