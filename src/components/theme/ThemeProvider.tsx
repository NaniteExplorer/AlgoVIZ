'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SCENE_THEMES, type SceneTheme, type ThemeMode } from '@/theme';
import { THEME_STORAGE_KEY } from './ThemeScript';

/** What the user picked. `system` tracks the OS setting live. */
export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ThemePreference;
  /** The mode actually in effect after resolving `system`. */
  resolved: ThemeMode;
  /** Scene palette for the current mode — handed to the renderers. */
  scene: SceneTheme;
  setPreference(preference: ThemePreference): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* private mode — fall through to system */
  }
  return 'system';
}

function systemMode(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start at 'dark' on the server and during the first client render, matching
  // what ThemeScript most commonly applied; the effect below reconciles to the
  // real value on mount. Rendering is not theme-dependent (the class on <html>
  // does the work), so this can never produce a hydration mismatch.
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [resolved, setResolved] = useState<ThemeMode>('dark');

  useEffect(() => {
    const initial = readPreference();
    setPreferenceState(initial);
    setResolved(initial === 'system' ? systemMode() : initial);
  }, []);

  // Follow the OS while the preference is `system`.
  useEffect(() => {
    if (preference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  // Single place the DOM is mutated, so the class and `color-scheme` can never
  // disagree (they drive the chrome and native form controls respectively).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    setResolved(next === 'system' ? systemMode() : next);
    try {
      if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* preference simply won't persist */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, scene: SCENE_THEMES[resolved], setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>.');
  return ctx;
}
