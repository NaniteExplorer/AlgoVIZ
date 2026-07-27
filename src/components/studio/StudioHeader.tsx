import Link from 'next/link';
import { algorithmHref, type CatalogEntry } from '@/catalog';
import { Badge, type BadgeTone } from '@/components/ui/Badge';

const DIFFICULTY_TONE: Record<CatalogEntry['difficulty'], BadgeTone> = {
  intro: 'success',
  core: 'accent',
  advanced: 'warn',
};

/**
 * Server-rendered heading for an algorithm page.
 *
 * Everything here is static text: the name, the prose description, the
 * complexity table and the related links. Keeping it out of the client island
 * means the page has meaningful content in its HTML — good for search, and it
 * gives the reader something to look at while the WebGL chunk downloads.
 */
export function StudioHeader({
  entry,
  categoryLabel,
  related,
}: {
  entry: CatalogEntry;
  categoryLabel: string;
  related: CatalogEntry[];
}) {
  return (
    <header className="border-b border-line px-4 pb-4 pt-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          {categoryLabel}
        </span>
        {entry.group ? <Badge tone="neutral">{entry.group}</Badge> : null}
        <Badge tone={DIFFICULTY_TONE[entry.difficulty]}>{entry.difficulty}</Badge>
      </div>

      <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-content-primary sm:text-3xl">
        {entry.name}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-content-muted">
        {entry.description}
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <Stat label="Best" value={entry.complexity.time.best} />
        <Stat label="Average" value={entry.complexity.time.average} />
        <Stat label="Worst" value={entry.complexity.time.worst} />
        <Stat label="Space" value={entry.complexity.space} />
        {entry.complexity.stable !== undefined ? (
          <Stat label="Stable" value={entry.complexity.stable ? 'Yes' : 'No'} />
        ) : null}
      </dl>

      {related.length ? (
        <nav aria-label="Related algorithms" className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-content-muted">Next up:</span>
          {related.map((other) => (
            <Link
              key={other.slug}
              href={algorithmHref(other)}
              className="rounded-lg border border-line bg-surface-900 px-2 py-1 text-xs text-content-secondary transition-colors hover:border-accent/60 hover:text-content-primary"
            >
              {other.name}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-content-muted">{label}</dt>
      <dd className="font-mono text-content-primary">{value}</dd>
    </div>
  );
}
