'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type IconButtonVariant = 'solid' | 'ghost' | 'outline';
export type IconButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<IconButtonVariant, string> = {
  solid: 'bg-accent text-accent-contrast hover:bg-accent-glow',
  ghost: 'text-content-secondary hover:bg-surface-800 hover:text-content-primary',
  outline:
    'border border-line-strong text-content-primary hover:border-accent hover:text-accent',
};

const SIZES: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  /** Required: the control has no visible text to name it. */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
  children: ReactNode;
}

/**
 * Square icon-only control.
 *
 * `label` is mandatory — an unlabelled icon button is invisible to assistive
 * tech, and the transport bar is built almost entirely from these.
 *
 * The `before:` pseudo-element extends the *hit* area to ≥44px on touch devices
 * without changing the rendered size, which keeps the desktop transport compact
 * while still meeting the touch-target guideline on a phone.
 */
export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'tap-target relative inline-flex shrink-0 items-center justify-center rounded-xl transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
