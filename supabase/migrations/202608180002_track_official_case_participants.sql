create or replace function public.sync_court_template_play_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.template_id is not null then
    update public.court_templates
    set play_count = play_count + 1
    where id = new.template_id;
  elsif tg_op = 'DELETE' and old.template_id is not null then
    update public.court_templates
    set play_count = greatest(play_count - 1, 0)
    where id = old.template_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists court_verdicts_sync_template_play_count
on public.court_verdicts;

create trigger court_verdicts_sync_template_play_count
after insert or delete on public.court_verdicts
for each row execute function public.sync_court_template_play_count();

update public.court_templates template
set play_count = (
  select count(*)::integer
  from public.court_verdicts verdict
  where verdict.template_id = template.id
);

