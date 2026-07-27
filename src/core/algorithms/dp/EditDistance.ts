import type { AlgorithmMeta } from '../types';
import { DPAlgorithm, DP_CATEGORY, randInt } from './DPAlgorithm';
import type { DPInput } from './DPStep';
import type { DPTracer } from './DPTracer';

interface Payload {
  a: string;
  b: string;
}

const WORDS = [
  'kitten',
  'sitting',
  'flaw',
  'lawn',
  'intention',
  'execution',
  'sunday',
  'saturday',
  'algorithm',
  'logarithm',
];

/**
 * Levenshtein edit distance.
 *
 * The mirror image of LCS: same grid, same three predecessors, but minimising
 * cost instead of maximising length. Seeing them side by side is the clearest
 * demonstration in the catalog that "a DP" is a *shape*, not a trick — the
 * table and the traversal are identical, only the recurrence differs.
 */
export class EditDistance extends DPAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'edit-distance',
    name: 'Edit Distance',
    category: DP_CATEGORY,
    group: 'String DP',
    description:
      'Computes the minimum number of single-character insertions, deletions or substitutions needed to turn one string into another. Each cell takes the cheapest of its three predecessors, plus one unless the characters already match. Also known as Levenshtein distance.',
    complexity: {
      time: { best: 'O(mn)', average: 'O(mn)', worst: 'O(mn)' },
      space: 'O(mn)',
    },
    accent: '#fb7185',
  };

  makeInput(size: number, random: () => number): DPInput {
    // Real word pairs beat random strings here: "kitten → sitting" is a
    // recognisable example, and the edit script is meaningful rather than noise.
    const pairIndex = randInt(random, 0, WORDS.length / 2 - 1) * 2;
    const limit = Math.max(4, Math.min(size, 12));
    const a = WORDS[pairIndex].slice(0, limit);
    const b = WORDS[pairIndex + 1].slice(0, limit);

    return {
      rows: a.length + 1,
      cols: b.length + 1,
      rowLabels: ['∅', ...a.split('')],
      colLabels: ['∅', ...b.split('')],
      payload: { a, b } satisfies Payload,
      title: `"${a}" → "${b}"`,
    };
  }

  protected solve(t: DPTracer): void {
    const { a, b } = t.payload<Payload>();

    // Base cases: turning a prefix into the empty string costs one deletion
    // per character, and vice versa for insertions.
    t.at(1);
    for (let j = 0; j <= b.length; j += 1) t.write(0, j, j);
    for (let i = 1; i <= a.length; i += 1) t.write(i, 0, i);

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const same = a[i - 1] === b[j - 1];
        t.at(3).focus(i, j, `'${a[i - 1]}' vs '${b[j - 1]}'`);

        const del = t.at(4).read(i - 1, j) + 1;
        const ins = t.at(5).read(i, j - 1) + 1;
        const sub = t.at(6).read(i - 1, j - 1) + (same ? 0 : 1);

        const best = Math.min(del, ins, sub);
        const label = best === sub ? (same ? 'match' : 'sub') : best === del ? 'del' : 'ins';
        t.at(7).decide(i, j, label, describeChoice(label, a[i - 1], b[j - 1]));
        t.write(i, j, best, [
          [i - 1, j],
          [i, j - 1],
          [i - 1, j - 1],
        ]);
      }
    }

    // Traceback recovers the actual edit script, not just its length.
    t.at(9);
    let i = a.length;
    let j = b.length;
    while (i > 0 || j > 0) {
      t.trace(i, j);
      if (i > 0 && j > 0 && t.peek(i, j) === t.peek(i - 1, j - 1) + (a[i - 1] === b[j - 1] ? 0 : 1)) {
        i -= 1;
        j -= 1;
      } else if (i > 0 && t.peek(i, j) === t.peek(i - 1, j) + 1) {
        i -= 1;
      } else {
        j -= 1;
      }
    }
    t.trace(0, 0, `distance = ${t.peek(a.length, b.length)}`);
  }
}

function describeChoice(label: string, from: string, to: string): string {
  switch (label) {
    case 'match':
      return `'${from}' already matches — no cost`;
    case 'sub':
      return `substitute '${from}' → '${to}'`;
    case 'del':
      return `delete '${from}'`;
    default:
      return `insert '${to}'`;
  }
}
