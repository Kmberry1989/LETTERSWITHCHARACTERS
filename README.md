# Letters with Characters

Human-only multiplayer word game built with Next.js 15, PostgreSQL, Prisma, local session auth, and optional Genkit-powered hints.

## Requirements

- Node.js 20+
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
```

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
- Local session auth is intentionally lightweight for development/prototyping. Before a public launch, replace it with a hardened auth provider such as Auth.js, Clerk, or a full credential system with password hashing and OAuth.
- Realtime Firestore listeners have been replaced with API-backed polling hooks. For production multiplayer, add Socket.IO or a hosted realtime layer.
- Bot gameplay remains behind existing API routes if present.
- AI hints remain optional. If AI credentials are not configured, the app should still boot and human-vs-human gameplay should still work.
