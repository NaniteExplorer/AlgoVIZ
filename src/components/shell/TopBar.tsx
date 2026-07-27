'use client';

import Link from 'next/link';
import { catalogCategory } from '@/catalog';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { IconButton } from '@/components/ui/IconButton';
import { Kbd } from '@/components/ui/Kbd';
import type { AlgorithmCategory } from '@/core/algorithms';
import { useAppShell } from './AppShellProvider';
import { useActiveCategory, useActiveEntry } from './useActiveEntry';

/**
 * Persistent 48px application bar: brand, breadcrumb, search trigger, theme.
 *
 * Kept deliberately short — on a phone the stage already competes with the URL
 * bar and the bottom sheet for vertical space, and every pixel of permanent
 * chrome comes straight out of the visualization.
 */
export function TopBar() {
  const { setDrawerOpen, setPaletteOpen, toggleCollapsed, collapsed } = useAppShell();
  const entry = useActiveEntry();
  const category = useActiveCategory();
  const categoryInfo = category ? safeCategory(category) : undefined;

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-1 border-b border-line bg-surface-950/85 px-2 backdrop-blur-xl sm:px-3">
      <IconButton
        label="Open navigation"
        className="lg:hidden"
        size="sm"
        onClick={() => setDrawerOpen(true)}
      >
        <MenuIcon />
      </IconButton>
      <IconButton
        label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden lg:inline-flex"
        size="sm"
        onClick={toggleCollapsed}
      >
        <MenuIcon />
      </IconButton>

      <Link href="/" className="ml-1 flex shrink-0 items-center gap-2">
        <BrandMark />
        <span className="hidden text-sm font-semibold tracking-tight text-content-primary sm:inline">
          AlgoViz
        </span>
      </Link>

      {/* Breadcrumb collapses to just the algorithm name on narrow screens —
          the family is already implied by the sidebar's active section. */}
      <nav aria-label="Breadcrumb" className="ml-2 flex min-w-0 items-center gap-1.5 text-xs">
        {categoryInfo ? (
          <>
            <span aria-hidden className="text-content-muted">
              /
            </span>
            <Link
              href={`/algorithms/${categoryInfo.category}`}
              className="hidden truncate text-content-muted hover:text-content-secondary md:inline"
            >
              {categoryInfo.label}
            </Link>
          </>
        ) : null}
        {entry ? (
          <>
            <span aria-hidden className="hidden text-content-muted md:inline">
              /
            </span>
            <span aria-current="page" className="truncate font-medium text-content-primary">
              {entry.name}
            </span>
          </>
        ) : null}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden h-8 items-center gap-2 rounded-lg border border-line bg-surface-900 px-2.5 text-xs text-content-muted transition-colors hover:border-line-strong hover:text-content-secondary sm:flex"
        >
          <SearchIcon />
          <span>Search</span>
          <Kbd>⌘K</Kbd>
        </button>
        <IconButton
          label="Search algorithms"
          size="sm"
          className="sm:hidden"
          onClick={() => setPaletteOpen(true)}
        >
          <SearchIcon />
        </IconButton>
        <ThemeToggle />
      </div>
    </header>
  );
}

/**
 * The category segment comes from the URL and may be anything a user typed, so
 * a miss must render as "no breadcrumb" rather than throwing during render.
 */
function safeCategory(category: string) {
  try {
    return catalogCategory(category as AlgorithmCategory);
  } catch {
    return undefined;
  }
}

function MenuIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="rgb(var(--c-surface-800))" />
      <rect x="13" y="36" width="8" height="15" rx="2" fill="rgb(var(--c-accent))" />
      <rect x="28" y="26" width="8" height="25" rx="2" fill="rgb(var(--c-accent-glow))" />
      <rect x="43" y="14" width="8" height="37" rx="2" fill="rgb(var(--c-accent-violet))" />
    </svg>
  );
}
