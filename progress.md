Original prompt: Implement the Mobile Gameplay Cleanup + Wheel Duel Redesign plan, including immersive mobile gameplay, no scrolling during play, restored board tiles, simplified arcade interfaces, fixed Goods Sort, and a redesigned Wheel.

Progress:
- Added play-mode layout with hidden mobile header/bottom nav and compact back button.
- Converted game and arcade routes to play mode.
- Restored board tile geometry with explicit small radii and bounded tile text.
- Reworked Word Search, Word Connect, Liquid Sort, Goods Sort, Solitaire Sprint, and Wheel toward compact play surfaces.
- Liquid Sort was simplified to tap-only, three-color play because the drag/tube version remained unplayable on mobile.

TODO:
- Final typecheck passed.
- Final production build passed.
- Browser QA passed at 320x740 and 390x844 for all gameplay routes: no horizontal overflow, no page-height overflow, and no mobile bottom nav in play mode.
- Interaction smoke checks passed for Word Search drag, Liquid Sort tap pour, Goods Sort correct placement, and Wheel flick result.
- Profile and arcade index keep normal vertical scrolling and showed no horizontal overflow.

---

Current prompt: Implement the approved 3D Prize Crane Cabinet plan at `/minigames/claw-crane`, using the supplied claw and character GLBs, a visible rail gantry/carriage, hybrid physics, 25-berry persistent credits, non-duplicate saved prizes, signed-out practice, an in-game collection drawer, and deterministic browser-test hooks.

Prize Crane implementation:
- Completed: shared 32-prize catalog, 25-berry economy types, serializable document mutation helper, and authenticated purchase/start/settle/recovery API.
- Completed check: TypeScript passes after the persistence slice.
- Completed: Three.js/Cannon cabinet, visible dual-rail bridge/carriage, winch/cable, supplied GLB claw assembly, hybrid grab cycle, keyboard/touch controls, fullscreen, and deterministic state/time hooks.
- Completed: continuous-cabinet UI, 25-berry credit control, practice mode, results, and 32-character in-game collection drawer with lazy 3D preview.
- Completed check: TypeScript passes after the 3D/UI slice.
- Completed browser checks: desktop and 390x844 mobile show the cabinet, exposed rails, carriage, claw, prize pile, chute, controls, and collection without viewport overflow or new console errors.
- Completed interaction checks: keyboard and touch aiming, diagonal movement, rail limits, drop/close/lift/deliver/release, deterministic win, deterministic miss, fullscreen wiring, saved owned-prize preview, and collection-complete disabled controls.
- Completed isolated-account checks: 1250 -> 1225 berries on one credit purchase, the unused credit survived reload, starting a play consumed exactly one credit, an interrupted drop resumed after reload, Pebble saved once, the active play cleared, retention rewards applied once, and duplicate settlement returned `duplicate: true` without a second prize.
- Completed cleanup: removed the isolated QA credential, profile, and seven sessions after verification; moved generated screenshots/state logs out of the repo to `/tmp/letterswithcharacters-claw-validation-20260725`.
- Final checks: `npm run typecheck`, `npm run build`, and `git diff --check` pass. The existing multi-lockfile root warning remains non-blocking.

---

Current prompt: Play-test every mini-game, grant every profile 100 berries, and make the prize crane use its own claw-token currency with each token costing 25 berries.

Current audit:
- Confirmed eight playable mini-game routes: 5-in-6, claw crane, liquid sort, match sort, solitaire, wheel, word connect, and word search.
- Implemented an explicit `clawTokens` profile balance and Claw Token UI/API language. Older `clawCredits` balances are read as a compatibility fallback, and old purchase clients remain accepted.
- Each Claw Token costs exactly 25 berries; buying and consuming tokens remain atomic.
- Applied the one-time additive 100-berry grant to all 14 profiles in the active Prisma-backed `users` collection. Total berries increased from 14,003 to 15,403, all 14 profiles carry the grant marker, and a dry rerun correctly skipped all 14.
- TypeScript passes after the economy and grant implementation.
- Production build and `git diff --check` pass. The existing multi-lockfile workspace-root warning remains non-blocking.
- Browser playtest passed for all eight games with meaningful state changes and no new console/page errors:
  - Word Search: dragged across BEACH and advanced to 1/5.
  - 5 in 6: submitted APPLE and advanced to 1/6.
  - Word Connect: built CARE and locked it into the found list.
  - Liquid Sort: poured Tube 1 into Tube 4 and advanced to one move.
  - Goods Sort: moved one Robot to the Robot shelf and advanced to 1/12.
  - Solitaire Sprint: drew a card and reduced the stock from 24 to 23.
  - Wheel: flicked, landed on 600, guessed G, revealed the letter, and banked 600.
  - Claw Crane: moved the carriage from x=0 to x=1.93, completed a deterministic drop, and delivered Gizmo in practice mode.
- Isolated signed-in claw economy check passed: 1,250 -> 1,225 berries bought one Claw Token, one started drop consumed it (0 -> 1 -> 0 tokens), and the play settled. The QA credential, profile, and session were removed afterward.
- Visually inspected the post-action screenshot for every game plus the signed-in Claw Token state. Gameplay remained visible and legible at the tested 1280x800 viewport.

---

Current prompt: Add touch gestures for rotating and zooming the claw game, and add filler underneath the prizes using different colors of balls.

Implementation:
- Added bounded camera orbit controls directly to the cabinet canvas: one-finger drag rotates, two-finger drag rotates, pinch changes zoom, and mouse drag/wheel provide desktop parity.
- Gesture listeners are scoped to the 3D canvas so the joystick, Drop button, drawer, and surrounding app controls keep their existing behavior.
- Added camera yaw, pitch, zoom, and distance to `window.render_game_to_text()` for deterministic gesture verification.
- Replaced the small decorative capsule group with a 28-ball Cannon physics bed in eight colors, kept clear of the chute, and raised the collectible spawn layer so characters settle visibly on top of the balls.
- Added filler-ball count and color data to the deterministic text snapshot.
- Validation passed:
  - `npm run typecheck`, `npm run build`, and `git diff --check`.
  - Required web-game harness confirmed the ready cabinet, 28 balls, eight colors, and no captured console errors.
  - 390x844 touch emulation changed yaw from 0.668 to 0.291 and pitch from 0.324 to 0.491.
  - Pinch-out changed zoom from 1.0 to 0.727; pinch-in reached the bounded 1.32 maximum.
  - A full Drop cycle still settled after the camera gestures.
  - Desktop and mobile screenshots were opened and inspected; prizes remain visible above the balls and the chute remains clear.

---

Current prompt: Disable audio tone generator in favor of .ogg files for BGM.

Progress:
- Removed the Web Audio oscillator BGM fallback from `MusicPlayer`; route-based background music now always selects one of the bundled `.ogg` loops.
- Kept synthesized SFX fallback behavior unchanged because the request is limited to BGM.
- Validation: `npm run typecheck` and `git diff --check` pass. Browser smoke on `/minigames/word-search` fetched `arcade-loop.ogg` after a user gesture with no console errors; the local asset endpoint responds `200` as `audio/ogg`.

---

Current prompt: Implement the ranked release-safety and maintainability roadmap.

Implementation:
- Added shared Zod request contracts, request IDs, standardized success/error envelopes, same-origin mutation checks, and process-local rate limiting for auth, arcade validation, retention, shop, and crane APIs.
- Added an atomic `economy_transactions` Prisma model with per-user idempotency keys and integrated crane token purchase/consumption/settlement, shop purchases, daily rewards, and arcade session rewards.
- Hardened local sessions with rotation, expiry cleanup, secure cookie attributes, and all-session revocation through `DELETE /api/auth/session?all=1`.
- Added Vitest unit coverage for arcade rules, retention idempotency, crane normalization/stock, and API schemas; added Playwright desktop/mobile smoke coverage for all eight mini-games and the crane deterministic hook.
- Improved the arcade index with controls, difficulty, rewards, descriptions, reduced-motion support, keyboard-accessible crane joystick, lazy-loaded crane code, production docs, and environment/security notes.
- Verification: `npm run test:all`, `npm run test:e2e`, and `git diff --check` pass. Lint/build retain only the repository's existing hook/font warnings.

---

Current prompt: Implement the approved Cohesive Game Suite and Gameplay-Loop Upgrade.

Implementation:
- Added one canonical game-mode definition for Word Duel and all eight Arcade modes, including category, objective, rules, score label, completion rule, accessibility guidance, rewards, and stable routes.
- Rebuilt the Arcade into Word Games, Puzzle Shelf, and Prize Corner shelves with full-card activation, daily markers, best score, last-played state, and a shared economy summary.
- Added a shared play header and result panel with labeled counters, rules, sound state, guarded restart, outcome, rewards, personal best, quest progress, replay, next recommendation, and return-to-Arcade actions.
- Rethemed Goods Sort with existing character tile art and story-shelf language while retaining its mechanics; the other puzzle modes now inherit the storybook host framing.
- Fixed Five in Six exhausted boards to record a loss rather than a clear, while retaining explicitly labeled participation rewards.
- Expanded daily and quest rotation coverage across every maintained mode, including Word Duel and Five in Six, and replaced misleading reward ceilings with actual reward composition language.
- Added explicit won/lost/completed/abandoned session outcomes and normalized completion responses; abandoned sessions mint nothing and replayed session IDs remain idempotent.
- Reconciled Word Duel completion, retention, balances, XP, quests, streaks, stats, and economy ledgers atomically. Bot-finished games now record the human result without rewarding the synthetic bot profile.
- Clarified Word Duels navigation and home-base dashboard framing. Added live status announcements, semantic help, keyboard actions, reduced-motion-compatible framing, and play-surface-only touch behavior.
- Preserved the pre-existing uncommitted game-board and tile-rack responsiveness edits unchanged.

Validation:
- `npm test`: 52 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed before the final economy-source fix; repeated in the final validation pass.
- `npm run lint`: 0 errors and 13 existing warnings.
- `npm run test:e2e -- --workers=2`: all 18 desktop/mobile cases passed with installed Chrome.
- The required web-game harness successfully interacted with Wheel; screenshots for Wheel and the categorized Arcade were visually inspected.
- Live Supabase auth, two-user remote play, OAuth, production persistence, and production deployment remain outside this local verification run.

---

Current prompt: Continue with the next accessibility, playability, and return-value improvement slice.

Implementation:
- Added a prominent Today’s Story card to the dashboard whenever no live duel turn needs attention. It names the activity, goal, estimated play time, exact berry/XP reward, completion state, and direct next action.
- Added canonical estimated play time to every game-mode definition so timing copy remains shared rather than drifting between surfaces.
- Replaced the hand-built result overlay with the existing Radix dialog primitive, providing focus entry, focus containment, accessible title/description, and protected outside-click/Escape behavior while a result requires a next action.
- Expanded Liquid Sort tube labels to expose ordered color contents and selection state to assistive technology.
- Added a complete keyboard-driven Liquid Sort browser journey covering clear, accessible result, practice-state explanation, replay reset, and return to the Arcade.
- Corrected a mobile result-card clipping issue found during visual inspection by moving the sign-in action into a responsive full-width row.

Validation:
- `npm test`: 52 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: 0 errors and the same 13 existing warnings.
- `npm run test:e2e -- --workers=2`: 20 desktop/mobile cases passed before the final responsive-only layout correction; repeated in the final validation pass.
- The required web-game harness rendered Liquid Sort without console output, and both the initial board and completed mobile result were visually inspected.
- The authenticated dashboard card could not be visually exercised locally because Supabase environment variables are not configured; its code and types were validated locally.

---

Current prompt: Make the board bonus squares quickly identifiable with color-coded transparent overlays, remove the visible STAR label, and demo a game with a bot.

Implementation:
- Retained the center star icon but removed its visible STAR text.
- Changed bonus squares to consistent translucent overlays layered over the currently selected board skin: blue double-letter, green triple-letter, pink double-word, and orange-red triple-word.
- Replaced terse DL/TL/DW/TW text with compact 2x/3x plus LETTER/WORD labels; the secondary label hides only at the narrowest board size to avoid overlap.
- Added semantic bonus-square labels with the full bonus name and row/column, plus deterministic `data-board-bonus` attributes.

Validation and blocker:
- `npm run typecheck`, `npm test` (52 passing), and `git diff --check` pass.
- A live bot demo could not start: production guest entry reports `Document storage is unavailable`, while the local checkout has no database/auth or Gemini/Google AI environment configured. No working bot match was claimed.

---

Current prompt: Visually audit and polish the game suite, especially the mini-games, and redesign Wheel.

Implementation:
- Rebuilt Wheel as a compact storybook game-show stage with a larger gold-rimmed wheel, clearer wedge hierarchy, visible category, spin-value feedback, phrase board, vowel pricing, score bank, responsive solo/duel control, and a live status banner.
- Preserved Wheel's existing mechanics while making the spin, landed value, allowed next action, and solve path visually explicit.
- Strengthened the shared game header contrast so controls remain readable over branded game backdrops.
- Added a shared branded loading state and applied it to Word Search and Word Connect, replacing blank pulse panels that could look like broken screens.
- Audited production Arcade, Wheel, Word Search, Liquid Sort, Goods Sort, and Solitaire on the live site, then inspected the redesigned Wheel locally at desktop and 390x844 mobile sizes.

Visual audit findings:
- Arcade has a sound category structure, but the hero and shelves still need a stronger featured-game focal point and less undifferentiated white space.
- Liquid Sort is clear and playable but needs a more distinctive story setting and character presence.
- Goods Sort's shelf language fits the suite, but character/prize artwork should become the dominant objects rather than decorative material swatches.
- Solitaire is familiar and readable, but remains the most visually generic mode and should receive the next full art-direction pass.
- Production Word Search's blank loading panel was the most visible continuity break; the new shared loading state addresses it locally.

Validation:
- Required web-game harness spun Wheel and captured the landed-value/consonant state; the screenshot was visually inspected.
- Desktop and 390x844 mobile Wheel states were visually inspected after an actual spin, with no clipped controls.
- `npm run typecheck`: passed.
- `npm test`: 52 tests passed.
- `npm run lint`: 0 errors and 13 existing warnings.
- `npm run build`: passed.
- `npm run test:e2e -- --workers=2`: 20 desktop/mobile cases passed.
- `git diff --check`: passed.
- Production bot play and persistent rewards remain unverified because production document storage is unavailable and local service credentials are not configured.

---

Current prompt: Continue the visual audit and game-suite polish.

Implementation:
- Rethemed Solitaire Sprint as the Royal Reading Room with a deep storybook table, gold-accented card backs, clearer foundation and tableau zones, a visible stock count, and a more distinctive visual identity without changing Klondike mechanics.
- Added useful accessible labels for Solitaire stock, waste, suit foundations, and tableau columns.
- Added a prominent daily featured-story card to the Arcade between the suite overview and categorized shelves, including the current game, objective, play time, reward summary, best score state, and direct action.
- Reframed Goods Sort's misleading texture-based “characters” as truthful storybook parcels: Feathers, Yarn, Gadget, and Toast. Added visible parcel badges plus selection and shelf labels for assistive technology.
- Preserved all existing routes, progression, and game mechanics.

Validation:
- Required web-game harness captured and visually verified a Solitaire draw state, the Arcade featured story, and Goods Sort after the parcel-label polish.
- Direct mobile QA at 390x844 verified Solitaire layout and a complete Goods Sort select-to-matching-shelf interaction with visible and announced progress.
- `npm run typecheck`: passed.
- `npm test`: 52 tests passed.
- `npm run lint`: 0 errors and 13 existing warnings.
- `npm run build`: passed.
- `npm run test:e2e -- --workers=2`: 20 desktop/mobile cases passed.
- `git diff --check`: passed.

Next visual priorities:
- Give Liquid Sort a stronger story setting and collection/result spectacle.
- Create actual 2D character/prize portraits for lightweight use outside the GLB crane; the existing tile textures should not be represented as character art.
- Add meaningful interaction coverage for Solitaire, Goods Sort, Wheel, Word Search, Word Connect, and Five in Six rather than relying only on route/overflow checks.

---

Current prompt: Implement a deployment-safe local bot demo that works without production document storage or Gemini credentials, remains isolated from accounts/rewards/economy, preserves production, and is fully verified locally.

Implementation:
- Added `/demo/bot` as a self-contained, deterministic CAT -> CATS practice duel with no auth, API, storage, Gemini, retention, or economy dependency.
- Added a clear login-screen entry and repeated practice-only/no-save disclosures in the demo.
- Kept the production `/api/games/bot`, `/game`, authentication, reward, and persistence flows unchanged.
- Added deterministic `render_game_to_text` and `advanceTime` hooks plus unit and browser coverage for the complete interaction and zero production API calls.

Validation in progress:
- Unit test and typecheck pass.
- First browser run exposed unstable hover-moving rack buttons; removed target-position animation before rerunning the full interaction.
- Desktop and 390x844 browser journeys pass the complete CAT -> CATS -> restart flow with zero production API requests.
- Deterministic state reports no persistence, disabled rewards, no credential requirement, the final CATS board, and 10-6 scores.
- Completed desktop and mobile screenshots were visually inspected; no console errors or horizontal overflow were observed.
- Final verification passed: `npm test` (54 tests), `npm run typecheck`, `npm run build`, targeted Playwright entry/full-interaction tests on desktop and 390x844 mobile, required web-game harness, and `git diff --check`.
- The build retains the repository's existing 13 lint warnings; no new warning was introduced by this slice.

Additional customization:
- Added four original 512x512 Storybook Treasures tile finishes: Moonlit Observatory, Strawberry Picnic, Enchanted Moss, and Dragon Scale.
- Authored explicit rarity, level, berry price, description, collection, and light/dark letter-readability metadata for each finish.
- Added catalog coverage confirming all four generated entries resolve through the shared shop/profile/gameplay tile system.
- Removed the rounded pill border/background/shadow around the mobile header logo while preserving its size and placement.

---

Current prompt: Move the app from PostgreSQL/Supabase to Firebase with a clean account/economy reset, preserving the production API authorization flow and the credential-free local bot demo.

Firebase cutover:
- Connected the existing Firebase web app for project `studio-1704097120-f2816`; confirmed Email/Password, Google, and Anonymous Auth plus Firestore in `us-central1`.
- Replaced Supabase/local sessions with Firebase Auth ID tokens exchanged for revocable, HTTP-only Admin SDK session cookies.
- Replaced the Prisma document store and bot-game transaction with Firestore, including atomic profile mutations and deterministic idempotent economy-ledger documents.
- Kept persistent access behind the existing Next.js API authorization and projection boundaries; direct browser Firestore access is denied by checked-in rules.
- Added Auth/Firestore emulator configuration and a credential-free local workflow. `/demo/bot` remains independent of Firebase, Gemini, accounts, and economy state.
- Removed the obsolete Supabase, Prisma, callback, middleware, and password-store runtime paths; rewrote the berry grant for Firestore.

Validation:
- Firebase emulator browser flow passed: username account -> secure session -> 1,250-berry profile -> Medium Bitty Botty game -> dashboard live-game card -> playable 15x15 game board with a seven-tile rack.
- API evidence confirmed the profile and game persisted in Firestore and used the verified Firebase UID for both player ownership and current turn.
- `npm run typecheck`, `npm test` (55 tests), `npm run build`, required web-game harness, visual screenshot inspection, and `git diff --check` passed.

Remaining deployment step:
- Publish `firestore.rules` / indexes and provide Application Default Credentials (Firebase App Hosting / Google Cloud) or `FIREBASE_SERVICE_ACCOUNT_JSON` on a non-Google host.
