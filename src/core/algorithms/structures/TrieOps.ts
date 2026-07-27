import type { AlgorithmMeta } from '../types';
import { randInt, StructureAlgorithm, STRUCTURES_CATEGORY } from './StructureAlgorithm';
import type { StructureInput, StructureOp } from './StructureStep';
import type { StructureTracer } from './StructureTracer';

/** Words sharing prefixes, so the trie actually branches instead of forking at the root. */
const WORD_POOL = [
  'car',
  'cart',
  'card',
  'care',
  'cat',
  'cap',
  'dog',
  'door',
  'dot',
  'do',
  'sun',
  'sung',
  'sunk',
  'sit',
];

/**
 * Prefix tree (trie).
 *
 * Chosen for the family because it is the one structure whose *shape is the
 * data*: shared prefixes are shared paths, so the saving is visible rather than
 * asymptotic. Lookup cost depends on the key length, not on how many keys are
 * stored — which is why autocomplete uses one.
 */
export class TrieOps extends StructureAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'trie',
    name: 'Trie',
    category: STRUCTURES_CATEGORY,
    group: 'Trees',
    description:
      'Stores strings by sharing their common prefixes, so "car", "cart" and "card" walk the same first three nodes. Lookup costs one step per character regardless of how many words are stored — the property that makes tries the natural structure for autocomplete and routing tables.',
    complexity: {
      time: { best: 'O(m)', average: 'O(m)', worst: 'O(m)' },
      space: 'O(ALPHABET · N · m)',
    },
    accent: '#38bdf8',
  };

  makeInput(size: number, random: () => number): StructureInput {
    const count = Math.max(4, Math.min(size, 10));
    const pool = [...WORD_POOL];
    const words: string[] = [];
    for (let i = 0; i < count && pool.length; i += 1) {
      words.push(pool.splice(randInt(random, 0, pool.length - 1), 1)[0]);
    }

    const ops: StructureOp[] = words.map((word) => ({ kind: 'insert', value: 0, key: word }));
    // Finish with a couple of lookups: one present, one absent.
    ops.push({ kind: 'search', value: 0, key: words[randInt(random, 0, words.length - 1)] });
    ops.push({ kind: 'search', value: 0, key: 'cane' });

    return {
      layout: 'tree',
      ops,
      title: `${words.length} words in a prefix tree`,
    };
  }

  protected execute(t: StructureTracer): void {
    // The root holds no character; every other node is one character.
    const root = t.create(0, { label: '·', note: 'the empty prefix' });

    for (const op of t.ops) {
      const word = op.key ?? '';
      if (!word) continue;

      if (op.kind === 'insert') {
        t.at(1).phase(`insert "${word}"`);
        let node = root;
        for (const character of word) {
          t.at(3).focus(node);
          const existing = t.portOf(node, character);
          if (existing !== undefined) {
            // Reusing an existing edge *is* the prefix sharing.
            t.at(4).focus(existing, `'${character}' already exists — share the prefix`);
            node = existing;
            continue;
          }
          const child = t.create(character.charCodeAt(0), { label: character });
          t.at(5).link(node, character, child, `add a new '${character}' branch`);
          node = child;
        }
        t.at(6).tag(node, 'found', `"${word}" ends here`);
        continue;
      }

      t.at(8).phase(`search "${word}"`);
      let node: number | undefined = root;
      let matched = '';
      for (const character of word) {
        t.at(9).focus(node);
        node = t.portOf(node, character);
        if (node === undefined) {
          t.at(10).phase(`no '${character}' branch after "${matched}" — "${word}" is absent`);
          break;
        }
        matched += character;
      }
      if (node !== undefined) t.at(11).tag(node, 'found', `"${word}" is in the trie`);
    }
  }
}
