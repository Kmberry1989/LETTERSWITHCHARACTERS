# Asset Manifest

Create these files to improve the visual and sound experience. PNG dimensions are the expected source sizes. Sound effects should be delivered as `.ogg`.

## Audio

The app references these paths directly. Missing files are intentional during development: the runtime falls back to generated WebAudio tones/music until the `.ogg` assets are supplied.

| File | Purpose | Format | Expected Duration | Notes |
| --- | --- | --- | --- | --- |
| `public/audio/sfx/ui-click.ogg` | Buttons, tab changes, small confirmations | `.ogg` | `0.04-0.12s` | Very short, soft paper-tick feel |
| `public/audio/sfx/tile-place.ogg` | Dropping a tile on board | `.ogg` | `0.10-0.25s` | Wood/block placement with light snap |
| `public/audio/sfx/rack-shuffle.ogg` | Recall, rack shuffle, exchange motion | `.ogg` | `0.25-0.55s` | Gentle shuffle/whoosh hybrid |
| `public/audio/sfx/word-success.ogg` | Successful play / scoring word | `.ogg` | `0.45-0.90s` | Bright playful reward sting |
| `public/audio/sfx/error-buzz.ogg` | Invalid move / failure | `.ogg` | `0.12-0.30s` | Short muted negative tone |
| `public/audio/sfx/arcade/select.ogg` | Arcade tile/card/letter selection | `.ogg` | `0.04-0.12s` | Small upbeat pop, lighter than `tile-place` |
| `public/audio/sfx/arcade/success.ogg` | Arcade word found, correct shelf, minor success | `.ogg` | `0.25-0.60s` | Short reward sparkle, less prominent than full word success |
| `public/audio/sfx/arcade/error.ogg` | Arcade invalid move or incorrect guess | `.ogg` | `0.10-0.25s` | Soft negative tap, not harsh |
| `public/audio/sfx/arcade/liquid-pour.ogg` | Liquid Sort valid pour | `.ogg` | `0.25-0.55s` | Quick liquid/glass pour, trimmed tightly |
| `public/audio/sfx/arcade/card-move.ogg` | Solitaire card draw/move | `.ogg` | `0.08-0.20s` | Light card slide or flick |
| `public/audio/sfx/arcade/wheel-spin.ogg` | Wheel flick/spin start | `.ogg` | `0.35-0.80s` | Energetic spin-up/whoosh |
| `public/audio/sfx/arcade/wheel-tick.ogg` | Wheel segment tick while spinning | `.ogg` | `0.02-0.08s` | Very short click/tick, designed for rapid repeat |
| `public/audio/sfx/arcade/wheel-land.ogg` | Wheel settles on a result | `.ogg` | `0.30-0.70s` | Satisfying stop/chime |
| `public/audio/sfx/lobby-notification.ogg` | New lobby chat/challenge pop | `.ogg` | `0.25-0.60s` | Optional future use |
| `public/audio/sfx/turn-ready.ogg` | Your-turn notification | `.ogg` | `0.40-0.90s` | Optional future use |

## Background Music

| File | Purpose | Format | Expected Duration | Notes |
| --- | --- | --- | --- | --- |
| `public/audio/music/menu-loop.ogg` | Default app/menu screens outside gameplay and arcade | `.ogg` | `45-90s` loop | Seamless loop, calm clubhouse feel |
| `public/audio/music/arcade-loop.ogg` | Arcade index and all `/minigames/*` routes | `.ogg` | `45-90s` loop | Seamless loop, playful and more energetic |
| `public/audio/music/game-board-loop.ogg` | Main `/game` board route | `.ogg` | `60-120s` loop | Seamless loop, focused and unobtrusive |

## Interface Visuals

| File | Purpose | Expected Size |
| --- | --- | --- |
| `public/interface/logo.png` | Main game logo | `1024x1024` |
| `public/interface/header.png` | Compact top-header brand image | `1200x360` |
| `public/interface/sidebar.png` | Desktop sidebar background art behind centered nav buttons | `1024x2048` |
| `public/interface/backgrounds/login-burst.png` | Landing/login background illustration | `1920x1080` |
| `public/interface/backgrounds/lobby-confetti.png` | Lobby hero decorative layer | `1920x1080` |
| `public/interface/ornaments/floating-star-large.png` | Animated hero/lobby decoration | `512x512` |
| `public/interface/ornaments/floating-star-small.png` | Animated hero/lobby decoration | `256x256` |
| `public/interface/ornaments/spark-swish.png` | Word-play celebratory streak | `1024x256` |
| `public/interface/ornaments/berry-badge-glow.png` | Berry counter glow effect | `256x256` |

## Board Visuals

Runtime note: the game now supports these as in-engine board layers. In the first pass it falls back to authored gradient layers when a PNG is not present. If you create these files with the listed names, the board renderer can consume them directly.

| File | Purpose | Expected Size |
| --- | --- | --- |
| `public/interface/board/board-frame.png` | Outer board frame / bevel | `2048x2048` |
| `public/interface/board/board-shadow.png` | Soft board drop shadow layer | `2048x2048` |
| `public/interface/board/board-cloth.png` | Tabletop / felt surface under board | `2048x2048` |
| `public/interface/board/bonus-star.png` | Center star art replacement | `256x256` |
| `public/interface/board/cell-highlight.png` | Hover / drop-target highlight | `128x128` |

## Tile Effects

| File | Purpose | Expected Size |
| --- | --- | --- |
| `public/interface/tiles/tile-gloss.png` | Shared highlight overlay for tiles | `256x256` |
| `public/interface/tiles/tile-shadow.png` | Shared soft tile shadow | `256x256` |
| `public/interface/tiles/tile-lock-badge.png` | Lock icon plate for locked cosmetics | `128x128` |
| `public/interface/tiles/new-tile-burst.png` | Newly replenished rack tile burst | `256x256` |
| `public/interface/tiles/tile-trail.png` | Dragging trail accent | `512x128` |

## Avatars and Profile

| File | Purpose | Expected Size |
| --- | --- | --- |
| `public/interface/profile/profile-header-ribbon.png` | Profile section header art | `1600x400` |
| `public/interface/profile/stats-card-shine.png` | Stats panel subtle gloss | `800x400` |
| `public/interface/profile/theme-preview-frame.png` | Theme selector preview frame | `512x320` |

## Notes

- Prefer transparent-background PNGs for ornaments, tile effects, and badges.
- For board runtime layers, author frame and shadow as transparent PNG overlays; cloth can be transparent or full-bleed.
- The board renderer currently treats `board-frame.png`, `board-shadow.png`, and `board-cloth.png` as compositing layers and expects them to align to the board square.
- Keep `.ogg` files trimmed tightly to remove silence.
- For UI SFX, target `<= 1.0s` duration.
- For wheel tick SFX, target `<= 0.08s` duration because it can repeat quickly during a spin.
- Background music files should loop cleanly with no audible start/end gap and should be mixed quietly enough for SFX to remain clear.
- For decorative background PNGs, export at 2x detail if they include illustrated edges or texture.
