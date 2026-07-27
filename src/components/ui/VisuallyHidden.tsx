import type { ReactNode } from 'react';

/** Content exposed to assistive tech only. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
