'use client';

import { useEffect, useRef } from 'react';
import type { Pseudocode } from '@/core/pseudocode';
import { cn } from '@/lib/cn';

interface Props {
  code: Pseudocode;
  /** Line currently executing, from the playback snapshot. */
  activeLine?: number;
  /**
   * Lines the active lesson section is talking about.
   *
   * Rendered as a quieter secondary highlight so it reads as context rather
   * than competing with the line actually executing.
   */
  spotlight?: readonly number[];
  /** Suppress smooth scrolling and live announcements during playback. */
  playing: boolean;
  className?: string;
}

/**
 * Pseudocode with the executing line highlighted.
 *
 * This is the single biggest learning lever in the app: watching a bar swap is
 * pretty, but watching `swap A[j], A[j+1]` light up *as* it swaps is what turns
 * the animation into an explanation.
 *
 * The screen-reader announcement is gated on being paused. At 30 steps/second a
 * live region would emit thirty messages per second, which is not information —
 * it's a denial of service on the user's ears.
 */
export function PseudocodePane({ code, activeLine, spotlight, playing, className }: Props) {
  const highlighted = new Set(spotlight ?? []);
  const activeRef = useRef<HTMLDivElement>(null);
  const lastScrolled = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (activeLine === undefined || activeLine === lastScrolled.current) return;
    lastScrolled.current = activeLine;
    activeRef.current?.scrollIntoView({
      block: 'nearest',
      // Smooth scrolling can't keep up at speed and just looks like jitter.
      behavior: playing ? 'auto' : 'smooth',
    });
  }, [activeLine, playing]);

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-line bg-surface-950/60">
        <pre className="py-2 font-mono text-[11.5px] leading-[1.7]">
          {code.lines.map((line, index) => {
            const active = index === activeLine;
            const spotlit = !active && highlighted.has(index);
            return (
              <div
                key={index}
                ref={active ? activeRef : undefined}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex gap-3 border-l-2 px-3 transition-colors',
                  active && 'border-accent bg-accent/10 text-content-primary',
                  spotlit && 'border-accent/40 bg-accent/[0.04] text-content-secondary',
                  !active && !spotlit && 'border-transparent text-content-secondary',
                )}
              >
                <span
                  aria-hidden
                  className="w-5 shrink-0 select-none text-right tabular-nums text-content-muted/60"
                >
                  {index + 1}
                </span>
                <code className="whitespace-pre">{line || ' '}</code>
              </div>
            );
          })}
        </pre>
      </div>

      <span aria-live="polite" className="sr-only">
        {!playing && activeLine !== undefined
          ? `Line ${activeLine + 1}: ${code.lines[activeLine]}`
          : ''}
      </span>
    </div>
  );
}
