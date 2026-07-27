import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CompareLoader } from '@/components/compare/CompareLoader';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = {
  title: 'Algorithm Race',
  description:
    'Run two algorithms side by side on identical input at the same steps-per-second, and watch the complexity difference play out in real time.',
  alternates: { canonical: '/compare' },
};

export default function ComparePage() {
  // `useSearchParams` requires a Suspense boundary during prerendering.
  return (
    <Suspense fallback={<RaceSkeleton />}>
      <CompareLoader />
    </Suspense>
  );
}

function RaceSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-3 py-4 sm:px-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-[clamp(200px,32dvh,320px)]" />
        <Skeleton className="h-[clamp(200px,32dvh,320px)]" />
      </div>
    </div>
  );
}
