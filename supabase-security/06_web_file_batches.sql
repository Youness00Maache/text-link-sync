-- TextLinker compatibility repair for multi-file web-to-phone batches.
-- Run this whole file in Supabase Dashboard > SQL Editor after file 05.
-- A web_files message may contain several files when their combined size is
-- no more than 25 MB.

create or replace function public.textlinker_validate_message_file_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $f$
declare
  body jsonb;
  kind text;
  total_file_bytes bigint := 0;
begin
  body := new.payload::jsonb;
  kind := body->>'kind';

  -- Manifests contain metadata only. Validate sizes only when file bytes have
  -- actually been uploaded for transfer.
  if kind in ('files', 'web_files') and exists (
    select 1
      from jsonb_array_elements(coalesce(body->'files', '[]'::jsonb)) as file_item
     where coalesce(file_item->>'size_bytes', '') !~ '^[0-9]+$'
        or (file_item->>'size_bytes')::bigint > 26214400
  ) then
    raise exception 'File exceeds TextLinker limits';
  end if;

  if kind = 'web_files' then
    select coalesce(sum((file_item->>'size_bytes')::bigint), 0)
      into total_file_bytes
      from jsonb_array_elements(coalesce(body->'files', '[]'::jsonb)) as file_item;

    if total_file_bytes > 26214400 then
      raise exception 'Combined web file upload exceeds 25 MB TextLinker limit';
    end if;
  end if;

  return new;
end;
$f$;

drop trigger if exists textlinker_02c_message_file_limits on public.transfer_messages;
create trigger textlinker_02c_message_file_limits
before insert on public.transfer_messages
for each row execute function public.textlinker_validate_message_file_limits();
