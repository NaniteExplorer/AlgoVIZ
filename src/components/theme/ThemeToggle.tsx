'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useTheme, type ThemePreference } from './ThemeProvider';

const OPTIONS: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  {
    value: 'light',
    label: 'Light theme',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'Match system theme',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <path strokeLinecap="round" d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark theme',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    ),
  },
];

/**
 * Three-state segmented control.
 *
 * `system` is a first-class option rather than an implicit default, so a user
 * who has explicitly chosen light or dark can get back to "follow my OS" —
 * which a two-state toggle makes impossible.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={cn('inline-flex items-center gap-0.5 rounded-xl bg-surface-800 p-0.5', className)}
    >
      {OPTIONS.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={active}
            title={option.label}
            onClick={() => setPreference(option.value)}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
              active
                ? 'bg-surface-600 text-content-primary'
                : 'text-content-muted hover:text-content-secondary',
            )}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
