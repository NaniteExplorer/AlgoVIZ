'use client';

import type { MetricSpec } from '@/core/visualization/CategoryModule';
import type { PlaybackSnapshot } from '@/core/playback/PlaybackController';

interface Props {
  snapshot: PlaybackSnapshot;
  metricSpecs: MetricSpec[];
  accent: string;
}

/**
 * Non-interactive HUD layered over the stage: live counters, run status and the
 * current step's narration.
 *
 * Everything is `pointer-events-none` so the overlay never intercepts a camera
 * drag, and the metric chips are driven entirely by the active family's
 * `metricSpecs`, keeping the HUD category-agnostic.
 */
export function VisualizerCanvas({ snapshot, metricSpecs, accent }: Props) {
  const { metrics, note, status } = snapshot;

  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-1.5 font-mono text-[11px] sm:left-4 sm:top-4 sm:text-xs">
        {metricSpecs.map((m) => (
          <Metric key={m.key} label={m.label} value={metrics[m.key] ?? 0} />
        ))}
      </div>

      <div className="pointer-events-none absolute right-3 top-3 sm:right-4 sm:top-4">
        <span
          className="rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur sm:text-xs"
          style={{ borderColor: `${accent}55`, color: accent, background: `${accent}1a` }}
        >
          {status}
        </span>
      </div>

      {note ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-14 sm:bottom-4">
          <span className="max-w-full truncate rounded-full border border-line bg-surface-900/85 px-3 py-1.5 font-mono text-[11px] text-content-secondary backdrop-blur sm:text-xs">
            {note}
          </span>
        </div>
      ) : null}

      {/*
        Narration for screen readers, announced only while paused. During
        playback the step rate is far too high for a live region to be anything
        but noise.
      */}
      <span aria-live="polite" className="sr-only">
        {status !== 'playing' && note ? note : ''}
      </span>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg border border-line bg-surface-900/75 px-2 py-0.5 backdrop-blur">
      <span className="text-content-muted">{label} </span>
      <span className="tabular-nums text-content-primary">{value.toLocaleString()}</span>
    </span>
  );
}
