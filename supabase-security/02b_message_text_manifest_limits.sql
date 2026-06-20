-- TextLinker chunk 02b: validate manifest counts and text sizes.
-- Run this whole file. If Supabase shows the RLS popup, click "Run without RLS".

create or replace function public.textlinker_validate_message_text_manifest_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $f$
declare
  body jsonb;
  kind text;
  groups_count int := 0;
  texts_count int := 0;
  files_count int := 0;
begin
  body := new.payload::jsonb;
  kind := body->>'kind';

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

  return new;
end;
$f$;

drop trigger if exists textlinker_02b_message_text_manifest_limits on public.transfer_messages;
create trigger textlinker_02b_message_text_manifest_limits
before insert on public.transfer_messages
for each row execute function public.textlinker_validate_message_text_manifest_limits();
