import type { Metadata } from 'next';
import Link from 'next/link';
import { ACTIVE_CATEGORIES, algorithmHref, entriesOf } from '@/catalog';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Algorithm Catalog',
  description:
    'Every algorithm in AlgoViz — sorting, searching, graphs, trees, dynamic programming, backtracking and data structures — each with an interactive, step-by-step visualizer.',
  alternates: { canonical: '/algorithms' },
};

export default function CatalogPage() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-content-primary">
        Algorithm Catalog
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-content-muted">
        Pick anything to open it in the studio. Press <kbd className="font-mono">⌘K</kbd> to jump
        straight to an algorithm by name.
      </p>

      <div className="mt-8 flex flex-col gap-10">
        {ACTIVE_CATEGORIES.map((info) => (
          <section key={info.category} aria-labelledby={`cat-${info.category}`}>
            <div className="flex items-baseline gap-3">
              <h2
                id={`cat-${info.category}`}
                className="text-base font-semibold text-content-primary"
              >
                {info.title}
              </h2>
              <span className="text-xs text-content-muted">{info.blurb}</span>
            </div>

            <ul
              role="list"
              className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            >
              {entriesOf(info.category).map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={algorithmHref(entry)}
                    className="panel flex h-full flex-col gap-2 p-4 transition-colors hover:border-accent/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium text-content-primary">
                        <span
                          aria-hidden
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: entry.accent }}
                        />
                        {entry.name}
                      </span>
                      <Badge tone="neutral">{entry.difficulty}</Badge>
                    </div>
                    <p className="flex-1 text-xs leading-relaxed text-content-muted">
                      {entry.tagline}
                    </p>
                    <p className="font-mono text-[11px] text-content-muted">
                      {entry.complexity.time.average} avg · {entry.complexity.space} space
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
