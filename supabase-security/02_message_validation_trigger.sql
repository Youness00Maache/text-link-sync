-- TextLinker Supabase setup, chunk 02.
-- Paste and run this entire file in Supabase SQL Editor.
-- This file must start at "create or replace function" and end at the trigger creation.

create or replace function public.textlinker_validate_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $textlinker$
declare
  current_transfer_session public.transfer_sessions%rowtype;
  body jsonb;
  kind text;
  groups_count int;
  texts_count int;
  files_count int;
  item jsonb;
  size_bytes bigint;
  file_request_count int;
begin
  body := new.payload::jsonb;
  kind := body->>'kind';

  if body is null or (body->>'version')::int is distinct from 1 then
    raise exception 'Invalid payload version';
  end if;

  if length(body::text) > 250000 then
    raise exception 'Transfer message is too large';
  end if;

  if kind not in ('library_manifest', 'texts', 'files', 'file_request', 'text_request', 'web_texts', 'web_files') then
    raise exception 'Invalid payload kind';
  end if;

  select *
    into current_transfer_session
    from public.transfer_sessions
   where id = new.session_id;

  if not found then
    raise exception 'Session does not exist';
  end if;

  if current_transfer_session.status <> 'open' or current_transfer_session.expires_at <= now() then
    raise exception 'Session is not open';
  end if;

  if new.pairing_token <> current_transfer_session.pairing_token then
    raise exception 'Pairing token mismatch';
  end if;

  if new.expires_at is distinct from current_transfer_session.expires_at then
    raise exception 'Message expiry must match session expiry';
  end if;

  groups_count := case when jsonb_typeof(body->'groups') = 'array' then jsonb_array_length(body->'groups') else 0 end;
  texts_count := case when jsonb_typeof(body->'texts') = 'array' then jsonb_array_length(body->'texts') else 0 end;
  files_count := case when jsonb_typeof(body->'files') = 'array' then jsonb_array_length(body->'files') else 0 end;

  if kind = 'library_manifest' then
    if groups_count > 200 or texts_count > 500 or files_count > 500 then
      raise exception 'Manifest exceeds TextLinker limits';
    end if;
  end if;

  if kind in ('texts', 'web_texts', 'library_manifest') and jsonb_typeof(body->'texts') = 'array' then
    for item in select * from jsonb_array_elements(body->'texts')
    loop
      if length(coalesce(item->>'content', '')) > 100000 then
        raise exception 'Text content exceeds TextLinker limit';
      end if;

      if length(coalesce(item->>'preview', '')) > 500 then
        raise exception 'Text preview exceeds TextLinker limit';
      end if;
    end loop;
  end if;

  if kind = 'web_files' and files_count > 1 then
    raise exception 'Only one file can be sent in one web_files message';
  end if;

  if kind in ('files', 'web_files', 'library_manifest') and jsonb_typeof(body->'files') = 'array' then
    for item in select * from jsonb_array_elements(body->'files')
    loop
      if coalesce(item->>'size_bytes', '') !~ '^[0-9]+$' then
        raise exception 'Invalid file size';
      end if;

      size_bytes := (item->>'size_bytes')::bigint;
      if size_bytes > 26214400 then
        raise exception 'File exceeds 25 MB TextLinker limit';
      end if;
    end loop;
  end if;

  if kind = 'file_request' and coalesce(body->>'file_id', '') = '' then
    raise exception 'file_request requires file_id';
  end if;

  if kind = 'file_request' then
    if exists (
      select 1
        from public.transfer_messages request_row
       where request_row.session_id = new.session_id
         and request_row.payload::jsonb->>'kind' = 'file_request'
         and not exists (
           select 1
             from public.transfer_messages response_row
            where response_row.session_id = request_row.session_id
              and response_row.payload::jsonb->>'kind' = 'files'
              and response_row.payload::jsonb->'files' @> jsonb_build_array(
                jsonb_build_object('id', request_row.payload::jsonb->>'file_id')
              )
         )
    ) then
      raise exception 'A file request is already active for this session';
    end if;

    select count(*)
      into file_request_count
      from public.transfer_messages m
     where m.session_id = new.session_id
       and m.payload::jsonb->>'kind' = 'file_request';

    if file_request_count >= 20 then
      raise exception 'File request limit reached for this session';
    end if;

    if exists (
      select 1
        from public.transfer_messages m
       where m.session_id = new.session_id
         and m.payload::jsonb->>'kind' = 'file_request'
         and m.created_at > now() - interval '5 seconds'
    ) then
      raise exception 'File requests are rate limited';
    end if;
  end if;

  if kind = 'text_request' and coalesce(body->>'text_id', '') = '' then
    raise exception 'text_request requires text_id';
  end if;

  return new;
end;
$textlinker$;

drop trigger if exists textlinker_validate_message_trigger on public.transfer_messages;
create trigger textlinker_validate_message_trigger
before insert on public.transfer_messages
for each row execute function public.textlinker_validate_message();
