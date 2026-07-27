/**
 * Growth-curve fitting for the empirical complexity chart.
 *
 * The point of the chart is to close the gap between the complexity *stated* on
 * an algorithm's card and the work it *actually* does. Overlaying a fitted
 * theoretical curve on measured step counts is what turns "O(n log n)" from a
 * label into an observation.
 */

export type GrowthKind =
  | 'constant'
  | 'log'
  | 'linear'
  | 'linearithmic'
  | 'quadratic'
  | 'cubic'
  | 'exponential';

export interface GrowthCurve {
  kind: GrowthKind;
  /** Display label, matching the notation used on the complexity card. */
  label: string;
  f(n: number): number;
}

export const CURVES: GrowthCurve[] = [
  { kind: 'constant', label: 'O(1)', f: () => 1 },
  { kind: 'log', label: 'O(log n)', f: (n) => Math.log2(Math.max(2, n)) },
  { kind: 'linear', label: 'O(n)', f: (n) => n },
  { kind: 'linearithmic', label: 'O(n log n)', f: (n) => n * Math.log2(Math.max(2, n)) },
  { kind: 'quadratic', label: 'O(n²)', f: (n) => n * n },
  { kind: 'cubic', label: 'O(n³)', f: (n) => n * n * n },
  { kind: 'exponential', label: 'O(2ⁿ)', f: (n) => 2 ** Math.min(n, 30) },
];

export interface Sample {
  /** Problem size. */
  n: number;
  /** Measured work — step count, comparisons, whatever the chart is plotting. */
  value: number;
}

/**
 * Least-squares scale factor `k` minimising Σ(value − k·f(n))².
 *
 * Only the scale is fitted, never the shape: the whole point is to test whether
 * the *shape* of a named complexity class matches the data, and fitting extra
 * parameters would let any curve be bent into agreement.
 */
export function fitScale(curve: GrowthCurve, samples: readonly Sample[]): number {
  let numerator = 0;
  let denominator = 0;
  for (const { n, value } of samples) {
    const predicted = curve.f(n);
    numerator += predicted * value;
    denominator += predicted * predicted;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

export interface Fit {
  curve: GrowthCurve;
  scale: number;
  /** Coefficient of determination; 1 is a perfect match. */
  r2: number;
}

/** Fit one curve and score how well it explains the data. */
export function fitCurve(curve: GrowthCurve, samples: readonly Sample[]): Fit {
  const scale = fitScale(curve, samples);
  const mean = samples.reduce((sum, s) => sum + s.value, 0) / Math.max(1, samples.length);

  let residual = 0;
  let variance = 0;
  for (const { n, value } of samples) {
    residual += (value - scale * curve.f(n)) ** 2;
    variance += (value - mean) ** 2;
  }

  // A flat dataset has zero variance, in which case a perfect fit is
  // meaningless rather than impressive — report 0 instead of dividing by zero.
  const r2 = variance === 0 ? 0 : Math.max(0, 1 - residual / variance);
  return { curve, scale, r2 };
}

/**
 * Rank every curve by how well it explains the samples.
 *
 * Returned sorted best-first so the caller can show the winner and still let a
 * curious reader see the runners-up — which matters, because on a small range
 * of `n` several curves genuinely fit almost equally well, and pretending
 * otherwise would teach the wrong lesson.
 */
export function rankCurves(samples: readonly Sample[]): Fit[] {
  if (samples.length < 3) return [];
  return CURVES.map((curve) => fitCurve(curve, samples)).sort((a, b) => b.r2 - a.r2);
}

/** The single best-fitting curve, or `undefined` with too little data. */
export function bestFit(samples: readonly Sample[]): Fit | undefined {
  return rankCurves(samples)[0];
}

/** Find the declared curve matching a complexity string like "O(n log n)". */
export function curveForLabel(label: string): GrowthCurve | undefined {
  const normalised = label.replace(/\s+/g, '').toLowerCase();
  return CURVES.find((c) => c.label.replace(/\s+/g, '').toLowerCase() === normalised);
}
