export type SfxType =
  | 'click'
  | 'place'
  | 'swoosh'
  | 'success'
  | 'error'
  | 'arcadeSelect'
  | 'arcadeSuccess'
  | 'arcadeError'
  | 'sortPour'
  | 'cardMove'
  | 'wheelSpin'
  | 'wheelTick'
  | 'wheelLand'
  | 'lobbyNotification'
  | 'turnReady';

export const SFX_FILE_MAP: Record<SfxType, string> = {
  click: '/audio/sfx/ui-click.ogg',
  place: '/audio/sfx/tile-place.ogg',
  swoosh: '/audio/sfx/rack-shuffle.ogg',
  success: '/audio/sfx/word-success.ogg',
  error: '/audio/sfx/error-buzz.ogg',
  arcadeSelect: '/audio/sfx/ui-click.ogg',
  arcadeSuccess: '/audio/sfx/word-success.ogg',
  arcadeError: '/audio/sfx/error-buzz.ogg',
  sortPour: '/audio/sfx/rack-shuffle.ogg',
  cardMove: '/audio/sfx/card-move.ogg',
  wheelSpin: '/audio/sfx/wheel-spin.ogg',
  wheelTick: '/audio/sfx/wheel-tick.ogg',
  wheelLand: '/audio/sfx/wheel-land.ogg',
  lobbyNotification: '/audio/sfx/lobby-notification.ogg',
  turnReady: '/audio/sfx/turn-ready.ogg',
};

export const MUSIC_TRACKS = {
  menu: '/audio/music/menu-loop.ogg',
  arcade: '/audio/music/arcade-loop.ogg',
  game: '/audio/music/game-board-loop.ogg',
} as const;

export type MusicTrackId = keyof typeof MUSIC_TRACKS;

export function getMusicTrackForPathname(pathname: string): MusicTrackId {
  if (pathname === '/game' || pathname.startsWith('/game/')) {
    return 'game';
  }
  if (pathname === '/minigames' || pathname.startsWith('/minigames/')) {
    return 'arcade';
  }
  return 'menu';
}
