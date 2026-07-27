'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Kbd } from '@/components/ui/Kbd';

const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ['⌘K', 'Ctrl K'], description: 'Search algorithms and actions' },
  { keys: ['Space'], description: 'Play or pause' },
  { keys: ['→', '.'], description: 'Step forward' },
  { keys: ['←', ','], description: 'Step back' },
  { keys: ['Home'], description: 'Jump to the start' },
  { keys: ['End'], description: 'Jump to the end' },
  { keys: ['↑', '↓'], description: 'Move through the sidebar' },
  { keys: ['?'], description: 'Show this list' },
  { keys: ['Esc'], description: 'Close a dialog or sheet' },
];

/**
 * Discoverability for the keyboard transport.
 *
 * The shortcuts already existed but were invisible, which made them useful only
 * to whoever wrote them. `?` is the conventional key for this, and it costs one
 * listener.
 */
export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '?' || event.metaKey || event.ctrlKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      // `?` is a perfectly ordinary character to type into a search box.
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      event.preventDefault();
      setOpen((prev) => !prev);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Keyboard shortcuts" className="max-w-md">
      <ul className="flex flex-col gap-1 p-4">
        {SHORTCUTS.map((shortcut) => (
          <li
            key={shortcut.description}
            className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-xs text-content-secondary"
          >
            <span>{shortcut.description}</span>
            <span className="flex shrink-0 items-center gap-1">
              {shortcut.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
