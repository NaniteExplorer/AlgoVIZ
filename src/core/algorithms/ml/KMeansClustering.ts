import type { AlgorithmMeta } from '../types';
import { randInt } from '../dp/DPAlgorithm';
import type { DPInput } from '../dp/DPStep';
import type { DPTracer } from '../dp/DPTracer';
import { MLAlgorithm, ML_CATEGORY } from './MLAlgorithm';

interface Point {
  x: number;
  y: number;
}

interface Payload {
  points: Point[];
  k: number;
  iterations: number;
}

function distance2(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export class KMeansClustering extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'k-means',
    name: 'K-Means Clustering',
    category: ML_CATEGORY,
    group: 'Machine Learning',
    description:
      'Alternates between assigning each point to the nearest centroid and moving centroids to the average of their assigned points. The grid shows cluster labels stabilising over iterations.',
    complexity: {
      time: { best: 'O(nki)', average: 'O(nki)', worst: 'O(nki)' },
      space: 'O(n + k)',
    },
    accent: '#f97316',
  };

  makeInput(size: number, random: () => number): DPInput {
    const count = Math.max(5, Math.min(12, size));
    const k = count < 8 ? 2 : 3;
    const iterations = Math.max(4, Math.min(8, Math.round(size / 2)));
    const points = Array.from({ length: count }, () => ({
      x: randInt(random, 0, 20),
      y: randInt(random, 0, 20),
    }));

    return {
      rows: iterations,
      cols: count,
      rowLabels: Array.from({ length: iterations }, (_, i) => `iter ${i + 1}`),
      colLabels: points.map((_, i) => `P${i + 1}`),
      payload: { points, k, iterations } satisfies Payload,
      title: `${count} points, ${k} clusters`,
    };
  }

  protected solve(t: DPTracer): void {
    const { points, k, iterations } = t.payload<Payload>();
    let centroids = points.slice(0, k).map((p) => ({ ...p }));

    for (let iter = 0; iter < iterations; iter += 1) {
      const assignments: number[] = [];

      for (let i = 0; i < points.length; i += 1) {
        t.at(2).focus(iter, i, `Assign P${i + 1} to its nearest centroid`);
        let best = 0;
        let bestDistance = distance2(points[i], centroids[0]);
        for (let c = 1; c < centroids.length; c += 1) {
          const candidate = distance2(points[i], centroids[c]);
          if (candidate < bestDistance) {
            best = c;
            bestDistance = candidate;
          }
        }
        assignments[i] = best;
        t.at(3).decide(iter, i, `C${best + 1}`, `Nearest centroid is C${best + 1}`);
        t.write(iter, i, best + 1);
      }

      t.at(5);
      centroids = centroids.map((centroid, c) => {
        const members = points.filter((_, i) => assignments[i] === c);
        if (members.length === 0) return centroid;
        return {
          x: members.reduce((sum, p) => sum + p.x, 0) / members.length,
          y: members.reduce((sum, p) => sum + p.y, 0) / members.length,
        };
      });
    }

    const last = iterations - 1;
    for (let i = 0; i < points.length; i += 1) t.trace(last, i);
  }
}
