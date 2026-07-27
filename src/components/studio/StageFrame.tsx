'use client';

import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { isCoarsePointer } from '@/lib/perf';
import { cn } from '@/lib/cn';
import { useWebGLSupport, WebGLUnavailable } from './WebGLGuard';

interface Props {
  containerRef: RefObject<HTMLDivElement | null>;
  /** Called when the user turns camera interaction on or off. */
  onInteractiveChange(interactive: boolean): void;
  /** True when this family renders in 3D and therefore needs WebGL. */
  needsWebGL?: boolean;
  /** HUD and overlays, rendered above the canvas. */
  children?: ReactNode;
  className?: string;
}

/**
 * The visualization viewport.
 *
 * Two things this solves that the old fixed-height canvas box did not:
 *
 * 1. **Sizing.** `dvh` rather than `vh`, so iOS Safari's collapsing URL bar
 *    doesn't clip the stage, clamped so it never dominates a short window or
 *    shrinks to nothing on a tall one.
 * 2. **Touch.** On a coarse pointer the canvas starts with pointer events off,
 *    so a finger drag scrolls the page like it does everywhere else. Camera
 *    control is opt-in via an explicit button. Previously the canvas swallowed
 *    every touch and the page simply could not be scrolled past it — the single
 *    worst mobile bug in the app.
 */
export function StageFrame({
  containerRef,
  onInteractiveChange,
  needsWebGL = true,
  children,
  className,
}: Props) {
  const [coarse, setCoarse] = useState(false);
  const [interactive, setInteractive] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const webgl = useWebGLSupport();

  useEffect(() => {
    const touch = isCoarsePointer();
    setCoarse(touch);
    // Desktop keeps orbit-on-drag; touch has to ask.
    setInteractive(!touch);
    onInteractiveChange(!touch);
  }, [onInteractiveChange]);

  // A GPU driver reset or too many live contexts silently blanks the canvas.
  // Catching the event lets us say so instead of showing an empty black box.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onLost = (event: Event) => {
      event.preventDefault();
      setContextLost(true);
    };
    const onRestored = () => setContextLost(false);
    container.addEventListener('webglcontextlost', onLost, true);
    container.addEventListener('webglcontextrestored', onRestored, true);
    return () => {
      container.removeEventListener('webglcontextlost', onLost, true);
      container.removeEventListener('webglcontextrestored', onRestored, true);
    };
  }, [containerRef]);

  const unsupported = needsWebGL && webgl === false;

  const toggle = () => {
    const next = !interactive;
    setInteractive(next);
    onInteractiveChange(next);
  };

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-line bg-surface-950',
        'h-[clamp(240px,46dvh,420px)] md:h-[clamp(360px,52dvh,560px)] xl:h-[min(62dvh,620px)]',
        className,
      )}
    >
      {/*
        The container is always mounted, even when unsupported: the renderer
        holds a ref to it, and conditionally removing it would turn a graceful
        degradation into a null-ref crash.
      */}
      <div
        ref={containerRef}
        aria-hidden={unsupported}
        className={cn(
          'absolute inset-0',
          unsupported && 'invisible',
          // `touch-action: none` only while the camera owns the gesture;
          // otherwise the browser must be free to scroll.
          interactive ? 'touch-none' : 'pointer-events-none touch-auto',
        )}
      />

      {unsupported ? (
        <div className="absolute inset-0">
          <WebGLUnavailable />
        </div>
      ) : (
        children
      )}

      {contextLost && !unsupported ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-950/85 px-6 text-center backdrop-blur">
          <p className="max-w-sm text-xs leading-relaxed text-content-muted">
            The graphics context was lost — usually a driver reset, or too many 3D views open at
            once. Reload the page to restore it.
          </p>
        </div>
      ) : null}

      {coarse && !unsupported ? (
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {interactive ? (
            <span className="rounded-full bg-surface-900/85 px-2.5 py-1 text-[11px] text-content-muted backdrop-blur">
              Drag to orbit · pinch to zoom
            </span>
          ) : null}
          <IconButton
            label={interactive ? 'Stop camera interaction' : 'Interact with the 3D view'}
            variant={interactive ? 'solid' : 'outline'}
            size="md"
            onClick={toggle}
            className="bg-surface-900/85 backdrop-blur"
          >
            <HandIcon />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}

function HandIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-.5V4.5a1.5 1.5 0 0 1 3 0V12m0-.5v-2a1.5 1.5 0 0 1 3 0V16a5 5 0 0 1-5 5h-1.5a5 5 0 0 1-4.3-2.4L5 15.5a1.5 1.5 0 0 1 2.6-1.5L8 15"
      />
    </svg>
  );
}
