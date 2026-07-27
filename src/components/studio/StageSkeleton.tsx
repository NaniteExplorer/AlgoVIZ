import { Skeleton } from '@/components/ui/Skeleton';

/** Placeholder occupying the studio's footprint while the WebGL chunk loads. */
export function StageSkeleton() {
  return (
    <div className="grid gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-[clamp(240px,46dvh,420px)] w-full md:h-[clamp(360px,52dvh,560px)]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="hidden flex-col gap-4 xl:flex">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    </div>
  );
}
