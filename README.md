# Letters with Characters

Human-only multiplayer word game built with Next.js 15, Firebase Auth, Firestore, and optional Genkit-powered hints.

## Requirements

- Node.js 20+
- npm
- A Firebase project with Authentication and Firestore enabled
- Local credentials for Firebase Admin if you want to exercise the server routes outside Firebase App Hosting
- Optional: Google AI / Genkit credentials if you want hints and AI word validation to work

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure Firebase for the project you want to use.

- Client config is currently sourced from [`src/firebase/config.ts`](/Users/kyleberry/Documents/GitHub/LETTERSWITHCHARACTERS/src/firebase/config.ts).
- For local server-side route execution, provide Google application default credentials or another Firebase Admin credential source that `firebase-admin` can use.

3. Start the app:

```bash
npm run dev
```

4. Optional: start Genkit tooling for AI development:

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

## Firestore collections

- `users`
- `games`
- `lobbyMessages`
- `lobbyChallenges`

## Notes

- Firestore rules in [`firestore.rules`](/Users/kyleberry/Documents/GitHub/LETTERSWITHCHARACTERS/firestore.rules) are currently wide open for development.
- Bot gameplay has been removed.
- AI hints remain optional. If AI credentials are not configured, the app should still boot and human-vs-human gameplay should still work.
