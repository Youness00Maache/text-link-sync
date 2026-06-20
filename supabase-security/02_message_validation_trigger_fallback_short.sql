-- TextLinker Supabase setup, chunk 02 fallback.
-- Use this if 02_message_validation_trigger.sql keeps getting corrupted by
-- Supabase dashboard inserted text.
--
-- This fallback still enforces:
-- - session/token/expiry match
-- - valid payload kind
-- - max JSON size
-- - manifest array limits
-- - text size limits
-- - one web file per message
-- - 25 MB file size
-- - 5 second file_request cooldown
-- - 20 file_requests per session
--
-- It does NOT enforce "one active unresolved file request" in SQL.
-- The website and Android still enforce that part.

create or replace function public.textlinker_validate_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $textlinker_message$
declare
  current_session public.transfer_sessions%rowtype;
  body jsonb;
  kind text;
  groups_count int := 0;
  texts_count int := 0;
  files_count int := 0;
  request_count int := 0;
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

  select * into current_session
    from public.transfer_sessions
   where id = new.session_id;

  if not found then
    raise exception 'Session does not exist';
  end if;

  if current_session.status <> 'open' or current_session.expires_at <= now() then
    raise exception 'Session is not open';
  end if;

  if new.pairing_token <> current_session.pairing_token then
    raise exception 'Pairing token mismatch';
  end if;

  if new.expires_at is distinct from current_session.expires_at then
    raise exception 'Message expiry must match session expiry';
  end if;

  if jsonb_typeof(body->'groups') = 'array' then
    groups_count := jsonb_array_length(body->'groups');
  end if;

  if jsonb_typeof(body->'texts') = 'array' then
    texts_count := jsonb_array_length(body->'texts');
  end if;

  if jsonb_typeof(body->'files') = 'array' then
    files_count := jsonb_array_length(body->'files');
  end if;

  if kind = 'library_manifest' and (groups_count > 200 or texts_count > 500 or files_count > 500) then
    raise exception 'Manifest exceeds TextLinker limits';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(coalesce(body->'texts', '[]'::jsonb)) as text_item
     where length(coalesce(text_item->>'content', '')) > 100000
        or length(coalesce(text_item->>'preview', '')) > 500
  ) then
    raise exception 'Text exceeds TextLinker limits';
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

  if kind = 'file_request' then
    if coalesce(body->>'file_id', '') = '' then
      raise exception 'file_request requires file_id';
    end if;

    select count(*) into request_count
      from public.transfer_messages m
     where m.session_id = new.session_id
       and m.payload::jsonb->>'kind' = 'file_request';

    if request_count >= 20 then
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
$textlinker_message$;

drop trigger if exists textlinker_validate_message_trigger on public.transfer_messages;
create trigger textlinker_validate_message_trigger
before insert on public.transfer_messages
for each row execute function public.textlinker_validate_message();
