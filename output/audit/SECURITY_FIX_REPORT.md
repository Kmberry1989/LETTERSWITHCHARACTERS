# Security boundary fixes — 2026-09-06

Outcome: fixed in the local source with isolated regression verification. Not deployed.

## Scope and invariant

This pass implements the first three audit recommendations: authoritative identity, document access control, and protection against direct profile economy edits. A verified local session or OAuth subject determines identity. Generic document APIs must not grant anonymous access, non-participant access to private documents, or client writes to identity, gameplay, ownership, or currency state.

The original local-session identity substitution, anonymous read/write cases, arbitrary protected fields, dotted keys, and legacy poisoned document IDs no longer reproduce in the regression tests. The tests mock persistence and authentication dependencies; this is not live database penetration-test evidence.

## Implementation

- `src/lib/server/auth.ts`: local user ID comes from the session row; OAuth user ID comes from the verified provider subject.
- `src/lib/server/document-store.ts`: storage document IDs override any embedded JSON ID; collection queries can apply participant filters in PostgreSQL before pagination.
- `src/lib/server/document-access.ts`: shared collection allowlist, public profile projection, strict editable-profile schema and canonical avatar metadata.
- `src/app/api/documents/[collection]/[documentId]/route.ts`: requires authentication, checks private-document membership, restricts profile edits to the owner, rejects replacement PUTs and protected/dotted fields, and performs profile settings updates atomically.
- `src/app/api/documents/[collection]/route.ts`: requires authentication, filters private collections, bounds listing queries, and reconstructs lobby sender/creator identity and timestamps from server state. Generic game/user/direct-thread creation is rejected.
- `src/app/api/games/bot/route.ts`: dedicated endpoint accepts only difficulty, constructs game state server-side, checks for an active bot game, and writes the game plus owner's game index in one serializable transaction with conflict retries.
- `src/app/dashboard/bot-game-dialog.tsx`: calls the dedicated endpoint rather than submitting authoritative game state and gameIds.
- `src/firebase/firestore/use-users.tsx`: waits for a signed-in user before loading the now-protected player directory.

This retains the existing UI/API shapes where feasible. Bot creation had to move to a dedicated endpoint so rejecting arbitrary generic game writes would not break the existing caller. Public player projections retain leaderboard and player-discovery fields while omitting other users' email, subscriptions, private game indexes and balances.

## Verification

- `git diff --check`: passed.
- `npm run typecheck`: passed after removing the old client-built game reference.
- `npm test`: 49 tests passed across 7 files (40 new regression/control cases plus 9 existing tests).
- `npm run lint`: passed with 0 errors and the same 13 pre-existing warnings.
- `npm run build`: passed, including the new `/api/games/bot` route.

New tests:
- `tests/unit/auth-identity.test.ts`: poisoned local/OAuth profile identity controls.
- `tests/unit/document-access.test.ts`: anonymous access, other-profile edits, protected and alternate keys, private membership, projections, bounded queries, allowed appearance/avatar/preferences edits, and server-owned lobby metadata.
- `tests/unit/document-store-boundaries.test.ts`: authoritative storage IDs and database-level participant filtering.
- `tests/unit/bot-creation.test.ts`: anonymous/forged creation denial, server-owned game construction, preserved owner balance and game index, transaction isolation and duplicate rejection.

The pre-patch compatibility investigator completed. The independent candidate-review agent hit an account usage limit and did not produce a review; the parent performed the candidate review directly, tracing identity representations, both generic route forms, profile callers, lobby creation, bot creation, leaderboard/discovery fields and private collection filters.

## Limits and remaining work

No live database, OAuth, two-player match or production deployment was exercised. No database migration or historical-data repair was performed, and prior unauthorized changes—if any—are not reversed by this patch. No commit or push was made.

This pass closes direct generic API identity/economy mutations; it does not claim an exhaustive audit of every reward algorithm or concurrent server-side lifecycle writer. The remaining audit suggestions (decoupled local/OAuth availability, broader gameplay verification and Word Search keyboard access) are outside this first pass.
