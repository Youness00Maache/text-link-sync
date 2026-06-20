-- TextLinker Supabase security starter.
-- Prefer the smaller files in ./supabase-security/ if Supabase SQL Editor gives
-- dollar-quote or partial-selection errors.
-- Run this in Supabase Dashboard > SQL Editor after backing up your project.
-- Important: run the whole script, or at least a whole function block from
-- "create or replace function ..." through the closing "$$;".
-- If only a highlighted line like "raise exception ..." is selected, Supabase
-- will run only that fragment and show a syntax error near "raise".
-- Review table/column names first. This assumes:
--   public.transfer_sessions(id, direction, status, pairing_token, expires_at, created_at)
--   public.transfer_messages(id, session_id, pairing_token, expires_at, payload, created_at)
--   payload is json/jsonb

begin;

alter table public.transfer_sessions enable row level security;
alter table public.transfer_messages enable row level security;

create or replace function public.textlinker_validate_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.direction <> 'pc_receive' then
    raise exception 'Invalid TextLinker session direction';
  end if;

  if new.status not in ('open', 'completed', 'expired') then
    raise exception 'Invalid TextLinker session status';
  end if;

  if new.pairing_token is null or length(new.pairing_token) < 24 then
    raise exception 'Pairing token is too short';
  end if;

  if new.expires_at is null then
    raise exception 'expires_at is required';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'open' then
      raise exception 'New sessions must start open';
    end if;

    if new.expires_at <= now() or new.expires_at > now() + interval '11 minutes' then
      raise exception 'Session expiry must be about 10 minutes in the future';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists textlinker_validate_session_trigger on public.transfer_sessions;
create trigger textlinker_validate_session_trigger
before insert or update on public.transfer_sessions
for each row execute function public.textlinker_validate_session();

create or replace function public.textlinker_validate_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.transfer_sessions%rowtype;
  body jsonb;
  kind text;
  groups_count int;
  texts_count int;
  files_count int;
  item jsonb;
  size_bytes bigint;
  total_file_bytes bigint := 0;
  file_request_count int;
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

  select *
    into session_row
    from public.transfer_sessions
   where id = new.session_id;

  if not found then
    raise exception 'Session does not exist';
  end if;

  if session_row.status <> 'open' or session_row.expires_at <= now() then
    raise exception 'Session is not open';
  end if;

  if new.pairing_token <> session_row.pairing_token then
    raise exception 'Pairing token mismatch';
  end if;

  if new.expires_at is null then
    new.expires_at := session_row.expires_at;
  elsif new.expires_at is distinct from session_row.expires_at then
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

  if kind in ('files', 'web_files') and jsonb_typeof(body->'files') = 'array' then
    for item in select * from jsonb_array_elements(body->'files')
    loop
      if coalesce(item->>'size_bytes', '') !~ '^[0-9]+$' then
        raise exception 'Invalid file size';
      end if;

      size_bytes := (item->>'size_bytes')::bigint;
      if size_bytes > 26214400 then
        raise exception 'File exceeds 25 MB TextLinker limit';
      end if;

      if kind = 'web_files' then
        total_file_bytes := total_file_bytes + size_bytes;
      end if;
    end loop;

    if kind = 'web_files' and total_file_bytes > 26214400 then
      raise exception 'Combined web file upload exceeds 25 MB TextLinker limit';
    end if;
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
$$;

drop trigger if exists textlinker_validate_message_trigger on public.transfer_messages;
create trigger textlinker_validate_message_trigger
before insert on public.transfer_messages
for each row execute function public.textlinker_validate_message();

-- Compatibility RLS policies for the current no-login frontend.
-- These keep the current app working, but for stronger production security,
-- replace direct table access with Edge Functions/RPCs that require session_id + pairing_token.

drop policy if exists "TextLinker anon can create sessions" on public.transfer_sessions;
create policy "TextLinker anon can create sessions"
on public.transfer_sessions
for insert
to anon
with check (
  direction = 'pc_receive'
  and status = 'open'
  and pairing_token is not null
  and length(pairing_token) >= 24
);

drop policy if exists "TextLinker anon can read open sessions" on public.transfer_sessions;
create policy "TextLinker anon can read open sessions"
on public.transfer_sessions
for select
to anon
using (expires_at > now());

drop policy if exists "TextLinker anon can close open sessions" on public.transfer_sessions;
create policy "TextLinker anon can close open sessions"
on public.transfer_sessions
for update
to anon
using (expires_at > now() and status = 'open')
with check (status in ('completed', 'expired'));

drop policy if exists "TextLinker anon can insert valid messages" on public.transfer_messages;
create policy "TextLinker anon can insert valid messages"
on public.transfer_messages
for insert
to anon
with check (
  exists (
    select 1
      from public.transfer_sessions s
     where s.id = session_id
       and s.pairing_token = pairing_token
       and s.expires_at = expires_at
       and s.status = 'open'
       and s.expires_at > now()
  )
);

drop policy if exists "TextLinker anon can read unexpired messages" on public.transfer_messages;
create policy "TextLinker anon can read unexpired messages"
on public.transfer_messages
for select
to anon
using (expires_at > now());

grant usage on schema public to anon;
grant select, insert, update on public.transfer_sessions to anon;
grant select, insert on public.transfer_messages to anon;

commit;

-- Storage bucket steps still need to be done in Dashboard:
-- 1. Storage > Buckets > textlinker-transfers
-- 2. Set max file size to 25 MB.
-- 3. If possible, make the bucket private and move to signed URLs/Edge Functions.
-- 4. If keeping public URLs for the current Android contract, add cleanup for old files.
