-- TextLinker chunk 02c: validate file count and file size.
-- Run this whole file. If Supabase shows the RLS popup, click "Run without RLS".

create or replace function public.textlinker_validate_message_file_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $f$
declare
  body jsonb;
  kind text;
  files_count int := 0;
begin
  body := new.payload::jsonb;
  kind := body->>'kind';

  if jsonb_typeof(body->'files') = 'array' then
    files_count := jsonb_array_length(body->'files');
  end if;

  if kind = 'web_files' and files_count > 1 then
    raise exception 'Only one file can be sent in one web_files message';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(coalesce(body->'files', '[]'::jsonb)) as file_item
     where coalesce(file_item->>'size_bytes', '') !~ '^[0-9]+$'
        or (file_item->>'size_bytes')::bigint > 26214400
  ) then
    raise exception 'File exceeds TextLinker limits';
  end if;

  return new;
end;
$f$;

drop trigger if exists textlinker_02c_message_file_limits on public.transfer_messages;
create trigger textlinker_02c_message_file_limits
before insert on public.transfer_messages
for each row execute function public.textlinker_validate_message_file_limits();
