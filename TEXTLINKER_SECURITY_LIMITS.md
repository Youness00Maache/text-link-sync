# TextLinker Shared Security Limits

Use these same limits in the website, Android app, and Supabase validation. Do not let each platform invent different numbers.

## Current Shared Limits

| Limit | Value |
| --- | ---: |
| QR/session lifetime | 10 minutes |
| Manifest groups | 200 max |
| Manifest texts | 500 max |
| Manifest files | 500 max |
| Text content | 100,000 characters max |
| Text preview | 500 characters max |
| Files sent from web in one send | 1 max |
| Single transferred file size | 25 MB max |
| Pending phone file requests from web | 1 max |
| File request cooldown | 5 seconds |
| File requests per QR session | 20 max |
| Transfer message JSON size | 250,000 characters max |
| Web large-upload threshold | 6 MB, then use resumable/TUS upload |

## Android App Must Enforce

1. Reject any session or message when:
   - `session_id` does not match the scanned QR session.
   - `pairing_token` does not match the scanned QR session.
   - Current time is after `expires_at`.
   - `payload.version !== 1`.
   - `payload.kind` is unknown.

2. Enforce the exact same limits:
   - Max manifest groups: `200`
   - Max manifest texts: `500`
   - Max manifest files: `500`
   - Max text content: `100000` chars
   - Max text preview: `500` chars
   - Max web files per message: `1`
   - Max file size: `25 * 1024 * 1024` bytes
   - Max pending file requests: `1`
   - File request cooldown: `5000` ms
   - Max file requests per QR session: `20`
   - Max ordinary payload JSON length: `250000`
   - Max library manifest JSON length: `5000000`

3. Never auto-open received files. Save first, then let the user tap Open.

4. Do not trust:
   - file name
   - MIME type
   - file size from JSON
   - public URL
   - group IDs
   - created dates

5. Sanitize file names before saving:
   - remove path separators like `/`, `\`, `..`
   - trim very long names
   - handle duplicate names safely

6. Only download web-sent files when:
   - `bucket === "textlinker-transfers"`
   - `public_url` is HTTPS
   - host is either:
     - `pfqzsabuvnyqbbcyqkdq.supabase.co`
     - `pfqzsabuvnyqbbcyqkdq.storage.supabase.co`
   - path is inside the current session folder.

7. For file requests from the website:
   - allow at most 1 active/pending file upload at once.
   - require at least 5 seconds between accepted file requests.
   - allow at most 20 file requests during one QR session.
   - each requested file must be <= 25 MB. A manifest may list larger phone files, but the website will not request them.
   - if a request is duplicated, ignore the duplicate.

8. Deduplicate received rows by `transfer_messages.id`.

9. Fail safely:
   - malformed JSON should not crash the app.
   - invalid arrays should be treated as empty or rejected.
   - failed file downloads/uploads should show retry, not crash.

## Supabase Must Enforce

Frontend and Android checks are not enough because users can call Supabase directly with the publishable key. Supabase should enforce:

1. RLS on `transfer_sessions`.
2. RLS on `transfer_messages`.
3. Storage policies on `storage.objects`.
4. Max upload size of 25 MB for `textlinker-transfers`.
5. Cleanup of expired sessions/messages/files.
6. Insert validation triggers for session lifetime, payload kind, payload size, array sizes, text size, and file size.
7. Rate-limit `file_request` messages: 1 active request, 5 second cooldown, 20 requests per QR session.

## Important Supabase Plan Note

Set the Supabase bucket limit to 25 MB. This is intentionally conservative for now and should work on ordinary Supabase projects without needing a large-file storage plan.
