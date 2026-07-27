'use client';

import { useCallback, useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  /** Rendered next to the label — e.g. a count. */
  badge?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange(id: string): void;
  className?: string;
  /** Extra classes for the panel wrapper. */
  panelClassName?: string;
}

/**
 * Accessible tab set with arrow-key navigation.
 *
 * Uses *automatic activation* (moving focus selects) because every panel here
 * is already-rendered local state — there is no fetch to trigger, so making the
 * user press Enter would just be friction.
 *
 * Roving tabindex keeps the whole tablist a single Tab stop, so keyboard users
 * skip past it in one keystroke instead of five.
 */
export function Tabs({ items, activeId, onChange, className, panelClassName }: TabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const focusTab = useCallback((index: number) => {
    const tabs = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[index]?.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const index = items.findIndex((t) => t.id === activeId);
      if (index < 0) return;

      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % items.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = items.length - 1;
      else return;

      event.preventDefault();
      onChange(items[next].id);
      focusTab(next);
    },
    [items, activeId, onChange, focusTab],
  );

  const active = items.find((t) => t.id === activeId) ?? items[0];

  return (
    <div className={className}>
      {/*
        Per the ARIA authoring practices a tablist is deliberately *not*
        focusable — its tabs are, via the roving tabindex below. The key handler
        lives here purely as event delegation from the focused tab.
      */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={listRef}
        role="tablist"
        onKeyDown={onKeyDown}
        className="scroll-x no-scrollbar flex gap-1 border-b border-line"
      >
        {items.map((tab) => {
          const selected = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                'shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                selected
                  ? 'border-accent text-content-primary'
                  : 'border-transparent text-content-muted hover:text-content-secondary',
              )}
            >
              {tab.label}
              {tab.badge ? <span className="ml-1.5 text-content-muted">{tab.badge}</span> : null}
            </button>
          );
        })}
      </div>

      {active ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className={cn('pt-3', panelClassName)}
        >
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
