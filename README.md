# Letters with Characters

Human-only multiplayer word game built with Next.js 15, PostgreSQL, Prisma, local session auth, and optional Genkit-powered hints.

## Requirements

- Node.js 22+
- npm
- PostgreSQL database URL
- Optional: Google AI / Genkit credentials if you want hints and AI word validation to work

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure your environment:

```bash
cp .env.example .env.local
```

Set `DATABASE_URL` to your PostgreSQL connection string.

3. Generate Prisma client and create/update database tables:

```bash
npm run db:generate
npm run db:push
```

4. Start the app:

```bash
npm run dev
```

5. Optional: start Genkit tooling for AI development:

```bash
npm run genkit:dev
```

## App flow

- Sign in from `/`
- Open `/lobby`
- Create an open challenge as player A
- Sign in as player B in another browser/session
- Accept the open challenge
- Both players should see the new game on `/dashboard`
- Open the game and take turns playing, passing, exchanging, and chatting

## Verification

```bash
npm run typecheck
npm run build
npm run test
npm run test:e2e
```

`npm run test:all` runs lint, typecheck, unit tests, and the production build in one release check.

## Notifications

Turn notifications now support email and browser web push.

Required environment variables for email:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Required environment variables for web push:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Notes:

- Email turn alerts default to on for existing and new users.
- Web push defaults to off until the user enables it from `/profile` and grants browser notification permission.
- Supported events:
  - turn ready
  - challenge accepted
  - game finished
  - in-game chat message

Manual smoke test:

- user A can create one open challenge
- user B can see and accept it
- self-accept is blocked
- re-accept after acceptance is blocked
- both players get the same game id added to their user documents
- gameplay APIs return 401 when called without auth

## Data model

The first Firebase-free pass uses a generic Prisma-backed document table so the existing game data shape can keep working while the app migrates toward purpose-built relational tables.

Primary document collections currently stored in Postgres:

- `users`
- `games`
- `lobbyMessages`
- `lobbyChallenges`

## Notes

- Firebase dependencies have been removed from `package.json`.
- The application session adapter in `src/lib/server/auth.ts` is the canonical server auth boundary. Username/password and guest accounts use the local session table; Google/Apple use Supabase OAuth and are normalized into the same application user/profile shape. Routes should call `getCurrentUser()` rather than reading provider state directly.
- Local sessions use secure, HTTP-only cookies, expire after 30 days, rotate on sign-in, and can be revoked for the current account with `DELETE /api/auth/session?all=1`. Password recovery still needs a provider-backed email flow before public launch.
- Realtime Firestore listeners have been replaced with API-backed polling hooks. For production multiplayer, add Socket.IO or a hosted realtime layer.
- Bot gameplay remains behind existing API routes if present.
- AI hints remain optional. If AI credentials are not configured, the app should still boot and human-vs-human gameplay should still work.

## Production data changes

Run `npm run db:push` only for local development or an explicitly reviewed staging change. Production schema changes should use a reviewed Prisma migration and a backup/rollback plan. Economy mutations are recorded in `economy_transactions` with per-user idempotency keys so berry and Claw Token changes can be audited.
