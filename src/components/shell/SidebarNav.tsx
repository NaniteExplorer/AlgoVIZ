'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ACTIVE_CATEGORIES, algorithmHref, groupsOf, type CatalogEntry } from '@/catalog';
import { cn } from '@/lib/cn';
import { useActiveCategory, useActiveEntry } from './useActiveEntry';

interface Props {
  /** Icon-rail mode: labels hidden, sections always expanded on hover. */
  collapsed?: boolean;
  /** Called after a link is followed — closes the mobile drawer. */
  onNavigate?(): void;
  className?: string;
}

/**
 * The primary algorithm navigation.
 *
 * Replaces the original row of pills, which broke down completely once one
 * family had thirteen entries. A vertical, grouped, collapsible list scales to
 * the ~60 algorithms this platform is heading for and gives every algorithm a
 * stable, linkable home.
 *
 * Keyboard model: ordinary links in ordinary tab order (nothing exotic), plus
 * Up/Down to move between links, Left/Right to collapse/expand a section, and
 * Home/End to jump. Arrow navigation is a convenience layered on top of native
 * behaviour rather than a replacement for it.
 */
export function SidebarNav({ collapsed = false, onNavigate, className }: Props) {
  const baseId = useId();
  const activeEntry = useActiveEntry();
  const activeCategory = useActiveCategory();
  const navRef = useRef<HTMLElement>(null);

  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Auto-expand the family the route is in, without collapsing anything the
  // user opened themselves.
  useEffect(() => {
    if (!activeCategory) return;
    setOpenCategories((prev) => (prev.has(activeCategory) ? prev : new Set(prev).add(activeCategory)));
  }, [activeCategory]);

  const toggle = useCallback((category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const focusables = Array.from(
        navRef.current?.querySelectorAll<HTMLElement>('a[href], button[data-section]') ?? [],
      ).filter((el) => el.offsetParent !== null);
      const index = focusables.indexOf(document.activeElement as HTMLElement);
      if (index < 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusables[(index + 1) % focusables.length]?.focus();
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusables[(index - 1 + focusables.length) % focusables.length]?.focus();
          break;
        case 'Home':
          event.preventDefault();
          focusables[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          focusables[focusables.length - 1]?.focus();
          break;
        default:
          break;
      }
    },
    [],
  );

  const sections = useMemo(
    () =>
      ACTIVE_CATEGORIES.map((info) => ({
        info,
        groups: groupsOf(info.category),
        count: groupsOf(info.category).reduce((n, g) => n + g.entries.length, 0),
      })),
    [],
  );

  return (
    <nav
      ref={navRef}
      aria-label="Algorithms"
      onKeyDown={onKeyDown}
      className={cn('flex flex-col gap-1 py-3', className)}
    >
      {/* Cross-cutting destinations, above the per-family tree. */}
      <ul role="list" className="mb-1 flex flex-col px-2 pb-2">
        <li>
          <ShellLink href="/algorithms" label="All algorithms" collapsed={collapsed} onNavigate={onNavigate}>
            <GridIcon />
          </ShellLink>
        </li>
        <li>
          <ShellLink href="/compare" label="Race two algorithms" collapsed={collapsed} onNavigate={onNavigate}>
            <RaceIcon />
          </ShellLink>
        </li>
        <li>
          <ShellLink href="/learn" label="Guided lessons" collapsed={collapsed} onNavigate={onNavigate}>
            <BookIcon />
          </ShellLink>
        </li>
      </ul>

      {sections.map(({ info, groups, count }) => {
        const open = openCategories.has(info.category);
        const panelId = `${baseId}-${info.category}`;
        return (
          <section key={info.category} className="px-2">
            <h2>
              <button
                type="button"
                data-section
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(info.category)}
                title={collapsed ? info.label : undefined}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                  'text-xs font-semibold uppercase tracking-wider',
                  activeCategory === info.category
                    ? 'text-accent'
                    : 'text-content-muted hover:text-content-secondary',
                )}
              >
                <Chevron open={open} />
                {collapsed ? null : (
                  <>
                    <span className="flex-1 truncate">{info.label}</span>
                    <span className="text-[10px] font-normal tabular-nums text-content-muted">
                      {count}
                    </span>
                  </>
                )}
              </button>
            </h2>

            <div id={panelId} hidden={!open}>
              {groups.map((group) => (
                <div key={group.label ?? '_'}>
                  {group.label && !collapsed ? (
                    <p className="px-3 pb-0.5 pt-2 text-[10px] font-medium uppercase tracking-wide text-content-muted/70">
                      {group.label}
                    </p>
                  ) : null}
                  <ul role="list" className="flex flex-col">
                    {group.entries.map((entry) => (
                      <li key={entry.slug}>
                        <EntryLink
                          entry={entry}
                          active={entry.slug === activeEntry?.slug}
                          collapsed={collapsed}
                          onNavigate={onNavigate}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </nav>
  );
}

function EntryLink({
  entry,
  active,
  collapsed,
  onNavigate,
}: {
  entry: CatalogEntry;
  active: boolean;
  collapsed: boolean;
  onNavigate?(): void;
}) {
  return (
    <Link
      href={algorithmHref(entry)}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      title={collapsed ? entry.name : undefined}
      className={cn(
        'flex min-h-[34px] items-center gap-2.5 rounded-lg px-3 text-[13px] transition-colors',
        active
          ? 'bg-surface-800 font-medium text-content-primary'
          : 'text-content-secondary hover:bg-surface-800/60 hover:text-content-primary',
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: entry.accent }}
      />
      {collapsed ? null : <span className="truncate">{entry.name}</span>}
    </Link>
  );
}

function ShellLink({
  href,
  label,
  collapsed,
  onNavigate,
  children,
}: {
  href: string;
  label: string;
  collapsed: boolean;
  onNavigate?(): void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className="flex min-h-[34px] items-center gap-2.5 rounded-lg px-3 text-[13px] text-content-secondary transition-colors hover:bg-surface-800/60 hover:text-content-primary"
    >
      {children}
      {collapsed ? null : <span className="truncate">{label}</span>}
    </Link>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function RaceIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0">
      <path strokeLinecap="round" d="M4 7h9M4 12h14M4 17h6" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h4.5a1.5 1.5 0 0 0 1.5-1.5Z" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={cn('h-3 w-3 shrink-0 transition-transform', open && 'rotate-90')}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
    </svg>
  );
}
