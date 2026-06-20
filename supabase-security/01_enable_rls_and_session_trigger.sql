-- TextLinker Supabase setup, chunk 01.
-- Paste and run this entire file in Supabase SQL Editor.
-- Do not click dashboard "add SQL" suggestions while this is open.

alter table public.transfer_sessions enable row level security;
alter table public.transfer_messages enable row level security;

create or replace function public.textlinker_validate_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $textlinker$
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
$textlinker$;

drop trigger if exists textlinker_validate_session_trigger on public.transfer_sessions;
create trigger textlinker_validate_session_trigger
before insert or update on public.transfer_sessions
for each row execute function public.textlinker_validate_session();
