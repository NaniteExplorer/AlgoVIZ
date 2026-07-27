import type { AlgorithmMeta } from '../types';
import { DPAlgorithm, DP_CATEGORY, randInt } from './DPAlgorithm';
import type { DPInput } from './DPStep';
import type { DPTracer } from './DPTracer';

interface Payload {
  a: string;
  b: string;
}

const ALPHABET = 'ABCDGT';

/**
 * Longest common subsequence.
 *
 * The archetypal string DP, and the engine behind `diff`. Its recurrence has a
 * pleasing shape on screen: a diagonal step means "these characters match", a
 * step up or left means "drop a character from one string" — so the traceback
 * literally draws the alignment.
 */
export class LongestCommonSubsequence extends DPAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'lcs',
    name: 'Longest Common Subsequence',
    category: DP_CATEGORY,
    group: 'String DP',
    description:
      'Finds the longest sequence of characters appearing in both strings in the same relative order (not necessarily contiguously). Matching characters extend the diagonal predecessor by one; otherwise the cell inherits the better of its top and left neighbours. This recurrence is what powers diff tools.',
    complexity: {
      time: { best: 'O(mn)', average: 'O(mn)', worst: 'O(mn)' },
      space: 'O(mn)',
    },
    accent: '#a78bfa',
  };

  makeInput(size: number, random: () => number): DPInput {
    const n = Math.max(3, Math.min(size, 12));
    const pick = () => ALPHABET[randInt(random, 0, ALPHABET.length - 1)];
    const a = Array.from({ length: n }, pick).join('');
    // Derive B from A so the two strings genuinely share structure — two
    // independent random strings usually have a near-empty LCS, which makes
    // for a boring and unrepresentative table.
    const b = Array.from({ length: n }, () =>
      random() < 0.55 ? a[randInt(random, 0, n - 1)] : pick(),
    ).join('');

    return {
      rows: a.length + 1,
      cols: b.length + 1,
      rowLabels: ['∅', ...a.split('')],
      colLabels: ['∅', ...b.split('')],
      payload: { a, b } satisfies Payload,
      title: `"${a}" vs "${b}"`,
    };
  }

  protected solve(t: DPTracer): void {
    const { a, b } = t.payload<Payload>();

    t.at(1);
    for (let j = 0; j <= b.length; j += 1) t.write(0, j, 0);
    for (let i = 1; i <= a.length; i += 1) t.write(i, 0, 0);

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        t.at(3).focus(i, j, `compare '${a[i - 1]}' with '${b[j - 1]}'`);

        if (a[i - 1] === b[j - 1]) {
          const diagonal = t.at(4).read(i - 1, j - 1);
          t.at(5).decide(i, j, 'match', `'${a[i - 1]}' matches — extend the diagonal`);
          t.write(i, j, diagonal + 1, [[i - 1, j - 1]]);
        } else {
          const up = t.at(7).read(i - 1, j);
          const left = t.at(7).read(i, j - 1);
          const best = Math.max(up, left);
          t.at(8).decide(i, j, up >= left ? '↑' : '←', 'no match — carry the better neighbour');
          t.write(i, j, best, [
            [i - 1, j],
            [i, j - 1],
          ]);
        }
      }
    }

    // Traceback from the bottom-right corner reconstructs the subsequence.
    t.at(10);
    let i = a.length;
    let j = b.length;
    const result: string[] = [];
    while (i > 0 && j > 0) {
      t.trace(i, j);
      if (a[i - 1] === b[j - 1]) {
        result.unshift(a[i - 1]);
        i -= 1;
        j -= 1;
      } else if (t.peek(i - 1, j) >= t.peek(i, j - 1)) {
        i -= 1;
      } else {
        j -= 1;
      }
    }
    t.at(11).decide(0, 0, '', `LCS = "${result.join('')}" (length ${result.length})`);
  }
}
