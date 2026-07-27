'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { algorithmHref, searchCatalog, getEntryBySlug, CATALOG, type CatalogEntry } from '@/catalog';
import { Dialog } from '@/components/ui/Dialog';
import { Kbd } from '@/components/ui/Kbd';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/cn';
import { useAppShell } from './AppShellProvider';

const RECENTS_KEY = 'algoviz-recents';
const MAX_RECENTS = 5;

interface Action {
  id: string;
  label: string;
  hint?: string;
  run(): void;
}

interface Row {
  key: string;
  label: string;
  hint?: string;
  accent?: string;
  run(): void;
}

/**
 * ⌘K jump-to-anything.
 *
 * With a sidebar this deep, the palette is what keeps navigation to one
 * keystroke — you should never have to expand three sections to reach Kruskal.
 * It also hosts the handful of global actions (theme, compare) that would
 * otherwise each need their own piece of permanent chrome.
 */
export function CommandPalette() {
  const router = useRouter();
  const { paletteOpen, setPaletteOpen } = useAppShell();
  const { resolved, setPreference } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    if (!paletteOpen) return;
    // Reset each time it opens: a stale query from three minutes ago is never
    // what the user wants to see.
    setQuery('');
    setHighlighted(0);
    setRecents(readRecents());
  }, [paletteOpen]);

  const remember = useCallback((slug: string) => {
    const next = [slug, ...readRecents().filter((s) => s !== slug)].slice(0, MAX_RECENTS);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      /* history simply won't persist */
    }
  }, []);

  const go = useCallback(
    (entry: CatalogEntry) => {
      remember(entry.slug);
      setPaletteOpen(false);
      router.push(algorithmHref(entry));
    },
    [remember, router, setPaletteOpen],
  );

  const actions = useMemo<Action[]>(
    () => [
      {
        id: 'theme',
        label: `Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`,
        hint: 'Theme',
        run: () => setPreference(resolved === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'compare',
        label: 'Compare two algorithms side by side',
        hint: 'Race',
        run: () => router.push('/compare'),
      },
      {
        id: 'catalog',
        label: 'Browse the full algorithm catalog',
        hint: 'Catalog',
        run: () => router.push('/algorithms'),
      },
    ],
    [resolved, setPreference, router],
  );

  const sections = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      const recentEntries = recents
        .map(getEntryBySlug)
        .filter((e): e is CatalogEntry => Boolean(e));
      return [
        recentEntries.length
          ? { title: 'Recent', rows: recentEntries.map((e) => entryRow(e, go)) }
          : { title: 'Start here', rows: CATALOG.slice(0, 6).map((e) => entryRow(e, go)) },
        { title: 'Actions', rows: actions.map((a) => actionRow(a, setPaletteOpen)) },
      ];
    }

    const hits = searchCatalog(trimmed);
    const q = trimmed.toLowerCase();
    const matchedActions = actions.filter((a) => a.label.toLowerCase().includes(q));
    return [
      hits.length ? { title: 'Algorithms', rows: hits.map((h) => entryRow(h.entry, go)) } : null,
      matchedActions.length
        ? { title: 'Actions', rows: matchedActions.map((a) => actionRow(a, setPaletteOpen)) }
        : null,
    ].filter(Boolean) as { title: string; rows: Row[] }[];
  }, [query, recents, actions, go, setPaletteOpen]);

  const flatRows = useMemo(() => sections.flatMap((s) => s.rows), [sections]);

  // Clamp rather than reset: as the user types, keeping the highlight near the
  // top is right, but blowing it away on every keystroke fights arrow keys.
  useEffect(() => {
    setHighlighted((current) => Math.min(current, Math.max(0, flatRows.length - 1)));
  }, [flatRows.length]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${highlighted}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((i) => (i + 1) % Math.max(1, flatRows.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((i) => (i - 1 + flatRows.length) % Math.max(1, flatRows.length));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      flatRows[highlighted]?.run();
    }
  };

  let cursor = -1;

  return (
    <Dialog
      open={paletteOpen}
      onClose={() => setPaletteOpen(false)}
      title="Search algorithms and actions"
      hideTitle
      initialFocus={inputRef}
      className="max-w-lg"
    >
      <div className="flex items-center gap-2 border-b border-line px-4">
        <SearchIcon />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded
          aria-controls="algoviz-palette-list"
          aria-activedescendant={flatRows.length ? `algoviz-palette-row-${highlighted}` : undefined}
          aria-label="Search algorithms and actions"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search algorithms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          className="h-12 flex-1 bg-transparent text-sm text-content-primary outline-none placeholder:text-content-muted"
        />
        <Kbd>Esc</Kbd>
      </div>

      <ul
        ref={listRef}
        id="algoviz-palette-list"
        role="listbox"
        aria-label="Results"
        className="min-h-0 flex-1 overflow-y-auto p-2"
      >
        {flatRows.length === 0 ? (
          <li className="px-3 py-8 text-center text-sm text-content-muted">
            Nothing matches “{query}”.
          </li>
        ) : (
          sections.map((section) => (
            <li key={section.title}>
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
                {section.title}
              </p>
              <ul role="group">
                {section.rows.map((row) => {
                  cursor += 1;
                  const index = cursor;
                  const active = index === highlighted;
                  return (
                    <li
                      key={row.key}
                      id={`algoviz-palette-row-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlighted(index)}
                      onClick={row.run}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm',
                        active ? 'bg-surface-800 text-content-primary' : 'text-content-secondary',
                      )}
                    >
                      {row.accent ? (
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: row.accent }}
                        />
                      ) : (
                        <span aria-hidden className="h-1.5 w-1.5 shrink-0" />
                      )}
                      <span className="flex-1 truncate">{row.label}</span>
                      {row.hint ? (
                        <span className="shrink-0 text-[11px] text-content-muted">{row.hint}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))
        )}
      </ul>
    </Dialog>
  );
}

function entryRow(entry: CatalogEntry, go: (entry: CatalogEntry) => void): Row {
  return {
    key: `entry:${entry.slug}`,
    label: entry.name,
    hint: entry.group ?? entry.category,
    accent: entry.accent,
    run: () => go(entry),
  };
}

function actionRow(action: Action, close: (open: boolean) => void): Row {
  return {
    key: `action:${action.id}`,
    label: action.label,
    hint: action.hint,
    run: () => {
      close(false);
      action.run();
    },
  };
}

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 shrink-0 text-content-muted"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}
