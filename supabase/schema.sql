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
  current_question integer not null default 1 check (current_question between 1 and 24),
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
  history_visible boolean not null default true,
  display_name text,
  avatar_url text,
  joined_at timestamptz not null default now(),
  ready_at timestamptz,
  constraint participants_room_user_unique unique (room_id, user_id),
  constraint participants_room_role_unique unique (room_id, role),
  constraint participants_display_name_length check (display_name is null or char_length(display_name) between 1 and 10)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  position smallint not null check (position between 1 and 52),
  dimension public.mbti_dimension not null,
  title text not null,
  positive_trait char(1) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint questions_position_unique unique (position),
  constraint questions_positive_trait_valid check (positive_trait in ('E','I','S','N','T','F','J','P')),
  constraint questions_trait_matches_dimension check (
    (dimension = 'EI' and positive_trait in ('E', 'I'))
    or (dimension = 'SN' and positive_trait in ('S', 'N'))
    or (dimension = 'TF' and positive_trait in ('T', 'F'))
    or (dimension = 'JP' and positive_trait in ('J', 'P'))
  )
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  score_value smallint not null check (score_value between -2 and 2),
  submitted_at timestamptz not null default now(),
  constraint responses_once_per_question unique (room_id, participant_id, question_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  difference_sum smallint not null check (difference_sum between 0 and 96),
  score numeric(5,2) generated always as
    (round((1 - difference_sum::numeric / 96::numeric) * 100, 2)) stored,
  summary text not null,
  guide jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.solo_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mbti char(4) not null check (mbti ~ '^[EI][SN][TF][JP]$'),
  confidence smallint not null check (confidence between 0 and 100),
  axis_scores jsonb not null,
  answers jsonb not null,
  completed_at timestamptz not null default now()
);

create index if not exists participants_user_id_idx on public.participants(user_id);
create index if not exists responses_room_question_idx on public.responses(room_id, question_id);
create index if not exists rooms_expires_at_idx on public.rooms(expires_at);
create index if not exists solo_results_user_completed_idx on public.solo_results(user_id, completed_at desc);

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

-- Persist an answer and advance the room in one transaction. Realtime is notification-only;
-- losing a websocket event can never leave two completed participants stuck on a question.
create or replace function public.submit_co_op_response(
  target_room_id uuid,
  target_participant_id uuid,
  target_question_id uuid,
  target_question_number integer,
  target_score_value smallint
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  locked_room public.rooms;
  result_room public.rooms;
  response_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into locked_room
  from public.rooms
  where id = target_room_id
    and mode = 'co_op'
    and status = 'in_progress'
  for update;

  if locked_room.id is null then
    raise exception 'Room not found or not in progress';
  end if;

  if locked_room.current_question <> target_question_number then
    raise exception 'Question has already advanced';
  end if;

  if target_score_value < -2 or target_score_value > 2 then
    raise exception 'Invalid score';
  end if;

  if not exists (
    select 1 from public.participants p
    where p.id = target_participant_id
      and p.room_id = target_room_id
      and p.user_id = auth.uid()
  ) then
    raise exception 'Participant mismatch';
  end if;

  if not exists (select 1 from public.questions q where q.id = target_question_id and q.is_active) then
    raise exception 'Question not found';
  end if;

  insert into public.responses (room_id, participant_id, question_id, score_value)
  values (target_room_id, target_participant_id, target_question_id, target_score_value)
  on conflict (room_id, participant_id, question_id)
  do update set score_value = excluded.score_value, submitted_at = now();

  select count(*) into response_count
  from public.responses r
  where r.room_id = target_room_id and r.question_id = target_question_id;

  if response_count >= 2 then
    update public.rooms
    set current_question = case when target_question_number < 24 then target_question_number + 1 else current_question end,
        status = case when target_question_number >= 24 then 'completed'::public.room_status else status end
    where id = target_room_id
    returning * into result_room;

    if target_question_number >= 24 then
      insert into public.reports (room_id, difference_sum, summary)
      select target_room_id,
        sum(abs(pair.min_score - pair.max_score))::smallint,
        '24문항 쿵짝 실험 완료'
      from (
        select r.question_id, min(r.score_value) as min_score, max(r.score_value) as max_score
        from public.responses r where r.room_id = target_room_id
        group by r.question_id having count(*) = 2
      ) pair
      on conflict (room_id) do update set difference_sum = excluded.difference_sum, summary = excluded.summary;
    end if;
  else
    result_room := locked_room;
  end if;

  return result_room;
end;
$$;

revoke all on function public.submit_co_op_response(uuid, uuid, uuid, integer, smallint) from public;
grant execute on function public.submit_co_op_response(uuid, uuid, uuid, integer, smallint) to authenticated;

create or replace function public.get_co_op_question_status(
  target_room_id uuid,
  target_question_id uuid
)
returns table (own_completed boolean, partner_completed boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.responses r
      join public.participants p on p.id = r.participant_id
      where r.room_id = target_room_id and r.question_id = target_question_id and p.user_id = auth.uid()
    ),
    exists (
      select 1 from public.responses r
      join public.participants p on p.id = r.participant_id
      where r.room_id = target_room_id and r.question_id = target_question_id and p.user_id <> auth.uid()
    )
  where public.is_room_member(target_room_id);
$$;

revoke all on function public.get_co_op_question_status(uuid, uuid) from public;
grant execute on function public.get_co_op_question_status(uuid, uuid) to authenticated;

alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.reports enable row level security;
alter table public.solo_results enable row level security;

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
  and exists (select 1 from public.questions q where q.id = question_id and q.is_active)
);

-- Own answer is recoverable. A partner's score becomes readable only after both submit.
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

create policy "solo_results_read_own"
on public.solo_results for select to authenticated
using (user_id = auth.uid() and (auth.jwt()->>'is_anonymous')::boolean is false);

create policy "solo_results_insert_own"
on public.solo_results for insert to authenticated
with check (user_id = auth.uid() and (auth.jwt()->>'is_anonymous')::boolean is false);

create policy "solo_results_delete_own"
on public.solo_results for delete to authenticated
using (user_id = auth.uid() and (auth.jwt()->>'is_anonymous')::boolean is false);

-- Table grants are still constrained by the RLS policies above.
grant select, insert, update on public.rooms to authenticated;
grant select, insert, update on public.participants to authenticated;
grant select on public.questions to authenticated;
grant select, insert on public.responses to authenticated;
grant select on public.reports to authenticated;
grant select, insert, delete on public.solo_results to authenticated;

-- Only the host can start a Co-op room after exactly two participants join.
create or replace function public.start_co_op_room(target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  started_room public.rooms;
begin
  select * into started_room
  from public.rooms
  where id = target_room_id and mode = 'co_op'
  for update;

  if started_room.id is null or started_room.host_user_id <> auth.uid() then
    raise exception 'Only the host can start this room';
  end if;

  if started_room.status <> 'ready' or (
    select count(*) from public.participants p where p.room_id = target_room_id
  ) <> 2 then
    raise exception 'Two active participants are required';
  end if;

  update public.rooms
  set status = 'in_progress', current_question = 1
  where id = target_room_id
  returning * into started_room;

  return started_room;
end;
$$;

revoke all on function public.start_co_op_room(uuid) from public;
grant execute on function public.start_co_op_room(uuid) to authenticated;

-- Realtime payloads must never include score_value before both submissions. The app broadcasts
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
