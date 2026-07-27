import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allSlugs, catalogCategory, getEntry, getEntryBySlug, algorithmHref } from '@/catalog';
import type { AlgorithmCategory } from '@/core/algorithms';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { StudioLoader } from '@/components/studio/StudioLoader';

interface RouteParams {
  category: string;
  slug: string;
}

/**
 * Every algorithm is a real, prerendered page.
 *
 * `dynamicParams: false` makes anything outside this set a 404 rather than an
 * on-demand render — the catalog is a closed set, so a URL that isn't in it is
 * a typo, not a cache miss.
 */
export const dynamicParams = false;

export function generateStaticParams(): RouteParams[] {
  return allSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const entry = getEntry(category, slug);
  if (!entry) return {};

  const canonical = algorithmHref(entry);
  const title = `${entry.name} — Interactive Visualizer`;
  return {
    title,
    description: entry.tagline,
    keywords: [entry.name, ...(entry.aliases ?? []), ...entry.tags, 'algorithm visualization'],
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description: entry.tagline,
    },
    // `summary` rather than `summary_large_image`: there is no per-algorithm
    // card image. Generating one needs `@vercel/og`, whose WASM loader throws
    // on Windows paths (`fileURLToPath`) both at build time and at request
    // time, so an `opengraph-image` route would be a crashing endpoint rather
    // than a feature. Re-add it once the app builds on a Linux target.
    twitter: { card: 'summary', title, description: entry.tagline },
  };
}

export default async function AlgorithmPage({ params }: { params: Promise<RouteParams> }) {
  const { category, slug } = await params;
  const entry = getEntry(category, slug);
  if (!entry) notFound();

  const info = catalogCategory(entry.category);
  const related = (entry.related ?? [])
    .map(getEntryBySlug)
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  return (
    <>
      {/*
        Server-rendered so the page has real, indexable content and a fast first
        paint even though the visualizer itself is a client-only chunk.
      */}
      <StudioHeader entry={entry} categoryLabel={info.label} related={related} />
      <StudioLoader category={entry.category as AlgorithmCategory} slug={entry.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: `${entry.name} — Interactive Visualizer`,
            description: entry.description,
            about: entry.name,
            keywords: entry.tags.join(', '),
            educationalLevel: entry.difficulty,
          }),
        }}
      />
    </>
  );
}
