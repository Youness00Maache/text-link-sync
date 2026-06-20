# Prompt for Android AI Coder: Add Web-to-Phone Transfers

You are updating the TextLinker Android app so it can receive text notes and files sent from the TextLinker website after the phone has scanned a `pc_receive` QR session.

Supabase:
- URL: `https://pfqzsabuvnyqbbcyqkdq.supabase.co`
- Use only the publishable anon key in the app.
- Never use the Supabase service/secret key in Android code.

Existing tables and bucket:
- `transfer_sessions`
- `transfer_messages`
- Storage bucket: `textlinker-transfers`

Keep the existing Android-to-web contract unchanged:
- Android still scans this QR payload:

```json
{
  "type": "textlinker.session.v1",
  "session_id": "<transfer_sessions.id>",
  "pairing_token": "<transfer_sessions.pairing_token>",
  "direction": "pc_receive",
  "expires_at": "<transfer_sessions.expires_at>"
}
```

- Android still sends the phone library manifest with `payload.kind = "library_manifest"`.
- Android still responds to website file requests with `payload.kind = "files"`.

Phone-library items are on demand:
- `library_manifest.files[]` contains metadata only. Include every file in the
  listing even when it is larger than 25 MB. Do not upload file bytes while
  sending the manifest.
- `library_manifest.texts[]` contains `id`, `title`, `preview`, `created_at`,
  and `group_id`. Omit full `content` from new app builds.
- When the website inserts `payload.kind = "text_request"`, find that local
  note by `payload.text_id` and respond with `payload.kind = "texts"`, including
  its full content.
- When the website inserts `payload.kind = "file_request"`, upload and respond
  only if the requested file is at most 25 MB. The website also enforces this
  limit before creating the request.

Every Android insert into `transfer_messages`, including `library_manifest` and
`files`, must include these top-level row fields in addition to `payload`:

```json
{
  "session_id": "<QR session_id>",
  "pairing_token": "<QR pairing_token>",
  "expires_at": "<QR expires_at>",
  "payload": { "version": 1, "kind": "library_manifest" }
}
```

Copy `expires_at` directly from the scanned QR. Do not generate, truncate, or
recalculate it on Android.

New goal:
- After Android scans and connects to the website session, keep listening to Supabase Realtime inserts on `transfer_messages` for the same session.
- The website can now send text notes and files back to the phone.

Validation:
- Only accept rows where:
  - `row.session_id == currentSession.id`
  - `row.pairing_token == currentSession.pairing_token`
  - current time is before `currentSession.expires_at`
- Ignore rows created by Android itself, including:
  - `library_manifest`
  - Android's own `files` responses
- Do not require login.

Listen for new payload kinds:

## 0. Website Item Requests

For `text_request`, read `payload.text_id`, load that note from the local
library, and insert a matching `texts` response containing the full note.

For `file_request`, read `payload.file_id`, load that file from the local
library, verify it is no larger than 25 MB, upload it, and insert a matching
`files` response. Never upload every manifest file automatically.

## 1. Web Texts

Payload shape:

```json
{
  "version": 1,
  "kind": "web_texts",
  "source": "web",
  "texts": [
    {
      "id": "uuid",
      "title": "Text from web",
      "content": "Full text content",
      "created_at": "ISO date"
    }
  ]
}
```

Android behavior:
- Save each text item to the app's local text library.
- Preserve `title`, `content`, and `created_at` when possible.
- If the user is looking at the connected transfer screen, show the new note immediately.
- Show a small success notification such as "Text received from website".
- Do not request text content from the website because full content is included.

## 2. Web Files

One `web_files` payload may contain multiple files. The website keeps the
combined size of the files in that message at or below 25 MB. Download and save
every valid item in `payload.files[]`; do not assume the array has one item.

Payload shape:

```json
{
  "version": 1,
  "kind": "web_files",
  "source": "web",
  "files": [
    {
      "id": "uuid",
      "name": "example.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 123456,
      "bucket": "textlinker-transfers",
      "path": "session-id/web/random-example.pdf",
      "public_url": "https://.../storage/v1/object/public/textlinker-transfers/session-id/web/random-example.pdf",
      "created_at": "ISO date",
      "group_id": null
    }
  ]
}
```

Android behavior:
- For each file, download using `public_url`.
- Do not use a service key.
- Save the file into the app's local file library or downloads area, matching the existing app storage pattern.
- Preserve `name`, `mime_type`, `size_bytes`, and `created_at`.
- Choose a local filename safely if there is a conflict.
- Show download progress if possible.
- After a file finishes, show it in the app library and allow open/share using the existing file-opening behavior.

Realtime:
- Keep the same session listener alive until the QR/session expires or the user disconnects.
- Ignore invalid or expired messages.
- Deduplicate messages by `transfer_messages.id` so polling/realtime reconnects do not save the same text or file twice.

Security:
- Never expose or request the Supabase service key.
- Do not rename fields.
- Do not change QR JSON field names.
- Validate `session_id` and `pairing_token` before saving anything.
- Download files directly from `public_url`.

Nice-to-have:
- If the Android app supports grouped libraries, save web-received files/texts into an "Received from Web" folder/group.
- If download fails, show a retry action.
