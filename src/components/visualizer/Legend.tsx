'use client';

import type { LegendItem } from '@/core/visualization/CategoryModule';

/** Colour key mapping scene colours to their algorithmic meaning. */
export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className="panel flex flex-wrap gap-x-4 gap-y-2 px-4 py-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          {/* `glow-accent` reads `currentColor`, so the halo follows the swatch
              and switches off entirely in light mode via the --glow token. */}
          <span
            className="glow-accent h-3 w-3 rounded-sm"
            style={{ background: item.color, color: item.color }}
          />
          <span className="text-xs text-content-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
