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
