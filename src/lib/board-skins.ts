import type { CSSProperties } from 'react';

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };
type BoardStyleVars = CSSProperties & Record<`--${string}`, string | number | undefined>;

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

export type ResolvedBoardAppearance = {
  skin: BoardSkin;
  boardColor: string;
  previewStyle: CSSProperties;
  boardVars: BoardStyleVars;
};

export const BOARD_TINT_PRESETS: BoardTintPreset[] = [
  { id: 'sunbeam', name: 'Sunbeam', overlay: 'linear-gradient(135deg, rgba(255,201,107,0.38), rgba(255,241,196,0.12))', glow: 'rgba(255,196,84,0.28)', labelTone: 'dark', blendMode: 'soft-light', opacity: 0.95 },
  { id: 'rose', name: 'Rose Glow', overlay: 'linear-gradient(135deg, rgba(255,143,163,0.34), rgba(255,234,214,0.08))', glow: 'rgba(255,120,150,0.2)', labelTone: 'dark', blendMode: 'overlay', opacity: 0.9 },
  { id: 'mint', name: 'Mint Pop', overlay: 'linear-gradient(135deg, rgba(114,235,198,0.28), rgba(238,255,245,0.06))', glow: 'rgba(76,214,170,0.22)', labelTone: 'dark', blendMode: 'soft-light', opacity: 0.92 },
  { id: 'violet', name: 'Violet Glow', overlay: 'linear-gradient(135deg, rgba(157,141,241,0.32), rgba(236,226,255,0.12))', glow: 'rgba(138,114,238,0.24)', labelTone: 'light', blendMode: 'overlay', opacity: 0.95 },
  { id: 'ocean', name: 'Ocean Mist', overlay: 'linear-gradient(135deg, rgba(91,193,255,0.3), rgba(226,247,255,0.08))', glow: 'rgba(88,187,255,0.22)', labelTone: 'dark', blendMode: 'screen', opacity: 0.92 },
  { id: 'ember', name: 'Ember Pop', overlay: 'linear-gradient(135deg, rgba(255,137,79,0.34), rgba(255,228,197,0.08))', glow: 'rgba(255,123,64,0.24)', labelTone: 'light', blendMode: 'multiply', opacity: 0.86 },
];

const LEGACY_BOARD_TINT_COLORS: Record<string, string> = {
  sunbeam: '#FFC96B',
  rose: '#FF8FA3',
  mint: '#72EBC6',
  violet: '#9D8DF1',
  ocean: '#5BC1FF',
  ember: '#FF894F',
};

export const BOARD_SKINS: BoardSkin[] = [
  {
    id: 'board-green',
    name: 'Classic Green',
    previewColor: '#8BBF8D',
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
    previewColor: '#8F6B4F',
    boardSurface: 'linear-gradient(180deg, #d7cab2 0%, #baa07b 100%)',
    defaultTintId: 'ember',
    cloth: { background: 'radial-gradient(circle at top, rgba(214,187,154,0.9), rgba(124,88,58,0.9) 62%, rgba(67,44,29,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(76,46,28,1), rgba(39,23,16,1))' },
    surfaceOverlay: { background: 'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(66,41,21,0.24))', tintable: true },
  },
  {
    id: 'board-zen',
    name: 'Zen Garden',
    previewColor: '#C7C1A4',
    boardSurface: 'linear-gradient(180deg, #e4dbc8 0%, #cfc2aa 100%)',
    defaultTintId: 'mint',
    cloth: { background: 'radial-gradient(circle at top, rgba(235,241,223,0.92), rgba(208,198,178,0.92) 64%, rgba(167,158,136,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(144,120,90,0.98), rgba(95,72,48,1))' },
    surfaceOverlay: { background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.11) 0 6px, rgba(0,0,0,0.03) 6px 12px)', tintable: true, opacity: 0.7 },
  },
  {
    id: 'board-desk',
    name: "Captain's Desk",
    previewColor: '#9A7A57',
    boardSurface: 'linear-gradient(180deg, #dac7ad 0%, #c19c70 100%)',
    defaultTintId: 'sunbeam',
    cloth: { background: 'radial-gradient(circle at top, rgba(240,224,184,0.94), rgba(163,121,77,0.92) 65%, rgba(94,63,38,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(125,84,42,1), rgba(77,49,23,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,246,205,0.16), rgba(137,95,52,0.22))', tintable: true },
  },
  {
    id: 'board-blossom',
    name: 'Cherry Blossom',
    previewColor: '#E2A7B6',
    boardSurface: 'linear-gradient(180deg, #eed9d7 0%, #d5b0b1 100%)',
    defaultTintId: 'rose',
    cloth: { background: 'radial-gradient(circle at top, rgba(255,239,244,0.96), rgba(244,192,210,0.92) 58%, rgba(184,132,151,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(143,92,112,1), rgba(93,55,69,1))' },
    surfaceOverlay: { background: 'radial-gradient(circle at top left, rgba(255,255,255,0.28), transparent 42%)', tintable: true },
  },
  {
    id: 'board-neon',
    name: 'Neon City',
    previewColor: '#6D97FF',
    boardSurface: 'linear-gradient(180deg, #cad0e4 0%, #8a95b9 100%)',
    defaultTintId: 'violet',
    cloth: { background: 'radial-gradient(circle at top, rgba(38,54,93,0.92), rgba(17,21,45,1) 72%)' },
    frame: { background: 'linear-gradient(145deg, rgba(39,45,94,1), rgba(12,14,36,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(130,108,255,0.22), rgba(64,231,255,0.14))', tintable: true, blendMode: 'screen' },
  },
  {
    id: 'board-blueprint',
    name: 'Blueprint',
    previewColor: '#75A7DA',
    boardSurface: 'linear-gradient(180deg, #d2dde9 0%, #9eb3c8 100%)',
    defaultTintId: 'ocean',
    cloth: { background: 'radial-gradient(circle at top, rgba(191,219,255,0.92), rgba(85,123,170,0.96) 70%, rgba(39,74,124,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(53,89,140,1), rgba(26,52,84,1))' },
    surfaceOverlay: { background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.11) 0 10px, transparent 10px 20px), repeating-linear-gradient(90deg, rgba(255,255,255,0.11) 0 10px, transparent 10px 20px)', tintable: true, opacity: 0.65 },
  },
  {
    id: 'board-jungle',
    name: 'Jungle',
    previewColor: '#87B56D',
    boardSurface: 'linear-gradient(180deg, #d7d0b6 0%, #b6aa7a 100%)',
    defaultTintId: 'mint',
    cloth: { background: 'radial-gradient(circle at top, rgba(188,230,172,0.9), rgba(76,130,61,0.95) 65%, rgba(36,67,29,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(91,94,40,1), rgba(45,54,22,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(98,145,62,0.18))', tintable: true },
  },
  {
    id: 'board-library',
    name: 'Library',
    previewColor: '#C79B69',
    boardSurface: 'linear-gradient(180deg, #dfd1bc 0%, #c1a37d 100%)',
    defaultTintId: 'sunbeam',
    cloth: { background: 'radial-gradient(circle at top, rgba(239,221,193,0.92), rgba(133,93,57,0.94) 65%, rgba(66,43,24,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(110,70,39,1), rgba(56,33,17,1))' },
    surfaceOverlay: { background: 'linear-gradient(180deg, rgba(255,251,234,0.14), rgba(108,69,39,0.18))', tintable: true },
  },
  {
    id: 'board-ice',
    name: 'Arctic Ice',
    previewColor: '#8BC8EA',
    boardSurface: 'linear-gradient(180deg, #d8ebf4 0%, #b5d3df 100%)',
    defaultTintId: 'ocean',
    cloth: { background: 'radial-gradient(circle at top, rgba(231,248,255,0.96), rgba(150,204,234,0.95) 62%, rgba(95,136,166,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(115,160,184,1), rgba(68,100,128,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(145,225,255,0.14))', tintable: true, blendMode: 'screen' },
  },
  {
    id: 'board-candy',
    name: 'Candy Land',
    previewColor: '#F59FC6',
    boardSurface: 'linear-gradient(180deg, #f2d4db 0%, #e6b3c8 100%)',
    defaultTintId: 'rose',
    cloth: { background: 'radial-gradient(circle at top, rgba(255,246,229,0.96), rgba(255,190,220,0.9) 55%, rgba(255,144,176,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(255,150,188,1), rgba(211,87,134,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,155,215,0.16))', tintable: true, blendMode: 'screen' },
  },
  {
    id: 'board-pirate',
    name: 'Pirate Map',
    previewColor: '#CFAA6F',
    boardSurface: 'linear-gradient(180deg, #e0cfad 0%, #c7a168 100%)',
    defaultTintId: 'ember',
    cloth: { background: 'radial-gradient(circle at top, rgba(248,229,176,0.92), rgba(165,117,64,0.96) 65%, rgba(90,56,28,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(137,92,43,1), rgba(78,48,22,1))' },
    surfaceOverlay: { background: 'linear-gradient(180deg, rgba(255,247,216,0.18), rgba(148,92,46,0.2))', tintable: true },
  },
  {
    id: 'board-stained-glass',
    name: 'Stained Glass',
    previewColor: '#84B7D8',
    boardSurface: 'linear-gradient(180deg, #e0d6d0 0%, #bba89c 100%)',
    defaultTintId: 'violet',
    cloth: { background: 'radial-gradient(circle at top, rgba(251,239,214,0.9), rgba(118,121,177,0.94) 65%, rgba(58,46,92,1))' },
    frame: { background: 'linear-gradient(145deg, rgba(92,71,56,1), rgba(49,35,26,1))' },
    surfaceOverlay: { background: 'linear-gradient(135deg, rgba(255,111,111,0.12), rgba(94,174,255,0.12), rgba(255,230,105,0.12))', tintable: true, blendMode: 'screen' },
  },
  {
    id: 'board-deep-space',
    name: 'Deep Space',
    previewColor: '#8A7CE0',
    boardSurface: 'linear-gradient(180deg, #ccd0ea 0%, #8c86c2 100%)',
    defaultTintId: 'violet',
    cloth: { background: 'radial-gradient(circle at top, rgba(89,102,198,0.92), rgba(26,21,64,1) 72%)' },
    frame: { background: 'linear-gradient(145deg, rgba(57,43,99,1), rgba(18,12,38,1))' },
    surfaceOverlay: { background: 'radial-gradient(circle at top left, rgba(255,255,255,0.16), transparent 42%), linear-gradient(135deg, rgba(140,104,255,0.14), rgba(96,240,255,0.12))', tintable: true, blendMode: 'screen' },
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wrapHue(value: number) {
  const hue = value % 360;
  return hue < 0 ? hue + 360 : hue;
}

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RGB) {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    switch (max) {
      case red:
        hue = ((green - blue) / delta) % 6;
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }
  }

  return {
    h: wrapHue(hue * 60),
    s: saturation * 100,
    l: lightness * 100,
  };
}

function hueToChannel(p: number, q: number, t: number) {
  let next = t;
  if (next < 0) next += 1;
  if (next > 1) next -= 1;
  if (next < 1 / 6) return p + (q - p) * 6 * next;
  if (next < 1 / 2) return q;
  if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
  return p;
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const hue = wrapHue(h) / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  if (saturation === 0) {
    const gray = Math.round(lightness * 255);
    return { r: gray, g: gray, b: gray };
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: Math.round(hueToChannel(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToChannel(p, q, hue) * 255),
    b: Math.round(hueToChannel(p, q, hue - 1 / 3) * 255),
  };
}

function hslString(hsl: HSL, alpha = 1) {
  return `hsla(${Math.round(wrapHue(hsl.h))}, ${Math.round(clamp(hsl.s, 0, 100))}%, ${Math.round(clamp(hsl.l, 0, 100))}%, ${alpha})`;
}

function rgbString(rgb: RGB, alpha = 1) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function shiftColor(base: HSL, delta: Partial<HSL>) {
  return {
    h: wrapHue(base.h + (delta.h || 0)),
    s: clamp(base.s + (delta.s || 0), 0, 100),
    l: clamp(base.l + (delta.l || 0), 0, 100),
  };
}

function getReadableLabelColor(color: HSL) {
  return color.l < 58 ? 'rgba(255,255,255,0.98)' : 'rgba(15,23,42,0.92)';
}

function createCellGradient(base: HSL, hueOffset: number, topLightness: number, bottomLightness: number, saturationBoost = 26) {
  const hue = wrapHue(base.h + hueOffset);
  const saturation = clamp(base.s + saturationBoost, 34, 90);
  const from = { h: hue, s: saturation, l: topLightness };
  const via = { h: hue, s: saturation, l: (topLightness + bottomLightness) / 2 };
  const to = { h: hue, s: saturation, l: bottomLightness };
  const ring = rgbString(hslToRgb(shiftColor(to, { l: -15 })), 0.34);

  return {
    background: `linear-gradient(135deg, ${hslString(from)} 0%, ${hslString(via)} 58%, ${hslString(to)} 100%)`,
    text: getReadableLabelColor(to),
    ring,
  };
}

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

export function normalizeBoardColor(value?: string | null) {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return null;
  const normalized = raw.startsWith('#') ? raw : `#${raw}`;
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export function getDefaultBoardColor(boardThemeId?: string | null) {
  return normalizeBoardColor(getBoardSkin(boardThemeId).previewColor) || '#8BBF8D';
}

export function getLegacyBoardTintColor(boardTintId?: string | null, boardThemeId?: string | null) {
  return normalizeBoardColor(LEGACY_BOARD_TINT_COLORS[boardTintId || '']) || getDefaultBoardColor(boardThemeId);
}

export function resolveBoardColor(boardThemeId?: string | null, boardColor?: string | null, boardTintId?: string | null) {
  return normalizeBoardColor(boardColor) || getLegacyBoardTintColor(boardTintId, boardThemeId);
}

export function resolveBoardAppearance(boardThemeId?: string | null, boardColor?: string | null, boardTintId?: string | null): ResolvedBoardAppearance {
  const skin = getBoardSkin(boardThemeId);
  const resolvedColor = resolveBoardColor(skin.id, boardColor, boardTintId);
  const accent = rgbToHsl(hexToRgb(resolvedColor));
  const accentRgb = hslToRgb(accent);

  const neutralTop = shiftColor(accent, { s: -accent.s * 0.62, l: 30 });
  const neutralBottom = shiftColor(accent, { s: -accent.s * 0.56, l: 16 });

  const dl = {
    background: 'linear-gradient(180deg, #c7f0ff 0%, #7dd3fc 100%)',
    text: '#0a3557',
    ring: 'rgba(14, 116, 144, 0.42)',
    shadow: '0 1px 0 rgba(255,255,255,0.88), 0 0 9px rgba(255,255,255,0.34)',
  };
  const tl = {
    background: 'linear-gradient(180deg, #93dcff 0%, #2563eb 100%)',
    text: '#f8fbff',
    ring: 'rgba(30, 64, 175, 0.48)',
    shadow: '0 1px 0 rgba(15,23,42,0.68), 0 0 9px rgba(15,23,42,0.34)',
  };
  const dw = {
    background: 'linear-gradient(180deg, #ffd3ea 0%, #fb7185 100%)',
    text: '#5f102b',
    ring: 'rgba(190, 24, 93, 0.4)',
    shadow: '0 1px 0 rgba(255,255,255,0.82), 0 0 9px rgba(255,255,255,0.3)',
  };
  const tw = {
    background: 'linear-gradient(180deg, #ffb4b4 0%, #dc2626 100%)',
    text: '#fffdfd',
    ring: 'rgba(127, 29, 29, 0.48)',
    shadow: '0 1px 0 rgba(69,10,10,0.76), 0 0 10px rgba(69,10,10,0.34)',
  };
  const start = {
    background: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)',
    text: '#78350f',
    ring: 'rgba(180, 83, 9, 0.44)',
    shadow: '0 1px 0 rgba(255,255,255,0.82), 0 0 8px rgba(255,244,214,0.34)',
  };

  const previewStyle: CSSProperties = {
    background: `linear-gradient(145deg, ${hslString(shiftColor(accent, { s: -18, l: 18 }))} 0%, ${resolvedColor} 55%, ${hslString(shiftColor(accent, { s: -8, l: -10 }))} 100%)`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 16px 28px ${rgbString(accentRgb, 0.28)}`,
  };

  const boardVars: BoardStyleVars = {
    '--board-accent': resolvedColor,
    '--board-accent-rgb': `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
    '--board-frame-glow': rgbString(accentRgb, 0.28),
    '--board-cloth-tint': `radial-gradient(circle at top, ${rgbString(accentRgb, 0.34)}, transparent 62%)`,
    '--board-frame-tint': `linear-gradient(145deg, ${rgbString(accentRgb, 0.24)}, ${rgbString(accentRgb, 0.04)})`,
    '--board-surface-tint': `linear-gradient(135deg, ${rgbString(accentRgb, 0.18)}, ${rgbString(accentRgb, 0.07)} 42%, ${rgbString(hslToRgb(shiftColor(accent, { l: -20 })), 0.2)} 100%)`,
    '--board-grid-bg': rgbString(hslToRgb(shiftColor(accent, { s: -accent.s * 0.36, l: -18 })), 0.74),
    '--board-cell-base': `linear-gradient(180deg, ${hslString(neutralTop)} 0%, ${hslString(neutralBottom)} 100%)`,
    '--board-cell-border': rgbString(hslToRgb(shiftColor(accent, { s: -accent.s * 0.28, l: -24 })), 0.38),
    '--board-cell-label': getReadableLabelColor(neutralBottom),
    '--board-cell-dl-bg': dl.background,
    '--board-cell-dl-text': dl.text,
    '--board-cell-dl-ring': dl.ring,
    '--board-cell-dl-shadow': dl.shadow,
    '--board-cell-tl-bg': tl.background,
    '--board-cell-tl-text': tl.text,
    '--board-cell-tl-ring': tl.ring,
    '--board-cell-tl-shadow': tl.shadow,
    '--board-cell-dw-bg': dw.background,
    '--board-cell-dw-text': dw.text,
    '--board-cell-dw-ring': dw.ring,
    '--board-cell-dw-shadow': dw.shadow,
    '--board-cell-tw-bg': tw.background,
    '--board-cell-tw-text': tw.text,
    '--board-cell-tw-ring': tw.ring,
    '--board-cell-tw-shadow': tw.shadow,
    '--board-cell-start-bg': start.background,
    '--board-cell-start-text': start.text,
    '--board-cell-start-ring': start.ring,
    '--board-cell-start-shadow': start.shadow,
  };

  return {
    skin,
    boardColor: resolvedColor,
    previewStyle,
    boardVars,
  };
}

export function hsvToHex(hue: number, saturation: number, value: number) {
  const normalizedHue = wrapHue(hue);
  const clampedSaturation = clamp(saturation, 0, 1);
  const clampedValue = clamp(value, 0, 1);
  const chroma = clampedValue * clampedSaturation;
  const intermediate = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const match = clampedValue - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (normalizedHue < 60) {
    red = chroma;
    green = intermediate;
  } else if (normalizedHue < 120) {
    red = intermediate;
    green = chroma;
  } else if (normalizedHue < 180) {
    green = chroma;
    blue = intermediate;
  } else if (normalizedHue < 240) {
    green = intermediate;
    blue = chroma;
  } else if (normalizedHue < 300) {
    red = intermediate;
    blue = chroma;
  } else {
    red = chroma;
    blue = intermediate;
  }

  return rgbToHex({
    r: (red + match) * 255,
    g: (green + match) * 255,
    b: (blue + match) * 255,
  });
}

export function hexToHsv(hex: string) {
  const rgb = hexToRgb(resolveBoardColor('board-green', hex, null));
  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    switch (max) {
      case red:
        hue = ((green - blue) / delta) % 6;
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }
    hue *= 60;
  }

  return {
    h: wrapHue(hue),
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}
