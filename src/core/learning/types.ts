/**
 * Structured lesson content.
 *
 * Typed blocks rather than markdown: the app needs exactly six block shapes,
 * and a markdown parser would be a runtime dependency plus a sanitisation
 * surface, in exchange for authoring convenience the content volume here does
 * not justify. Typed blocks also mean a malformed lesson is a compile error.
 */
export type LessonBlock =
  | { type: 'p'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'code'; lines: string[]; caption?: string }
  | { type: 'callout'; tone: 'insight' | 'warning' | 'complexity'; text: string }
  | { type: 'formula'; text: string };

/**
 * Where in the run something is anchored.
 *
 * Fractions are preferred over absolute step indices because the timeline
 * length depends on the generated instance — a checkpoint pinned to "step 240"
 * would land in a different place every time the dataset is re-rolled.
 */
export type Anchor = { fraction: number } | { stepIndex: number };

export interface LessonSection {
  id: string;
  title: string;
  blocks: LessonBlock[];
  /** When this section becomes the active one during playback. */
  anchor?: Anchor;
  /** Pseudocode lines to spotlight while this section is active. */
  highlightLines?: number[];
}

export interface Checkpoint {
  id: string;
  /** Playback pauses here and poses the question. */
  anchor: Anchor;
  question: string;
  kind: 'choice' | 'predict-metric';
  /** For `choice`. */
  options?: string[];
  /**
   * Index into `options` for `choice`; the true value for `predict-metric`.
   *
   * A `predict-metric` answer is left undefined in content and resolved at
   * runtime from the actual metric series — asking a learner to predict a
   * number and then grading them against a hard-coded one would be wrong the
   * moment the dataset changes.
   */
  answer?: number;
  /** Which metric a `predict-metric` question is about. */
  metricKey?: string;
  /** Accepted error, as a fraction of the true value. */
  tolerance?: number;
  explanation: string;
}

export interface Lesson {
  algorithmId: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  sections: LessonSection[];
  checkpoints: Checkpoint[];
  /** Algorithm slugs worth understanding first. */
  prerequisites?: string[];
}

/** Resolve an anchor against a concrete timeline length. */
export function resolveAnchor(anchor: Anchor, total: number): number {
  if ('stepIndex' in anchor) return Math.min(anchor.stepIndex, Math.max(0, total - 1));
  return Math.max(0, Math.min(Math.round(anchor.fraction * total), Math.max(0, total - 1)));
}
