'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Variants are lookup records rather than composed strings.
 *
 * Each record supplies a complete, non-overlapping set of utilities, so two
 * variants can never both apply to one element and there is nothing for a
 * class-merging library to resolve.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-glow',
  secondary: 'bg-surface-700 text-content-primary hover:bg-surface-600',
  ghost: 'bg-transparent text-content-secondary hover:bg-surface-800 hover:text-content-primary',
  outline:
    'border border-line-strong bg-transparent text-content-primary hover:border-accent hover:text-accent',
  danger: 'bg-accent-rose text-white hover:opacity-90',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
};

const BASE =
  'inline-flex select-none items-center justify-center rounded-xl font-medium transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-40';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </button>
  );
}

/**
 * Link styled as a button.
 *
 * A separate component rather than an `as`/`asChild` prop: the two have
 * genuinely different prop contracts (`href` vs `onClick`/`disabled`), and
 * conflating them is how you end up shipping a disabled anchor that is still
 * clickable.
 */
export function ButtonLink({
  href,
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: CommonProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    'href' | 'className' | 'children'
  >) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
