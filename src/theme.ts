import { CellRole } from './core/model/ArrayModel';

/**
 * Single source of truth for colour. The React chrome reads hex values through
 * Tailwind tokens; the WebGL layer reads the same hexes here so the 2D UI and
 * the 3D scene never drift apart. Each role carries an emissive intensity so
 * "active" cells genuinely glow under the bloom pass.
 */
export interface RoleStyle {
  /** Base/emissive colour as a hex string. */
  color: string;
  /** Emissive intensity (0 = matte, 1 = strong bloom). */
  emissive: number;
}

const DARK_ROLE_STYLES: Record<CellRole, RoleStyle> = {
  [CellRole.Default]: { color: '#3b5bdb', emissive: 0.12 },
  [CellRole.Comparing]: { color: '#22d3ee', emissive: 0.7 },
  [CellRole.Swapping]: { color: '#fb7185', emissive: 0.85 },
  [CellRole.Writing]: { color: '#a78bfa', emissive: 0.75 },
  [CellRole.Pivot]: { color: '#f472b6', emissive: 0.9 },
  [CellRole.Min]: { color: '#38bdf8', emissive: 0.7 },
  [CellRole.Key]: { color: '#fbbf24', emissive: 0.8 },
  [CellRole.Sorted]: { color: '#34d399', emissive: 0.55 },
};

/**
 * Light-mode roles: same hues, darker and far less emissive.
 *
 * A neon that glows beautifully against black turns into a pale, low-contrast
 * smear on a light floor, and a strong emissive under a bright ambient just
 * blows out to white. Dropping lightness and cutting emissive to roughly a
 * quarter keeps each role distinguishable in both themes.
 */
const LIGHT_ROLE_STYLES: Record<CellRole, RoleStyle> = {
  [CellRole.Default]: { color: '#3949ab', emissive: 0.04 },
  [CellRole.Comparing]: { color: '#0e7490', emissive: 0.2 },
  [CellRole.Swapping]: { color: '#be123c', emissive: 0.24 },
  [CellRole.Writing]: { color: '#6d28d9', emissive: 0.22 },
  [CellRole.Pivot]: { color: '#be185d', emissive: 0.26 },
  [CellRole.Min]: { color: '#0369a1', emissive: 0.2 },
  [CellRole.Key]: { color: '#b45309', emissive: 0.24 },
  [CellRole.Sorted]: { color: '#047857', emissive: 0.16 },
};

const ROLE_STYLE_THEMES: Record<ThemeMode, Record<CellRole, RoleStyle>> = {
  dark: DARK_ROLE_STYLES,
  light: LIGHT_ROLE_STYLES,
};

/** Role palette for a given mode. Visualizers read this each frame. */
export function roleStyles(mode: ThemeMode): Record<CellRole, RoleStyle> {
  return ROLE_STYLE_THEMES[mode];
}

/**
 * Default role palette.
 *
 * Kept for call sites that are theme-agnostic (the legend derives its labels
 * from it). Renderers should call {@link roleStyles} instead.
 */
export const ROLE_STYLES = DARK_ROLE_STYLES;

/** Human-readable labels for the on-screen legend. */
export const ROLE_LABELS: Partial<Record<CellRole, string>> = {
  [CellRole.Default]: 'Unsorted',
  [CellRole.Comparing]: 'Comparing',
  [CellRole.Swapping]: 'Swapping',
  [CellRole.Writing]: 'Writing',
  [CellRole.Pivot]: 'Pivot',
  [CellRole.Min]: 'Minimum',
  [CellRole.Key]: 'Key',
  [CellRole.Sorted]: 'Sorted',
};

/** Which of the two app themes a scene should render in. */
export type ThemeMode = 'light' | 'dark';

/**
 * Scene-wide palette for backgrounds, lights and the hero.
 *
 * Exposed as a value object per mode (rather than frozen module constants) so
 * the WebGL layer can follow the app's light/dark toggle at runtime via
 * `engine.setTheme()` — remounting the whole GPU stack on a theme switch would
 * be both slow and visibly jarring.
 */
export interface SceneTheme {
  /** Which palette this is — lets renderers look up matching sub-palettes. */
  mode: ThemeMode;
  background: string;
  fog: string;
  floor: string;
  grid: string;
  rimLight: string;
  keyLight: string;
  /** Ambient light intensity — light mode needs more to avoid muddy shadows. */
  ambientIntensity: number;
  /** Multiplier applied to each family's configured bloom strength. */
  bloomScale: number;
  hero: {
    nodeCore: string;
    nodeWarm: string;
    link: string;
  };
}

export const SCENE_THEMES: Record<ThemeMode, SceneTheme> = {
  dark: {
    mode: 'dark',
    background: '#05060a',
    fog: '#070912',
    floor: '#0a0d1a',
    grid: '#1b2240',
    rimLight: '#67e8f9',
    keyLight: '#ffffff',
    ambientIntensity: 0.35,
    bloomScale: 1,
    hero: {
      nodeCore: '#22d3ee',
      nodeWarm: '#a78bfa',
      link: '#1e3a8a',
    },
  },
  light: {
    mode: 'light',
    background: '#f5f6fa',
    fog: '#eef0f6',
    floor: '#e8ebf3',
    grid: '#cdd4e4',
    rimLight: '#0891b2',
    keyLight: '#ffffff',
    // A light floor bounces far less than a dark one, so lift the ambient.
    ambientIntensity: 0.72,
    // Bloom on a bright backdrop reads as a blown-out haze, not as neon.
    bloomScale: 0.3,
    hero: {
      nodeCore: '#0891b2',
      nodeWarm: '#7c3aed',
      link: '#94a3b8',
    },
  },
};

/**
 * Default scene palette.
 *
 * Retained so existing call sites keep working; new code should take a
 * {@link SceneTheme} so it can follow the active mode.
 */
export const SCENE = SCENE_THEMES.dark;
