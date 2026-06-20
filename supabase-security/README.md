# TextLinker Supabase Security SQL

Run these files in Supabase Dashboard > SQL Editor in this exact order:

1. `01_enable_rls_and_session_trigger.sql`
2. `02_cleanup_old_message_trigger.sql`
3. `02a_message_session_validation.sql`
4. `02b_message_text_manifest_limits.sql`
5. `02c_message_file_limits.sql`
6. `02d_message_request_rate_limits.sql`
7. `03_compatibility_rls_policies.sql`
8. `04_android_message_expiry_compatibility.sql`

Avoid the older long `02_message_validation_trigger*.sql` files if Supabase keeps cutting or corrupting them. The `02a` through `02d` files are intentionally tiny.

If the Supabase popup says "Potential issue detected" and gives buttons:

- `Cancel`
- `Run without RLS`
- `Run and enable RLS`

click `Run without RLS`. Do not click the green `Run and enable RLS` button.
File `01` already enabled RLS on the real tables.

If you get `unterminated dollar-quoted string`, it means Supabase did not run the whole function. Use the smaller `02a` through `02d` files instead.

Important:

- Paste one whole file at a time.
- Press `Ctrl + A` in the SQL editor before clicking Run, or make sure no partial text is selected.
- Do not click Supabase dashboard suggestions such as "enable RLS" while a function is open in the editor.
- If Supabase inserts text like `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, delete it before running. Files `01` and `03` already enable RLS on the real tables.

Storage step:

- Go to Storage > Buckets > `textlinker-transfers`.
- Set max file size to `25 MB`.

Current shared anti-spam limits:

- One active file request at a time.
- Five seconds between file requests.
- Twenty file requests per QR session.
- One web-sent file per message.
- Maximum file size is 25 MB.
