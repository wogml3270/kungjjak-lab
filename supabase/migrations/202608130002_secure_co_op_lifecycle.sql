-- Close an active Co-op room when either participant explicitly leaves.
create or replace function public.leave_co_op_room(target_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.participants p
    where p.room_id = target_room_id and p.user_id = auth.uid()
  ) then
    raise exception 'Room membership required';
  end if;

  delete from public.rooms
  where id = target_room_id
    and mode = 'co_op'
    and status in ('created', 'waiting_for_guest', 'ready', 'in_progress', 'calculating');
end;
$$;

revoke all on function public.leave_co_op_room(uuid) from public;
grant execute on function public.leave_co_op_room(uuid) to authenticated;

-- Only the host can start, and only while both participant rows still exist.
create or replace function public.start_co_op_room(target_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  started_room public.rooms;
begin
  select * into started_room from public.rooms
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

  update public.rooms set status = 'in_progress', current_question = 1
  where id = target_room_id returning * into started_room;
  return started_room;
end;
$$;

revoke all on function public.start_co_op_room(uuid) from public;
grant execute on function public.start_co_op_room(uuid) to authenticated;
