import type { AlgorithmMeta } from '../types';
import { randInt } from '../dp/DPAlgorithm';
import type { DPInput } from '../dp/DPStep';
import type { DPTracer } from '../dp/DPTracer';
import { MLAlgorithm, ML_CATEGORY } from './MLAlgorithm';

interface Hypothesis {
  name: string;
  prior: number;
  likelihood: number;
}

interface Payload {
  hypotheses: Hypothesis[];
}

function roundPct(value: number): number {
  return Math.round(value * 1000) / 10;
}

export class BayesRule extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'bayes-rule',
    name: 'Bayes Rule',
    category: ML_CATEGORY,
    group: 'Probability',
    description:
      'Updates prior beliefs after seeing evidence. The table separates the prior, likelihood, unnormalised evidence score and final posterior so learners can see exactly where the denominator comes from.',
    complexity: {
      time: { best: 'O(h)', average: 'O(h)', worst: 'O(h)' },
      space: 'O(h)',
    },
    accent: '#38bdf8',
  };

  makeInput(size: number, random: () => number): DPInput {
    const count = Math.max(3, Math.min(size, 8));
    const rawPriors = Array.from({ length: count }, () => randInt(random, 1, 12));
    const total = rawPriors.reduce((sum, value) => sum + value, 0);
    const hypotheses = rawPriors.map((raw, i) => ({
      name: `H${i + 1}`,
      prior: raw / total,
      likelihood: randInt(random, 15, 90) / 100,
    }));

    return {
      rows: count,
      cols: 4,
      rowLabels: hypotheses.map((h) => h.name),
      colLabels: ['prior', 'like', 'joint', 'post'],
      payload: { hypotheses } satisfies Payload,
      title: `${count} hypotheses, one observed evidence event`,
    };
  }

  protected solve(t: DPTracer): void {
    const { hypotheses } = t.payload<Payload>();
    let evidence = 0;

    for (let r = 0; r < hypotheses.length; r += 1) {
      const h = hypotheses[r];
      t.at(1).focus(r, 0, `Start with prior P(${h.name})`);
      t.write(r, 0, roundPct(h.prior));

      t.at(2).focus(r, 1, `Measure likelihood P(E | ${h.name})`);
      t.write(r, 1, roundPct(h.likelihood));

      const joint = h.prior * h.likelihood;
      t.at(3).focus(r, 2, `Joint support for ${h.name} and the evidence`);
      t.read(r, 0);
      t.read(r, 1);
      t.write(r, 2, roundPct(joint), [
        [r, 0],
        [r, 1],
      ]);
      evidence += joint;
    }

    for (let r = 0; r < hypotheses.length; r += 1) {
      t.at(5).focus(r, 3, `Normalise by total evidence P(E) = ${roundPct(evidence)}%`);
      const jointPct = t.read(r, 2);
      const posterior = evidence === 0 ? 0 : jointPct / roundPct(evidence);
      t.at(6).write(r, 3, roundPct(posterior), [[r, 2]], `Posterior P(${hypotheses[r].name} | E)`);
      t.trace(r, 3);
    }
  }
}
