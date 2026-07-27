'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';
import { cn } from '@/lib/cn';

/** How much of the sheet is showing. */
export type SheetSnap = 'peek' | 'half' | 'full';

const SNAP_ORDER: SheetSnap[] = ['peek', 'half', 'full'];

/** Translate-Y per snap point, as a CSS length. */
const SNAP_OFFSET: Record<SheetSnap, string> = {
  peek: 'calc(100% - 5.5rem)',
  half: '48dvh',
  full: '0px',
};

interface BottomSheetProps {
  snap: SheetSnap;
  onSnapChange(snap: SheetSnap): void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Draggable bottom sheet — the mobile home for the control panel.
 *
 * Two details matter more than they look:
 *
 * 1. Pointer capture is taken on the *handle only*, never the whole sheet.
 *    Capturing the sheet would swallow the pointer events of the range sliders
 *    inside it, so speed and array-size would stop working on touch.
 * 2. Scroll is locked only at `full`. At `peek`/`half` the page behind is still
 *    the primary surface and must stay scrollable.
 */
export function BottomSheet({ snap, onSnapChange, title, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const dragStart = useRef<{ y: number; time: number } | null>(null);

  useEffect(() => setMounted(true), []);
  useScrollLock(snap === 'full');
  useFocusTrap(sheetRef, snap === 'full', { onEscape: () => onSnapChange('half') });

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { y: event.clientY, time: performance.now() };
    setDragOffset(0);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragStart.current) return;
    setDragOffset(event.clientY - dragStart.current.y);
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const start = dragStart.current;
      dragStart.current = null;
      setDragOffset(null);
      if (!start) return;

      const dy = event.clientY - start.y;
      const dt = Math.max(1, performance.now() - start.time);
      const velocity = dy / dt; // px per ms; positive = downward

      // A quick flick moves one detent regardless of distance; a slow drag
      // needs to actually cover ground. Matches how native sheets feel.
      const flick = Math.abs(velocity) > 0.5;
      const moved = Math.abs(dy) > 48;
      if (!flick && !moved) return;

      const index = SNAP_ORDER.indexOf(snap);
      const next = dy > 0 ? Math.max(0, index - 1) : Math.min(SNAP_ORDER.length - 1, index + 1);
      onSnapChange(SNAP_ORDER[next]);
    },
    [snap, onSnapChange],
  );

  if (!mounted) return null;

  const transform =
    dragOffset === null
      ? `translateY(${SNAP_OFFSET[snap]})`
      : `translateY(calc(${SNAP_OFFSET[snap]} + ${dragOffset}px))`;

  return createPortal(
    <>
      {snap === 'full' ? (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-black/50"
          onClick={() => onSnapChange('half')}
          aria-hidden
        />
      ) : null}
      <div
        ref={sheetRef}
        role="dialog"
        aria-label={title}
        aria-modal={snap === 'full'}
        tabIndex={-1}
        style={{ transform }}
        className={cn(
          'safe-b fixed inset-x-0 bottom-0 z-40 flex max-h-[92dvh] flex-col',
          'rounded-t-2xl border-t border-line bg-surface-900/95 shadow-panel backdrop-blur-lg',
          // Suppress the transition mid-drag so the sheet tracks the finger 1:1.
          dragOffset === null && 'transition-transform duration-300 ease-out',
          className,
        )}
      >
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={() => onSnapChange(snap === 'full' ? 'peek' : 'full')}
          aria-label={snap === 'full' ? `Collapse ${title}` : `Expand ${title}`}
          className="flex w-full shrink-0 touch-none flex-col items-center gap-1 py-3"
        >
          <span className="h-1 w-10 rounded-full bg-surface-600" />
          <span className="text-xs font-medium text-content-muted">{title}</span>
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
      </div>
    </>,
    document.body,
  );
}

/**
 * Off-canvas side drawer — the mobile/tablet form of the algorithm sidebar.
 * Shares the overlay semantics with {@link BottomSheet} but slides from the
 * inline-start edge and is always fully modal when open.
 */
export function SideDrawer({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose(): void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useFocusTrap(panelRef, open, { onEscape: onClose });
  useScrollLock(open);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col',
          'border-r border-line bg-surface-900 shadow-panel',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
