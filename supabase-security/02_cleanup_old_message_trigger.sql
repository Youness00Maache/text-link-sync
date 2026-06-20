-- TextLinker chunk 02 cleanup.
-- Run this before 02a/02b/02c/02d if previous attempts partially created objects.

drop trigger if exists textlinker_validate_message_trigger on public.transfer_messages;
drop function if exists public.textlinker_validate_message();
