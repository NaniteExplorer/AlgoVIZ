'use client';

import type { ReactNode } from 'react';
import type { AlgorithmMeta } from '@/core/algorithms';

/** Static reference card: description + asymptotic profile for the active algorithm. */
export function ComplexityCard({ meta }: { meta: AlgorithmMeta }) {
  const { complexity } = meta;
  return (
    <div className="panel flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ background: meta.accent }} />
        <h3 className="text-lg font-semibold text-content-primary">{meta.name}</h3>
      </div>

      <p className="text-sm leading-relaxed text-content-muted">{meta.description}</p>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Best" value={complexity.time.best} accent={meta.accent} />
        <Stat label="Average" value={complexity.time.average} accent={meta.accent} />
        <Stat label="Worst" value={complexity.time.worst} accent={meta.accent} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Tag>Space {complexity.space}</Tag>
        {complexity.stable !== undefined && (
          <Tag>{complexity.stable ? 'Stable' : 'Unstable'}</Tag>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-950/60 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-content-muted">{label}</div>
      <div className="mt-0.5 font-mono text-sm" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-surface-800 px-2.5 py-1 font-mono text-content-secondary">
      {children}
    </span>
  );
}
