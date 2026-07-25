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
