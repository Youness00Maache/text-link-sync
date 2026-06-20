-- TextLinker chunk 02a: validate message session/token/expiry/basic payload.
-- Run this whole file. If Supabase shows the RLS popup, click "Run without RLS".

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

  if length(body::text) > 250000 then
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

  if new.expires_at is distinct from session_expires_at then
    raise exception 'Message expiry must match session expiry';
  end if;

  return new;
end;
$f$;

drop trigger if exists textlinker_02a_message_session on public.transfer_messages;
create trigger textlinker_02a_message_session
before insert on public.transfer_messages
for each row execute function public.textlinker_validate_message_session();
