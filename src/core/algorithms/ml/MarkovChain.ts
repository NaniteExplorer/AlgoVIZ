import type { AlgorithmMeta } from '../types';
import { randInt } from '../dp/DPAlgorithm';
import type { DPInput } from '../dp/DPStep';
import type { DPTracer } from '../dp/DPTracer';
import { MLAlgorithm, ML_CATEGORY } from './MLAlgorithm';

interface Payload {
  start: number[];
  transition: number[][];
  steps: number;
}

function roundPct(value: number): number {
  return Math.round(value * 1000) / 10;
}

function normalise(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  return values.map((value) => value / total);
}

export class MarkovChain extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'markov-chain',
    name: 'Markov Chain',
    category: ML_CATEGORY,
    group: 'Probability',
    description:
      'Propagates a probability distribution through repeated transitions. Each row is a time step and each cell shows the probability of being in one state after multiplying by the transition matrix.',
    complexity: {
      time: { best: 'O(t*s^2)', average: 'O(t*s^2)', worst: 'O(t*s^2)' },
      space: 'O(t*s)',
    },
    accent: '#22c55e',
  };

  makeInput(size: number, random: () => number): DPInput {
    const states = Math.max(3, Math.min(6, Math.round(size / 2)));
    const steps = Math.max(4, Math.min(10, size));
    const start = normalise(Array.from({ length: states }, () => randInt(random, 1, 10)));
    const transition = Array.from({ length: states }, () =>
      normalise(Array.from({ length: states }, () => randInt(random, 1, 10))),
    );

    return {
      rows: steps + 1,
      cols: states,
      rowLabels: Array.from({ length: steps + 1 }, (_, i) => `t${i}`),
      colLabels: Array.from({ length: states }, (_, i) => `S${i + 1}`),
      payload: { start, transition, steps } satisfies Payload,
      title: `${states} states over ${steps} transitions`,
    };
  }

  protected solve(t: DPTracer): void {
    const { start, transition, steps } = t.payload<Payload>();
    const states = start.length;

    for (let s = 0; s < states; s += 1) {
      t.at(1).focus(0, s, `Initial probability for state ${s + 1}`);
      t.write(0, s, roundPct(start[s]));
    }

    for (let step = 1; step <= steps; step += 1) {
      for (let to = 0; to < states; to += 1) {
        t.at(3).focus(step, to, `Compute P(S${to + 1}) at t${step}`);
        let probability = 0;
        const fromCells: [number, number][] = [];
        for (let from = 0; from < states; from += 1) {
          const previous = t.at(4).read(step - 1, from) / 100;
          probability += previous * transition[from][to];
          fromCells.push([step - 1, from]);
        }
        t.at(5).write(step, to, roundPct(probability), fromCells);
      }
    }

    const finalRow = steps;
    let best = 0;
    for (let s = 1; s < states; s += 1) if (t.peek(finalRow, s) > t.peek(finalRow, best)) best = s;
    t.at(6).trace(finalRow, best, `Most likely final state is S${best + 1}`);
  }
}
