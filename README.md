# TextLinker Web

TextLinker connects the Android app to a browser through short-lived Supabase QR sessions. The website can browse transferred notes and file metadata, request individual files, and send a note or one file back to the connected phone.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3002`.

## Main routes

- `/` - TextLinker landing page
- `/receive` - QR receiver and transfer interface
- `/how-it-works` - Transfer flow documentation
- `/features` - Product features
- `/privacy` - Privacy policy

The frontend uses the public Supabase publishable key only. Never add a service-role key or other backend secret to browser code.

