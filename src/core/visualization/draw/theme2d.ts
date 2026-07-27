import { SCENE } from '@/theme';

/**
 * Colour tokens the 2D families draw with.
 *
 * Deliberately a *value object* rather than module-level constants: the app
 * gains a light theme, and 2D visualizers must be able to re-read their palette
 * without remounting. Families take a `Canvas2DTheme` and never reach for a
 * global.
 */
export interface Canvas2DTheme {
  /** Canvas backdrop. */
  background: string;
  /** Panel/track surfaces drawn on top of the backdrop. */
  surface: string;
  /** Hairlines: grid rules, cell borders, inactive edges. */
  line: string;
  /** Stronger dividers: axis rules, section separators. */
  lineStrong: string;
  /** Primary text. */
  text: string;
  /** Secondary text — axis labels, captions. */
  textMuted: string;
  /** Brand accent for the active element. */
  accent: string;
  /** Multiplier for {@link withGlow}/{@link halo}; 0 disables neon entirely. */
  glow: number;
}

export const DARK_2D: Canvas2DTheme = {
  background: SCENE.background,
  surface: '#111420',
  line: '#1f2537',
  lineStrong: '#2b3450',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  accent: '#22d3ee',
  glow: 1,
};

export const LIGHT_2D: Canvas2DTheme = {
  background: '#f7f8fb',
  surface: '#ffffff',
  line: '#e2e5ee',
  lineStrong: '#cbd0de',
  text: '#0f121c',
  textMuted: '#5a6478',
  accent: '#0891b2',
  // No bloom on a light surface — the WebGL side drops bloom strength here too.
  glow: 0,
};

export type ThemeMode = 'light' | 'dark';

export const CANVAS_THEMES: Record<ThemeMode, Canvas2DTheme> = {
  dark: DARK_2D,
  light: LIGHT_2D,
};

export function canvasTheme(mode: ThemeMode): Canvas2DTheme {
  return CANVAS_THEMES[mode];
}
