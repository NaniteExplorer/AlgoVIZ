'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';
import { cn } from '@/lib/cn';

interface DialogProps {
  open: boolean;
  onClose(): void;
  /** Accessible name. Rendered visibly unless `hideTitle`. */
  title: string;
  hideTitle?: boolean;
  /** Element to focus on open — e.g. the palette's search input. */
  initialFocus?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}

/**
 * Modal dialog: portal + backdrop + focus trap + scroll lock + Escape.
 *
 * Hand-rolled rather than pulled from Radix. The app needs exactly two overlay
 * shapes (this and {@link Sheet}), and the accessibility contract for a modal
 * is small and well specified — small enough that owning it costs less than a
 * ~8-package dependency next to an already Three.js-sized bundle.
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle,
  initialFocus,
  className,
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Portals need a DOM target, which doesn't exist during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useFocusTrap(panelRef, open, { initialFocus, onEscape: onClose });
  useScrollLock(open);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] sm:pt-[14vh]">
      <div
        className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        // The backdrop duplicates the Escape key and the close button, so it is
        // deliberately not exposed as its own control.
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={hideTitle ? title : undefined}
        aria-labelledby={hideTitle ? undefined : 'algoviz-dialog-title'}
        tabIndex={-1}
        className={cn(
          'panel relative flex max-h-[80vh] w-full max-w-xl animate-scale-in flex-col overflow-hidden',
          className,
        )}
      >
        {hideTitle ? null : (
          <h2
            id="algoviz-dialog-title"
            className="border-b border-line px-4 py-3 text-sm font-semibold text-content-primary"
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
