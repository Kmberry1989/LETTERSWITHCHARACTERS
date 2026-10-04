# Letters with Characters audit — 2026-09-06

Audited GitHub main at a691a5d4399ab642c3c0a01e81225e6a6d9b2f81. Restored the missing configured checkout by cloning its verified origin. The older Downloads checkout was left untouched. No application source, database, or deployment was changed.

## Findings

1. **P1 — Local account impersonation through editable profile identity.** `src/app/api/documents/[collection]/[documentId]/route.ts:71` accepts arbitrary fields for the signed-in user's profile. `src/lib/server/auth.ts:164` then derives the next authenticated identity from `profile.uid`, ahead of the session's authoritative user ID. An isolated handler test changed an attacker's own profile uid to a victim ID and confirmed that getCurrentUser subsequently returned the victim ID. Always derive identity from the verified session; prohibit identity fields in profile edits.
2. **P1 — Generic document endpoints bypass access control.** Collection GET/POST have no authentication; document GET has no authentication; the mutation guard returns immediately for every collection except users (`src/app/api/documents/[collection]/[documentId]/route.ts:8`). These handlers use direct Prisma document storage. Private directThreads, user data, and game state are exposed through routes that bypass the dedicated API checks. Isolated tests confirmed an unauthenticated private-profile read and game write reach the store successfully. Enforce collection allowlists, authentication, participant checks, and separate public projections.
3. **P1 — Profile updates bypass the economy ledger.** The same arbitrary profile patch accepts berries, ownedTileSetIds, level and other server-managed fields. An isolated test confirmed a supplied berry balance is persisted. Permit only validated editable appearance/preferences fields; route economy changes exclusively through the transactional APIs. The old checkout's shop purchase race is already repaired in current main and is not a current finding.
4. **P2 — Local sign-in is disabled without optional-provider settings.** `src/firebase/provider.tsx:151` determines all authentication availability from Supabase settings; its refresh function returns early when those settings are missing. `src/app/page.tsx:150` and following disable local credentials and guest access along with OAuth. Browser screenshots reproduce this in the clean checkout. Separate local session availability from OAuth configuration. Database-backed sign-in was not tested because this checkout has no service environment configured.

## Verification

- npm ci succeeded on Node 22.23.1.
- npm test: 9 tests passed across 3 files.
- npm run lint: 0 errors, 13 warnings (mostly hook dependencies).
- npm run typecheck: passed.
- npm run build: passed.
- Three additional isolated evidence tests passed, demonstrating the unsafe current behavior. Their source is preserved in route-evidence.test.ts and results in route-evidence.txt; they are outside the regular test discovery path because they assert vulnerabilities, not desired behavior. Prisma/session/document operations were mocked; no database was used.
- Production server served / with HTTP 200. The suspected middleware startup failure was not reproduced and is excluded from findings; the generated middleware manifest was empty.

## Browser flow

1. Desktop login: layout rendered; all authentication controls disabled with the missing-Supabase message. Screenshot: login-desktop.png.
2. Mobile login (390 x 844): layout rendered; same authentication blocker. Screenshot: login-mobile.png.
3. Mobile Word Search: grid and word list rendered; New Grid worked. Document width equaled viewport width (390px). Screenshot: word-search-mobile.png. A user-list request returned 503 with the unconfigured database. This is not proof of live backend failure.

No full accessibility audit, two-user multiplayer, OAuth, live database authorization test, or deployed-site validation was completed. Findings 1–3 are source and isolated-handler evidence; finding 4 has browser evidence. The local screenshots document this run only.
