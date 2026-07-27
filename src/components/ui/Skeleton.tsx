import { cn } from '@/lib/cn';

/**
 * Loading placeholder.
 *
 * The shimmer is a CSS animation, so the global `prefers-reduced-motion` rule
 * in `globals.css` already flattens it to a static block — no per-component
 * media query needed.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-shimmer rounded-xl bg-surface-800',
        'bg-[linear-gradient(90deg,transparent,rgb(var(--c-surface-700))_40%,transparent)]',
        'bg-[length:200%_100%]',
        className,
      )}
    />
  );
}
