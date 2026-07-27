'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Client boundary for the race view.
 *
 * Same reason as the studio's loader: the lanes instantiate real renderers, so
 * this has to stay out of the server bundle for `/compare` to prerender.
 */
const RaceView = dynamic(() => import('./RaceView').then((m) => m.RaceView), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4 px-3 py-4 sm:px-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-[clamp(200px,32dvh,320px)]" />
        <Skeleton className="h-[clamp(200px,32dvh,320px)]" />
      </div>
    </div>
  ),
});

export function CompareLoader() {
  return <RaceView />;
}
