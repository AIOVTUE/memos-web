import type { ThemeMode } from './theme.js';

export const MORANDI_PALETTES = [
  { id: 'rose', name: '藕粉', primary: '#DF9193' },
  { id: 'mist', name: '雾蓝', primary: '#9DB4C8' },
  { id: 'sage', name: '鼠尾草', primary: '#A3B19C' },
  { id: 'lavender', name: '薰衣草', primary: '#B0A3BC' },
  { id: 'sand', name: '暖沙', primary: '#C2B4A4' },
  { id: 'bean', name: '豆沙', primary: '#B89A96' },
  { id: 'celadon', name: '青瓷', primary: '#96B5AC' },
  { id: 'smoke', name: '烟紫', primary: '#A99CA8' },
] as const;

export type ColorPaletteId = (typeof MORANDI_PALETTES)[number]['id'];

const STORAGE_KEY = 'memos-color-theme';
const DEFAULT_PALETTE: ColorPaletteId = 'rose';

const COLOR_VAR_KEYS = [
  '--primary',
  '--primary-hover',
  '--primary-light',
  '--primary-soft',
  '--primary-muted',
  '--primary-dark',
  '--primary-gradient',
  '--primary-gradient-hover',
  '--accent',
  '--border',
  '--shadow',
  '--shadow-lg',
  '--focus-ring',
  '--surface',
  '--paper',
  '--sidebar-bg',
  '--primary-a08',
  '--primary-a10',
  '--primary-a12',
  '--primary-a16',
  '--primary-a28',
  '--primary-a35',
  '--primary-a45',
  '--shadow-search',
  '--shadow-search-focus',
  '--shadow-card-hover',
  '--shadow-card-grid-hover',
  '--shadow-code',
  '--theme-accent-start',
  '--theme-accent-end',
  '--card-fade-accent',
] as const;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function mix(hex1: string, hex2: string, weight: number): string {
  const w = Math.max(0, Math.min(1, weight));
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(r1 + (r2 - r1) * w, g1 + (g2 - g1) * w, b1 + (b2 - b1) * w);
}

function darken(hex: string, amount: number): string {
  return mix(hex, '#000000', amount);
}

function lighten(hex: string, amount: number): string {
  return mix(hex, '#ffffff', amount);
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildColorVars(primary: string, mode: ThemeMode): Record<string, string> {
  const primaryDark = darken(primary, 0.28);
  const [dr, dg, db] = hexToRgb(primaryDark);

  const primaryVars = {
    '--primary': primary,
    '--primary-hover': mode === 'light' ? darken(primary, 0.12) : lighten(primary, 0.08),
    '--primary-light': mode === 'light' ? lighten(primary, 0.88) : rgba(primary, 0.16),
    '--primary-soft': mode === 'light' ? lighten(primary, 0.92) : rgba(primary, 0.1),
    '--primary-muted': mode === 'light' ? lighten(primary, 0.72) : rgba(primary, 0.22),
    '--primary-dark': mode === 'light' ? primaryDark : lighten(primary, 0.25),
    '--primary-gradient':
      mode === 'light'
        ? `linear-gradient(135deg, ${lighten(primary, 0.35)}, ${primary})`
        : `linear-gradient(135deg, ${darken(primary, 0.08)}, ${primary})`,
    '--primary-gradient-hover':
      mode === 'light'
        ? `linear-gradient(135deg, ${primary}, ${darken(primary, 0.12)})`
        : `linear-gradient(135deg, ${primary}, ${lighten(primary, 0.08)})`,
    '--accent': mode === 'light' ? mix(primary, '#a89495', 0.35) : mix(primary, '#b5adad', 0.3),
    '--primary-a08': rgba(primary, 0.08),
    '--primary-a10': rgba(primary, 0.1),
    '--primary-a12': rgba(primary, 0.12),
    '--primary-a16': rgba(primary, 0.16),
    '--primary-a28': rgba(primary, 0.28),
    '--primary-a35': rgba(primary, 0.35),
    '--primary-a45': rgba(primary, 0.45),
    '--shadow-search': `0 2px 12px ${rgba(primary, 0.08)}`,
    '--shadow-search-focus': `0 2px 12px ${rgba(primary, 0.16)}`,
    '--shadow-card-hover': `0 8px 24px ${rgba(primary, 0.14)}`,
    '--shadow-card-grid-hover': `0 4px 16px ${rgba(primary, 0.12)}`,
    '--shadow-code': `0 2px 10px ${rgba(primary, 0.08)}`,
    '--theme-accent-start': lighten(primary, 0.88),
    '--theme-accent-end': lighten(primary, 0.85),
    '--card-fade-accent': rgba(lighten(primary, 0.85), 0.95),
  };

  if (mode === 'light') {
    const surface = lighten(primary, 0.97);
    const [sr, sg, sb] = hexToRgb(surface);
    return {
      ...primaryVars,
      '--surface': surface,
      '--paper': lighten(primary, 0.985),
      '--sidebar-bg': `rgba(${sr}, ${sg}, ${sb}, 0.96)`,
      '--border': '#1a1a1a',
      '--shadow': `0 2px 12px rgba(${dr}, ${dg}, ${db}, 0.07)`,
      '--shadow-lg': `0 16px 48px rgba(${dr}, ${dg}, ${db}, 0.12)`,
      '--focus-ring': `0 0 0 3px ${rgba(primary, 0.22)}`,
    };
  }

  return {
    ...primaryVars,
    '--surface': '#1e1e1e',
    '--paper': '#1e1e1e',
    '--sidebar-bg': '#1a1a1a',
    '--border': '#333333',
    '--shadow': 'none',
    '--shadow-lg': '0 12px 32px rgba(0, 0, 0, 0.45)',
    '--focus-ring': `0 0 0 3px ${rgba(primary, 0.28)}`,
    '--shadow-search': 'none',
    '--shadow-search-focus': 'none',
    '--shadow-card-hover': 'none',
    '--shadow-card-grid-hover': 'none',
    '--shadow-code': 'none',
    '--theme-accent-start': mix(primary, '#1e1e1e', 0.82),
    '--theme-accent-end': mix(primary, '#1a1a1a', 0.88),
    '--card-fade-accent': 'rgba(30, 30, 30, 0.95)',
  };
}

export function getPalette(id: ColorPaletteId) {
  return MORANDI_PALETTES.find((p) => p.id === id) ?? MORANDI_PALETTES[0];
}

export function getStoredColorTheme(): ColorPaletteId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && MORANDI_PALETTES.some((p) => p.id === stored)) {
      return stored as ColorPaletteId;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PALETTE;
}

export function applyColorTheme(paletteId: ColorPaletteId, mode: ThemeMode): void {
  const palette = getPalette(paletteId);
  const vars = buildColorVars(palette.primary, mode);
  const root = document.documentElement;

  for (const key of COLOR_VAR_KEYS) {
    root.style.removeProperty(key);
  }

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  root.setAttribute('data-color', paletteId);

  try {
    localStorage.setItem(STORAGE_KEY, paletteId);
  } catch {
    // ignore
  }
}

export function initColorTheme(mode: ThemeMode): ColorPaletteId {
  const paletteId = getStoredColorTheme();
  applyColorTheme(paletteId, mode);
  return paletteId;
}

export function clearColorThemeOverrides(): void {
  const root = document.documentElement;
  for (const key of COLOR_VAR_KEYS) {
    root.style.removeProperty(key);
  }
  root.removeAttribute('data-color');
}
