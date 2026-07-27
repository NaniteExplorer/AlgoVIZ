import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Kbd({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-line-strong',
        'bg-surface-800 px-1 font-mono text-[10px] font-medium text-content-muted',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
