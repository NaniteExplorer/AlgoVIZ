import Link from 'next/link';
import { ACTIVE_CATEGORIES, algorithmHref, entriesOf, firstOf } from '@/catalog';
import { Badge } from '@/components/ui/Badge';

/**
 * Landing-page entry point into the studio.
 *
 * Replaces the old in-page `PlatformShell`, which mounted a live WebGL scene
 * directly on the marketing page. Cards that link into `/algorithms/...` are
 * both far cheaper on first load and the thing that makes every algorithm
 * linkable and indexable in the first place.
 */
export function FamilyGrid() {
  return (
    <section id="families" className="mx-auto w-full max-w-7xl scroll-mt-20 px-6 py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">The Studio</p>
      <h2 className="mt-2 text-3xl font-semibold text-content-primary md:text-4xl">
        Pick a family and start stepping
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-content-muted">
        Every algorithm has its own page, its own URL and its own synced pseudocode. Play, scrub
        backwards, change the dataset, and watch the counters move.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIVE_CATEGORIES.map((info) => {
          const entries = entriesOf(info.category);
          const landing = firstOf(info.category);
          if (!landing) return null;

          return (
            <Link
              key={info.category}
              href={algorithmHref(landing)}
              className="panel group flex flex-col gap-3 p-5 transition-colors hover:border-accent/50"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-content-primary">{info.title}</h3>
                <Badge tone="neutral">{entries.length}</Badge>
              </div>
              <p className="flex-1 text-sm text-content-muted">{info.blurb}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {entries.slice(0, 4).map((entry) => (
                  <span
                    key={entry.slug}
                    className="rounded-md bg-surface-800 px-1.5 py-0.5 text-[11px] text-content-secondary"
                  >
                    {entry.name}
                  </span>
                ))}
                {entries.length > 4 ? (
                  <span className="px-1 py-0.5 text-[11px] text-content-muted">
                    +{entries.length - 4} more
                  </span>
                ) : null}
              </div>
              <span className="pt-1 text-xs font-medium text-accent transition-transform group-hover:translate-x-0.5">
                Open the studio →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
