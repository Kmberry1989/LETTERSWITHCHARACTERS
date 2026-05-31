import type { CSSProperties } from 'react';

export type BoardTintPreset = {
  id: string;
  name: string;
  overlay: string;
  glow: string;
  labelTone?: 'light' | 'dark';
  blendMode?: 'soft-light' | 'overlay' | 'multiply' | 'screen';
  opacity?: number;
};

export type BoardSkinLayer = {
  assetPath?: string;
  background?: string;
  tintable?: boolean;
  opacity?: number;
  blendMode?: CSSProperties['mixBlendMode'];
  className?: string;
};

export type BoardSkin = {
  id: string;
  name: string;
  previewColor: string;
  boardSurface: string;
  frame?: BoardSkinLayer;
  cloth?: BoardSkinLayer;
  shadow?: BoardSkinLayer;
  surfaceOverlay?: BoardSkinLayer;
  highlight?: BoardSkinLayer;
  bonusStar?: BoardSkinLayer;
  defaultTintId: string;
};

export const BOARD_TINT_PRESETS: BoardTintPreset[] = [
  { id: 'sunbeam', name: 'Sunbeam', overlay: 'linear-gradient(135deg, rgba(255,201,107,0.38), rgba(255,241,196,0.12))', glow: 'rgba(255,196,84,0.28)', labelTone: 'dark', blendMode: 'soft-light', opacity: 0.95 },
  { id: 'rose', name: 'Rose Glow', overlay: 'linear-gradient(135deg, rgba(255,143,163,0.34), rgba(255,234,214,0.08))', glow: 'rgba(255,120,150,0.2)', labelTone: 'dark', blendMode: 'overlay', opacity: 0.9 },
  { id: 'mint', name: 'Mint Pop', overlay: 'linear-gradient(135deg, rgba(114,235,198,0.28), rgba(238,255,245,0.06))', glow: 'rgba(76,214,170,0.22)', labelTone: 'dark', blendMode: 'soft-light', opacity: 0.92 },
  { id: 'violet', name: 'Violet Glow', overlay: 'linear-gradient(135deg, rgba(157,141,241,0.32), rgba(236,226,255,0.12))', glow: 'rgba(138,114,238,0.24)', labelTone: 'light', blendMode: 'overlay', opacity: 0.95 },
  { id: 'ocean', name: 'Ocean Mist', overlay: 'linear-gradient(135deg, rgba(91,193,255,0.3), rgba(226,247,255,0.08))', glow: 'rgba(88,187,255,0.22)', labelTone: 'dark', blendMode: 'screen', opacity: 0.92 },
  { id: 'ember', name: 'Ember Pop', overlay: 'linear-gradient(135deg, rgba(255,137,79,0.34), rgba(255,228,197,0.08))', glow: 'rgba(255,123,64,0.24)', labelTone: 'light', blendMode: 'multiply', opacity: 0.86 },
];

export const BOARD_SKINS: BoardSkin[] = [
  {
    id: 'board-green',
    name: 'Classic Green',
    previewColor: '#8bbf8d',
    boardSurface: 'linear-gradient(180deg, #d8cfbc 0%, #c9b69a 100%)',
    defaultTintId: 'sunbeam',
    cloth: { background: 'radial-gradient(circle at top, rgba(214,240,216,0.95), rgba(161,195,149,0.82) 60%, rgba(114,138,95,0.95))' },
    shadow: { background: 'radial-gradient(circle, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.06) 62%, transparent 70%)' },
    frame: { background: 'linear-gradient(145deg, rgba(116,78,48,0.96), rgba(82,54,31,1))' },
    surfaceOverlay: { background: 'radial-gradient(circle at top left, rgba(255,255,255,0.25), transparent 42%)', tintable: true, blendMode: 'soft-light', opacity: 1 },
  },
  {
    id: 'board-wood',
    name: 'Dark Wood',
    previewColor: '#8f6b4f',
    boardSurface: 'linear-gradient(180deg, #d7cab2 0%, #baa07b 100%)',
    defaultTintId: 'ember',
    cloth: { background: 'radial-gradient(circle at top, rgba(214,187,154,0.9), rgba(124,88,58,0.9) 62%, rgba(67,44,29,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(76,46,28,1), rgba(39,23,16,1))' },
    surfaceOverlay: { background: 'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(66,41,21,0.24))', tintable: true },
  },
  {
    id: 'board-zen',
    name: 'Zen Garden',
    previewColor: '#c7c1a4',
    boardSurface: 'linear-gradient(180deg, #e4dbc8 0%, #cfc2aa 100%)',
    defaultTintId: 'mint',
    cloth: { background: 'radial-gradient(circle at top, rgba(235,241,223,0.92), rgba(208,198,178,0.92) 64%, rgba(167,158,136,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(144,120,90,0.98), rgba(95,72,48,1))' },
    surfaceOverlay: { background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.11) 0 6px, rgba(0,0,0,0.03) 6px 12px)', tintable: true, opacity: 0.7 },
  },
  {
    id: 'board-desk',
    name: "Captain's Desk",
    previewColor: '#9a7a57',
    boardSurface: 'linear-gradient(180deg, #dac7ad 0%, #c19c70 100%)',
    defaultTintId: 'sunbeam',
    cloth: { background: 'radial-gradient(circle at top, rgba(240,224,184,0.94), rgba(163,121,77,0.92) 65%, rgba(94,63,38,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(125,84,42,1), rgba(77,49,23,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,246,205,0.16), rgba(137,95,52,0.22))', tintable: true },
  },
  {
    id: 'board-blossom',
    name: 'Cherry Blossom',
    previewColor: '#e2a7b6',
    boardSurface: 'linear-gradient(180deg, #eed9d7 0%, #d5b0b1 100%)',
    defaultTintId: 'rose',
    cloth: { background: 'radial-gradient(circle at top, rgba(255,239,244,0.96), rgba(244,192,210,0.92) 58%, rgba(184,132,151,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(143,92,112,1), rgba(93,55,69,1))' },
    surfaceOverlay: { background: 'radial-gradient(circle at top left, rgba(255,255,255,0.28), transparent 42%)', tintable: true },
  },
  {
    id: 'board-neon',
    name: 'Neon City',
    previewColor: '#6d97ff',
    boardSurface: 'linear-gradient(180deg, #cad0e4 0%, #8a95b9 100%)',
    defaultTintId: 'violet',
    cloth: { background: 'radial-gradient(circle at top, rgba(38,54,93,0.92), rgba(17,21,45,1) 72%)' },
    frame: { background: 'linear-gradient(145deg, rgba(39,45,94,1), rgba(12,14,36,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(130,108,255,0.22), rgba(64,231,255,0.14))', tintable: true, blendMode: 'screen' },
  },
  {
    id: 'board-blueprint',
    name: 'Blueprint',
    previewColor: '#75a7da',
    boardSurface: 'linear-gradient(180deg, #d2dde9 0%, #9eb3c8 100%)',
    defaultTintId: 'ocean',
    cloth: { background: 'radial-gradient(circle at top, rgba(191,219,255,0.92), rgba(85,123,170,0.96) 70%, rgba(39,74,124,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(53,89,140,1), rgba(26,52,84,1))' },
    surfaceOverlay: { background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.11) 0 10px, transparent 10px 20px), repeating-linear-gradient(90deg, rgba(255,255,255,0.11) 0 10px, transparent 10px 20px)', tintable: true, opacity: 0.65 },
  },
  {
    id: 'board-jungle',
    name: 'Jungle',
    previewColor: '#87b56d',
    boardSurface: 'linear-gradient(180deg, #d7d0b6 0%, #b6aa7a 100%)',
    defaultTintId: 'mint',
    cloth: { background: 'radial-gradient(circle at top, rgba(188,230,172,0.9), rgba(76,130,61,0.95) 65%, rgba(36,67,29,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(91,94,40,1), rgba(45,54,22,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(98,145,62,0.18))', tintable: true },
  },
  {
    id: 'board-library',
    name: 'Library',
    previewColor: '#c79b69',
    boardSurface: 'linear-gradient(180deg, #dfd1bc 0%, #c1a37d 100%)',
    defaultTintId: 'sunbeam',
    cloth: { background: 'radial-gradient(circle at top, rgba(239,221,193,0.92), rgba(133,93,57,0.94) 65%, rgba(66,43,24,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(110,70,39,1), rgba(56,33,17,1))' },
    surfaceOverlay: { background: 'linear-gradient(180deg, rgba(255,251,234,0.14), rgba(108,69,39,0.18))', tintable: true },
  },
  {
    id: 'board-ice',
    name: 'Arctic Ice',
    previewColor: '#8bc8ea',
    boardSurface: 'linear-gradient(180deg, #d8ebf4 0%, #b5d3df 100%)',
    defaultTintId: 'ocean',
    cloth: { background: 'radial-gradient(circle at top, rgba(231,248,255,0.96), rgba(150,204,234,0.95) 62%, rgba(95,136,166,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(115,160,184,1), rgba(68,100,128,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(145,225,255,0.14))', tintable: true, blendMode: 'screen' },
  },
  {
    id: 'board-candy',
    name: 'Candy Land',
    previewColor: '#f59fc6',
    boardSurface: 'linear-gradient(180deg, #f2d4db 0%, #e6b3c8 100%)',
    defaultTintId: 'rose',
    cloth: { background: 'radial-gradient(circle at top, rgba(255,246,229,0.96), rgba(255,190,220,0.9) 55%, rgba(255,144,176,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(255,150,188,1), rgba(211,87,134,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,155,215,0.16))', tintable: true, blendMode: 'screen' },
  },
  {
    id: 'board-pirate',
    name: 'Pirate Map',
    previewColor: '#cfaa6f',
    boardSurface: 'linear-gradient(180deg, #e0cfad 0%, #c7a168 100%)',
    defaultTintId: 'ember',
    cloth: { background: 'radial-gradient(circle at top, rgba(248,229,176,0.92), rgba(165,117,64,0.96) 65%, rgba(90,56,28,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(137,92,43,1), rgba(78,48,22,1))' },
    surfaceOverlay: { background: 'linear-gradient(180deg, rgba(255,247,216,0.18), rgba(148,92,46,0.2))', tintable: true },
  },
  {
    id: 'board-stained-glass',
    name: 'Stained Glass',
    previewColor: '#84b7d8',
    boardSurface: 'linear-gradient(180deg, #e0d6d0 0%, #bba89c 100%)',
    defaultTintId: 'violet',
    cloth: { background: 'radial-gradient(circle at top, rgba(251,239,214,0.9), rgba(118,121,177,0.94) 65%, rgba(58,46,92,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(92,71,56,1), rgba(49,35,26,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,111,111,0.12), rgba(94,174,255,0.12), rgba(255,230,105,0.12))', tintable: true, blendMode: 'screen' },
  },
  {
    id: 'board-deep-space',
    name: 'Deep Space',
    previewColor: '#8a7ce0',
    boardSurface: 'linear-gradient(180deg, #ccd0ea 0%, #8c86c2 100%)',
    defaultTintId: 'violet',
    cloth: { background: 'radial-gradient(circle at top, rgba(89,102,198,0.92), rgba(26,21,64,1) 72%)' },
    frame: { background: 'linear-gradient(145deg, rgba(57,43,99,1), rgba(18,12,38,1))' },
    surfaceOverlay: { background: 'radial-gradient(circle at top left, rgba(255,255,255,0.16), transparent 42%), linear-gradient(135deg, rgba(140,104,255,0.14), rgba(96,240,255,0.12))', tintable: true, blendMode: 'screen' },
  },
];

export function getBoardSkin(id?: string | null) {
  return BOARD_SKINS.find((skin) => skin.id === id) || BOARD_SKINS[0];
}

export function getBoardTintPreset(id?: string | null, boardThemeId?: string | null) {
  const fallback = BOARD_TINT_PRESETS.find((tint) => tint.id === getBoardSkin(boardThemeId).defaultTintId) || BOARD_TINT_PRESETS[0];
  return BOARD_TINT_PRESETS.find((tint) => tint.id === id) || fallback;
}

export function getDefaultBoardTintId(boardThemeId?: string | null) {
  return getBoardSkin(boardThemeId).defaultTintId;
}
