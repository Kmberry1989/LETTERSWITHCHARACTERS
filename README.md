# Letters with Characters

Multiplayer word game built with Next.js 15, Firebase Authentication, Cloud Firestore, and optional Genkit-powered hints.

## Firebase project

The production project is `studio-1704097120-f2816`. Email/password, Google, and anonymous authentication are enabled. Firestore is in `us-central1`.

The browser uses Firebase Auth, then exchanges its ID token for a secure, HTTP-only `lwc_session` cookie. Persistent reads and writes continue through the existing Next.js API routes. Those routes use the Admin SDK and retain participant checks, protected profile fields, server-owned game creation, and the idempotent economy ledger.

Direct browser access to Firestore is denied by `firestore.rules`. Deploy rules with:

```bash
npm run firebase:deploy:rules
```

## Credential-free local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Start Firebase with `npm run firebase:emulators`.
4. In another terminal, start the app with `npm run dev`.

Open `http://127.0.0.1:9002`. The emulator run starts with empty accounts and economy state. The separate `/demo/bot` route remains available without Firebase, Gemini, or persistent storage.

## Production credentials

- Firebase App Hosting and Google Cloud runtimes should use Application Default Credentials.
- Other hosts may set `FIREBASE_SERVICE_ACCOUNT_JSON` to a base64-encoded service-account JSON value.
- Never commit a service-account file or secret.

The checked-in Firebase web configuration is public client configuration, not an Admin credential.

## App flow

- Sign in from `/` with a username/password, Google, or guest account.
- Open `/lobby`.
- Create a challenge as player A.
- Sign in as player B in another browser/session and accept it.
- Both players receive the same game on `/dashboard`.
- Play, pass, exchange tiles, and chat through the authenticated API.

All pre-migration PostgreSQL/Supabase users, balances, rewards, sessions, and history are intentionally outside this clean Firebase cutover.

## Verification

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

`npm run test:all` runs lint, typecheck, unit tests, and the production build.

## Notifications

Email alerts require `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Web push requires `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`.

AI hints remain optional. Without Gemini credentials the app boots normally, and the local bot demo remains fully playable.
