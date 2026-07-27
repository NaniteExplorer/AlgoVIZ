'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Hover/focus tooltip.
 *
 * Renders nothing on coarse pointers: there is no hover on a touchscreen, and a
 * tooltip that appears on tap just eats the tap. Touch users get the same
 * information from the control's `aria-label`/visible text instead.
 */
export function Tooltip({
  label,
  children,
  side = 'top',
  className,
}: {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setCoarse(window.matchMedia('(pointer: coarse)').matches);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (coarse) return <>{children}</>;

  const show = () => {
    timer.current = window.setTimeout(() => setOpen(true), 400);
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={hide}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg',
            'border border-line bg-surface-800 px-2 py-1 text-[11px] text-content-primary shadow-panel',
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
