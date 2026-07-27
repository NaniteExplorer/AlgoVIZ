import { algorithmRegistry, type AlgorithmCategory, type AlgorithmMeta } from '@/core/algorithms';
import { CATALOG_CATEGORIES, catalogCategory } from './categories';
import { ENRICHMENT, type Enrichment } from './enrichment';
import type { CatalogEntry } from './types';

/**
 * The routing/navigation view of the algorithm library.
 *
 * **Derived, not duplicated.** The catalog reads `AlgorithmMeta` straight from
 * the registry and layers presentation-only fields on top, so a name or
 * complexity string can never drift between the studio and the route metadata —
 * there is only one copy. The alternative (a hand-maintained parallel table)
 * would need a parity assertion to catch exactly the bugs this design makes
 * impossible.
 *
 * This module is imported by Server Components for `generateStaticParams` and
 * `generateMetadata`. That is safe because `src/core/algorithms/**` is free of
 * Three.js and DOM access — a constraint now enforced by a `no-restricted-imports`
 * ESLint rule rather than by convention, because the failure mode if it breaks
 * (an empty registry ⇒ zero static params ⇒ every algorithm route 404s in
 * production while working in dev) is close to undebuggable.
 */

const FALLBACK: Enrichment = {
  tagline: '',
  difficulty: 'core',
  tags: [],
};

function deriveEntry(meta: AlgorithmMeta): CatalogEntry {
  const extra = ENRICHMENT[meta.id] ?? FALLBACK;
  return {
    slug: meta.id,
    name: meta.name,
    category: meta.category,
    group: meta.group,
    // Fall back to the first sentence of the long description so an
    // un-enriched algorithm still reads properly in cards and meta tags.
    tagline: extra.tagline || firstSentence(meta.description),
    description: meta.description,
    complexity: meta.complexity,
    accent: meta.accent,
    accentLight: extra.accentLight,
    difficulty: extra.difficulty,
    tags: extra.tags,
    aliases: extra.aliases,
    related: extra.related,
  };
}

function firstSentence(text: string): string {
  const match = /^.*?[.!?](?:\s|$)/.exec(text);
  return (match?.[0] ?? text).trim();
}

/** Every algorithm, in registration order. */
export const CATALOG: CatalogEntry[] = algorithmRegistry.listMeta().map(deriveEntry);

const BY_SLUG = new Map(CATALOG.map((entry) => [entry.slug, entry]));

/** Families that actually have algorithms, in canonical display order. */
export const ACTIVE_CATEGORIES = CATALOG_CATEGORIES.filter((info) =>
  CATALOG.some((entry) => entry.category === info.category),
);

export function entriesOf(category: AlgorithmCategory): CatalogEntry[] {
  return CATALOG.filter((entry) => entry.category === category);
}

/** Entries of a category bucketed by `group`, preserving registration order. */
export function groupsOf(
  category: AlgorithmCategory,
): { label: string | undefined; entries: CatalogEntry[] }[] {
  const buckets = new Map<string, { label: string | undefined; entries: CatalogEntry[] }>();
  for (const entry of entriesOf(category)) {
    const key = entry.group ?? '';
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { label: entry.group, entries: [] };
      buckets.set(key, bucket);
    }
    bucket.entries.push(entry);
  }
  return [...buckets.values()];
}

/**
 * Look up an entry, verifying it belongs to `category`.
 *
 * The category check matters: without it `/algorithms/graph/quick-sort` would
 * render a sorting visualizer under a graph URL, and every canonical link and
 * breadcrumb on the page would be wrong.
 */
export function getEntry(category: string, slug: string): CatalogEntry | undefined {
  const entry = BY_SLUG.get(slug);
  return entry && entry.category === category ? entry : undefined;
}

export function getEntryBySlug(slug: string): CatalogEntry | undefined {
  return BY_SLUG.get(slug);
}

/** Every `{ category, slug }` pair — feeds `generateStaticParams`. */
export function allSlugs(): { category: string; slug: string }[] {
  return CATALOG.map((entry) => ({ category: entry.category, slug: entry.slug }));
}

/** The landing algorithm for a family. */
export function firstOf(category: AlgorithmCategory): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.category === category);
}

export interface SearchHit {
  entry: CatalogEntry;
  score: number;
}

/**
 * Weighted prefix search over the catalog.
 *
 * Deliberately not fuzzy and deliberately not a dependency: with well under a
 * hundred entries, token-prefix matching with field weights gives better
 * results than edit-distance fuzz (which loves to rank "gnome-sort" above
 * "merge-sort" for the query "mer") and costs nothing to ship.
 */
export function searchCatalog(query: string, limit = 12): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);

  const hits: SearchHit[] = [];
  for (const entry of CATALOG) {
    let score = 0;
    for (const term of terms) {
      const termScore = scoreTerm(entry, term);
      // Every term must match something, or the entry is not a hit at all.
      if (termScore === 0) {
        score = 0;
        break;
      }
      score += termScore;
    }
    if (score > 0) hits.push({ entry, score });
  }

  return hits.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name)).slice(0, limit);
}

function scoreTerm(entry: CatalogEntry, term: string): number {
  const name = entry.name.toLowerCase();
  if (name.startsWith(term)) return 100;
  if (name.includes(term)) return 70;
  if (entry.slug.includes(term)) return 60;
  if (entry.aliases?.some((a) => a.toLowerCase().includes(term))) return 55;
  if (entry.group?.toLowerCase().includes(term)) return 40;
  if (entry.tags.some((t) => t.includes(term))) return 30;
  if (entry.category.includes(term)) return 25;
  if (entry.tagline.toLowerCase().includes(term)) return 12;
  if (entry.description.toLowerCase().includes(term)) return 6;
  return 0;
}

/** Canonical route for an algorithm. */
export function algorithmHref(entry: Pick<CatalogEntry, 'category' | 'slug'>): string {
  return `/algorithms/${entry.category}/${entry.slug}`;
}

export { CATALOG_CATEGORIES, catalogCategory };
export type { CatalogEntry, CatalogCategory, Difficulty } from './types';
