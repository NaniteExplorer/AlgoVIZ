import { type Algorithm, AlgorithmCategory, type AlgorithmMeta } from '../types';
import type { StructureInput, StructureOp, StructureStep } from './StructureStep';
import { StructureTracer } from './StructureTracer';

/**
 * Abstract base for every data-structure demonstration.
 *
 * The subclass executes a *script of operations* rather than solving a single
 * problem, because that is what a data structure is: behaviour over a sequence
 * of insertions, deletions and lookups. `makeInput` generates that script.
 */
export abstract class StructureAlgorithm implements Algorithm<StructureInput, StructureStep> {
  abstract readonly meta: AlgorithmMeta;

  /** Run the operation script against the tracer. */
  protected abstract execute(tracer: StructureTracer): void;

  abstract makeInput(size: number, random: () => number): StructureInput;

  run(input: StructureInput): StructureStep[] {
    const tracer = new StructureTracer(input);
    this.execute(tracer);
    tracer.done('all operations complete');
    return [...tracer.steps];
  }
}

export const STRUCTURES_CATEGORY = AlgorithmCategory.Structures;

export function randInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * A script of distinct random values with a realistic operation mix.
 *
 * Inserts dominate so the structure actually grows into something worth
 * looking at, with deletes and searches sprinkled through the tail — a script
 * that is half deletions never builds anything.
 */
export function makeOpScript(
  count: number,
  random: () => number,
  kinds: { insert: StructureOp['kind']; remove?: StructureOp['kind']; find?: StructureOp['kind'] },
): StructureOp[] {
  const ops: StructureOp[] = [];
  const inserted: number[] = [];
  const pool = new Set<number>();

  const distinct = () => {
    let v = randInt(random, 1, 99);
    while (pool.has(v)) v = randInt(random, 1, 99);
    pool.add(v);
    return v;
  };

  for (let i = 0; i < count; i += 1) {
    // The first third is pure insertion, so there is something to operate on.
    const roll = i < count / 3 ? 0 : random();
    if (roll < 0.6 || inserted.length === 0) {
      const value = distinct();
      inserted.push(value);
      ops.push({ kind: kinds.insert, value });
    } else if (roll < 0.8 && kinds.remove) {
      const index = randInt(random, 0, inserted.length - 1);
      ops.push({ kind: kinds.remove, value: inserted[index] });
      inserted.splice(index, 1);
    } else if (kinds.find) {
      ops.push({ kind: kinds.find, value: inserted[randInt(random, 0, inserted.length - 1)] });
    } else {
      ops.push({ kind: kinds.insert, value: distinct() });
    }
  }

  return ops;
}
