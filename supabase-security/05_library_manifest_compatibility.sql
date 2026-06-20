-- TextLinker compatibility repair for Android library manifests.
-- Run this whole file in Supabase Dashboard > SQL Editor after file 04.
-- Manifests contain metadata and full note content, not uploaded file bytes.

create or replace function public.textlinker_validate_message_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $f$
declare
  session_status text;
  session_pairing_token text;
  session_expires_at timestamptz;
  body jsonb;
  kind text;
begin
  body := new.payload::jsonb;
  kind := body->>'kind';

  if body is null or (body->>'version')::int is distinct from 1 then
    raise exception 'Invalid payload version';
  end if;

  if (kind = 'library_manifest' and length(body::text) > 5000000)
     or (kind <> 'library_manifest' and length(body::text) > 250000) then
    raise exception 'Transfer message is too large';
  end if;

  if kind not in ('library_manifest', 'texts', 'files', 'file_request', 'text_request', 'web_texts', 'web_files') then
    raise exception 'Invalid payload kind';
  end if;

  select status, pairing_token, expires_at
    into session_status, session_pairing_token, session_expires_at
    from public.transfer_sessions
   where id = new.session_id;

  if not found then
    raise exception 'Session does not exist';
  end if;

  if session_status <> 'open' or session_expires_at <= now() then
    raise exception 'Session is not open';
  end if;

  if new.pairing_token <> session_pairing_token then
    raise exception 'Pairing token mismatch';
  end if;

  if new.expires_at is null then
    new.expires_at := session_expires_at;
  elsif new.expires_at is distinct from session_expires_at then
    raise exception 'Message expiry must match session expiry';
  end if;

  return new;
end;
$f$;

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

  if kind in ('files', 'web_files') and exists (
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

