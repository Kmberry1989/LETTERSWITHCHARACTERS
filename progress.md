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
