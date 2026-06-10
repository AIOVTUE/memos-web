import { applyColorTheme, getPalette, getStoredColorTheme, type ColorPaletteId } from './colorTheme.js';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'memos-theme';

export function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // ignore
  }
  return 'light';
}

export function applyTheme(theme: ThemeMode, colorId?: ColorPaletteId): void {
  document.documentElement.setAttribute('data-theme', theme);
  const paletteId = colorId ?? getStoredColorTheme();
  applyColorTheme(paletteId, theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const palette = getPalette(paletteId);
    meta.setAttribute('content', theme === 'dark' ? '#121212' : palette.primary);
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export function initTheme(): ThemeMode {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
