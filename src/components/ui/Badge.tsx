import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warn' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-700 text-content-secondary',
  accent: 'bg-accent/15 text-accent',
  success: 'bg-accent-emerald/15 text-accent-emerald',
  warn: 'bg-accent-amber/15 text-accent-amber',
  info: 'bg-accent-violet/15 text-accent-violet',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-5',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
