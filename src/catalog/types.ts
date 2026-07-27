import type { AlgorithmCategory, ComplexityProfile } from '@/core/algorithms/types';

/** Rough teaching order, used for filtering and for the "start here" rails. */
export type Difficulty = 'intro' | 'core' | 'advanced';

/**
 * Everything the chrome needs to route to, list, search and describe an
 * algorithm — without instantiating one or loading a renderer.
 *
 * Fields split into two halves: the ones mirrored from `AlgorithmMeta` (name,
 * complexity, accent — always in sync because they are *read* from the
 * registry, never copied) and the presentation-only ones that have no business
 * living on a runtime algorithm class (tagline, tags, aliases, related).
 */
export interface CatalogEntry {
  /** URL segment; identical to `AlgorithmMeta.id`. */
  slug: string;
  name: string;
  category: AlgorithmCategory;
  /** Optional sub-group within the category ("MST", "String DP"). */
  group?: string;
  /** One-line summary for cards, the sidebar and `<meta description>`. */
  tagline: string;
  /** Full paragraph from the algorithm's own metadata. */
  description: string;
  complexity: ComplexityProfile;
  /** Accent hex for dark mode. */
  accent: string;
  /**
   * Darker accent for light mode.
   *
   * Several of the neon accents fall below 4.5:1 against a white surface, so
   * entries that need it declare an alternative rather than the UI guessing.
   */
  accentLight?: string;
  difficulty: Difficulty;
  /** Free-form keywords for command-palette matching. */
  tags: string[];
  /** Alternative names a learner might type ("quicksort", "hoare"). */
  aliases?: string[];
  /** Slugs of algorithms worth looking at next. */
  related?: string[];
}

/** Presentation metadata for one family. */
export interface CatalogCategory {
  category: AlgorithmCategory;
  /** Short label for nav and tabs. */
  label: string;
  /** Studio/route heading. */
  title: string;
  /** One-line description shown in the catalog and on the family page. */
  blurb: string;
}
