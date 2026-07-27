'use client';

import { useMemo } from 'react';
import type { AlgorithmMeta } from '@/core/algorithms';
import { cn } from '@/lib/cn';

interface Props {
  algorithms: AlgorithmMeta[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * Horizontal rail of the algorithms in the current family.
 *
 * Two changes from the original wrapping pill grid: entries are bucketed by
 * `meta.group` (thirteen sorts wrapping over four rows was unreadable), and the
 * rail scrolls horizontally instead of wrapping, so the stage never gets pushed
 * off-screen on a narrow viewport. Sidebar and command palette remain the
 * primary navigation; this is the "switch to a sibling" affordance.
 */
export function AlgorithmSelector({ algorithms, activeId, onSelect, className }: Props) {
  const groups = useMemo(() => groupByLabel(algorithms), [algorithms]);

  return (
    <div className={cn('scroll-x no-scrollbar flex items-center gap-4 pb-1', className)}>
      {groups.map(({ label, items }) => (
        <div key={label ?? '_'} className="flex shrink-0 items-center gap-1.5">
          {label ? (
            <span className="shrink-0 pr-0.5 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              {label}
            </span>
          ) : null}
          {items.map((algo) => {
            const active = algo.id === activeId;
            return (
              <button
                key={algo.id}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(algo.id)}
                // The accent is per-algorithm data, so it has to be an inline
                // style; everything structural stays in tokenised classes.
                style={active ? { background: algo.accent, color: 'rgb(var(--c-accent-contrast))' } : undefined}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'glow-accent border-transparent'
                    : 'border-line bg-surface-800 text-content-secondary hover:border-line-strong hover:text-content-primary',
                )}
              >
                {algo.name}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Preserve registration order while collecting entries under their group. */
function groupByLabel(
  algorithms: AlgorithmMeta[],
): { label: string | undefined; items: AlgorithmMeta[] }[] {
  const buckets = new Map<string, { label: string | undefined; items: AlgorithmMeta[] }>();
  for (const algo of algorithms) {
    const key = algo.group ?? '';
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { label: algo.group, items: [] };
      buckets.set(key, bucket);
    }
    bucket.items.push(algo);
  }
  return [...buckets.values()];
}
