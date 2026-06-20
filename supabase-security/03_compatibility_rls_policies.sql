-- TextLinker Supabase setup, chunk 03.
-- Compatibility RLS policies for the current no-login frontend and Android app.
-- For stronger production security later, replace direct table access with Edge Functions/RPCs.

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
