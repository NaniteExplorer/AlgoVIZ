import type { Metadata } from 'next';
import Link from 'next/link';
import { algorithmHref, getEntryBySlug } from '@/catalog';
import { lessonRegistry } from '@/content/lessons';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Guided Lessons',
  description:
    'Written walkthroughs that play alongside the visualization, pausing at checkpoints to ask what happens next.',
  alternates: { canonical: '/learn' },
};

/**
 * Index of algorithms that have a written lesson.
 *
 * Reads only the loader *keys*, never the loaders themselves, so none of the
 * lesson prose ends up in this page's bundle.
 */
export default function LearnPage() {
  const entries = lessonRegistry
    .ids()
    .map(getEntryBySlug)
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-content-primary">
        Guided Lessons
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-content-muted">
        These walk alongside the animation: the text advances as playback does, and every so often
        the run pauses to ask you what happens next. Open one from its algorithm page and switch to
        the <span className="text-content-secondary">Lesson</span> tab.
      </p>

      <ul role="list" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
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
                <Badge tone="accent">Lesson</Badge>
              </div>
              <p className="flex-1 text-xs leading-relaxed text-content-muted">{entry.tagline}</p>
            </Link>
          </li>
        ))}
      </ul>

      {entries.length === 0 ? (
        <p className="mt-8 text-sm text-content-muted">No lessons published yet.</p>
      ) : null}
    </div>
  );
}
