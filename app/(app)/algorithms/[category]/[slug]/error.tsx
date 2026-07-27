'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';

/**
 * Route-level error boundary.
 *
 * Distinct from the studio's own boundary: this catches failures in the server
 * component or the data it depends on, where the studio's catches failures
 * inside the renderer. Both exist because losing one should not take the other
 * down with it.
 */
export default function AlgorithmError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset(): void;
}) {
  useEffect(() => {
    console.error('[AlgoVIZ] Route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4 px-4 py-16 sm:px-6">
      <h1 className="text-xl font-semibold text-content-primary">
        This algorithm page failed to load
      </h1>
      <p className="max-w-lg text-sm leading-relaxed text-content-muted">
        {error.message || 'Something went wrong while preparing the page.'}
        {error.digest ? (
          <span className="ml-1 font-mono text-xs text-content-muted">({error.digest})</span>
        ) : null}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/algorithms" variant="outline" size="sm">
          Back to the catalog
        </ButtonLink>
      </div>
    </div>
  );
}
