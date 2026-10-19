/**
 * Material You accent theme manager.
 * The active theme is stored in localStorage and applied as
 * <html data-theme="..."> which swaps the --accent-* CSS variables.
 */

export const THEMES = [
  { id: 'mint', label: 'Mint', color: '#A8E8BC' },
  { id: 'sky', label: 'Sky Blue', color: '#A8C7FA' },
  { id: 'lavender', label: 'Lavender', color: '#D0BCFF' },
  { id: 'coral', label: 'Coral Pink', color: '#FFB4AB' },
  { id: 'gold', label: 'Warm Gold', color: '#FDE293' },
];

const STORAGE_KEY = 'quizforge_theme';

export function getTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.some((t) => t.id === saved) ? saved : 'mint';
  } catch {
    return 'mint';
  }
}

export function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch (err) {
    console.debug('Failed to save theme:', err);
  }
}

export function initTheme() {
  document.documentElement.setAttribute('data-theme', getTheme());
}

/** Current accent color as a hex string (for canvas-based effects). */
export function getAccentColor() {
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#A8E8BC'
  );
}
