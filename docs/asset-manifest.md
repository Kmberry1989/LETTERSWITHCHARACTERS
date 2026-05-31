# Asset Manifest

Create these files to improve the visual and sound experience. PNG dimensions are the expected source sizes. Sound effects should be delivered as `.ogg`.

## Audio

| File | Purpose | Format | Notes |
| --- | --- | --- | --- |
| `public/audio/sfx/ui-click.ogg` | Buttons, tab changes, small confirmations | `.ogg` | Very short, soft paper-tick feel |
| `public/audio/sfx/tile-place.ogg` | Dropping a tile on board | `.ogg` | Wood/block placement with light snap |
| `public/audio/sfx/rack-shuffle.ogg` | Recall, rack shuffle, exchange motion | `.ogg` | Gentle shuffle/whoosh hybrid |
| `public/audio/sfx/word-success.ogg` | Successful play / scoring word | `.ogg` | Bright playful reward sting |
| `public/audio/sfx/error-buzz.ogg` | Invalid move / failure | `.ogg` | Short muted negative tone |
| `public/audio/sfx/lobby-notification.ogg` | New lobby chat/challenge pop | `.ogg` | Optional future use |
| `public/audio/sfx/turn-ready.ogg` | Your-turn notification | `.ogg` | Optional future use |

## Interface Visuals

| File | Purpose | Expected Size |
| --- | --- | --- |
| `public/interface/logo.png` | Main game logo | `1024x1024` |
| `public/interface/backgrounds/login-burst.png` | Landing/login background illustration | `1920x1080` |
| `public/interface/backgrounds/lobby-confetti.png` | Lobby hero decorative layer | `1920x1080` |
| `public/interface/backgrounds/sidebar-stars.png` | Sidebar texture / pattern overlay | `1024x2048` |
| `public/interface/ornaments/floating-star-large.png` | Animated hero/lobby decoration | `512x512` |
| `public/interface/ornaments/floating-star-small.png` | Animated hero/lobby decoration | `256x256` |
| `public/interface/ornaments/spark-swish.png` | Word-play celebratory streak | `1024x256` |
| `public/interface/ornaments/berry-badge-glow.png` | Berry counter glow effect | `256x256` |

## Board Visuals

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
- Keep `.ogg` files trimmed tightly to remove silence.
- For UI SFX, target `<= 1.0s` duration.
- For decorative background PNGs, export at 2x detail if they include illustrated edges or texture.
