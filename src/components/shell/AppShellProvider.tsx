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
import { SIDEBAR_STORAGE_KEY } from '@/components/theme/ThemeScript';

interface AppShellState {
  /** Desktop: sidebar collapsed to an icon rail. */
  collapsed: boolean;
  toggleCollapsed(): void;
  /** Mobile/tablet: off-canvas sidebar drawer. */
  drawerOpen: boolean;
  setDrawerOpen(open: boolean): void;
  /** Command palette. */
  paletteOpen: boolean;
  setPaletteOpen(open: boolean): void;
}

const AppShellContext = createContext<AppShellState | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ThemeScript already stamped `data-sidebar` pre-paint to avoid a layout
  // jump; read it back here so React state agrees with the DOM.
  useEffect(() => {
    setCollapsed(document.documentElement.getAttribute('data-sidebar') === 'collapsed');
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      const root = document.documentElement;
      if (next) root.setAttribute('data-sidebar', 'collapsed');
      else root.removeAttribute('data-sidebar');
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? 'collapsed' : 'expanded');
      } catch {
        /* preference simply won't persist */
      }
      return next;
    });
  }, []);

  // Global ⌘K / Ctrl-K. Registered once at the shell rather than per-page so
  // the shortcut works on every route, including /compare and /learn.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setPaletteOpen((open) => !open);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo<AppShellState>(
    () => ({
      collapsed,
      toggleCollapsed,
      drawerOpen,
      setDrawerOpen,
      paletteOpen,
      setPaletteOpen,
    }),
    [collapsed, toggleCollapsed, drawerOpen, paletteOpen],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell(): AppShellState {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error('useAppShell must be used inside <AppShellProvider>.');
  return ctx;
}
