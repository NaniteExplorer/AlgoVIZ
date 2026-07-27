'use client';

import type { ReactNode } from 'react';
import { SideDrawer } from '@/components/ui/Sheet';
import { AppShellProvider, useAppShell } from './AppShellProvider';
import { CommandPalette } from './CommandPalette';
import { ShortcutsDialog } from './ShortcutsDialog';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';

/**
 * The application chrome: top bar, algorithm sidebar, command palette.
 *
 * Layout is a two-column grid whose first track is the `--sidebar-w` custom
 * property, so collapsing the rail is a single variable change that animates
 * instead of a re-render that jumps. Below `lg` the first track disappears
 * entirely and the sidebar becomes an off-canvas drawer.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppShellProvider>
      <AppShellLayout>{children}</AppShellLayout>
    </AppShellProvider>
  );
}

function AppShellLayout({ children }: { children: ReactNode }) {
  const { collapsed, drawerOpen, setDrawerOpen } = useAppShell();

  return (
    <div className="min-h-dvh">
      <TopBar />

      <div className="lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] lg:transition-[grid-template-columns] lg:duration-200">
        <aside className="hidden lg:block">
          <div className="sticky top-12 h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain border-r border-line bg-surface-900/40">
            <SidebarNav collapsed={collapsed} />
          </div>
        </aside>

        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Algorithms">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="text-sm font-semibold text-content-primary">Algorithms</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-content-muted hover:text-content-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Closing on navigate is essential: without it the drawer stays open
              over the page the user just asked for. */}
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </div>
      </SideDrawer>

      <CommandPalette />
      <ShortcutsDialog />
    </div>
  );
}
