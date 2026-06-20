-- TextLinker chunk 02d: validate file/text request payloads and rate-limit file_request.
-- Run this whole file. If Supabase shows the RLS popup, click "Run without RLS".

create or replace function public.textlinker_validate_message_request_rate_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $f$
declare
  body jsonb;
  kind text;
  request_count int := 0;
begin
  body := new.payload::jsonb;
  kind := body->>'kind';

  if kind = 'file_request' then
    if coalesce(body->>'file_id', '') = '' then
      raise exception 'file_request requires file_id';
    end if;

    select count(*)
      into request_count
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
$f$;

drop trigger if exists textlinker_02d_message_request_rate_limits on public.transfer_messages;
create trigger textlinker_02d_message_request_rate_limits
before insert on public.transfer_messages
for each row execute function public.textlinker_validate_message_request_rate_limits();
