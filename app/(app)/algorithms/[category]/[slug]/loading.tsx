import { Skeleton } from '@/components/ui/Skeleton';
import { StageSkeleton } from '@/components/studio/StageSkeleton';

/** Shown while the route segment streams in. */
export default function Loading() {
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-line px-4 pb-4 pt-5 sm:px-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full max-w-3xl" />
      </div>
      <StageSkeleton />
    </>
  );
}
