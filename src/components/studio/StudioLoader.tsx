'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { AlgorithmCategory } from '@/core/algorithms';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { StageSkeleton } from './StageSkeleton';

/**
 * Client boundary around the visualizer.
 *
 * `ssr: false` is doing real work here: it is what keeps Three.js, the engine
 * and every visualizer out of the server bundle entirely, so the algorithm
 * pages can be statically prerendered with real HTML content. Without it,
 * Next would try to render WebGL code in Node and the whole SSG story
 * collapses.
 *
 * `dynamic()` must be called from a Client Component in the App Router, hence
 * this thin wrapper rather than calling it in `page.tsx`.
 */
const VisualizerStudio = dynamic(
  () => import('@/components/visualizer/VisualizerStudio').then((m) => m.VisualizerStudio),
  { ssr: false, loading: () => <StageSkeleton /> },
);

export function StudioLoader({
  category,
  slug,
}: {
  category: AlgorithmCategory;
  slug: string;
}) {
  // Bumped by the error fallback to force a clean remount of the whole
  // subtree — a renderer that has thrown cannot be trusted to recover in place.
  const [attempt, setAttempt] = useState(0);

  return (
    <ErrorBoundary
      onRetry={() => setAttempt((n) => n + 1)}
      fallback={(error, retry) => (
        <div className="m-4 flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface-900/60 p-6 sm:m-6">
          <h2 className="text-sm font-semibold text-content-primary">The visualizer stopped</h2>
          <p className="max-w-lg text-xs leading-relaxed text-content-muted">
            {error.message || 'An unexpected rendering error occurred.'} The written explanation
            above is unaffected.
          </p>
          <Button variant="outline" size="sm" onClick={retry}>
            Reload visualizer
          </Button>
        </div>
      )}
    >
      {/*
        Keyed by category so switching families tears the WebGL context down
        cleanly. Switching *algorithms* within a family deliberately does not
        remount — the studio syncs the slug prop instead, keeping the scene and
        camera alive between siblings.
      */}
      <VisualizerStudio key={`${category}:${attempt}`} category={category} slug={slug} />
    </ErrorBoundary>
  );
}
