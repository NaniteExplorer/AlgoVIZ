import type { AlgorithmMeta } from '../types';
import type { DPInput } from '../dp/DPStep';
import type { DPTracer } from '../dp/DPTracer';
import { MLAlgorithm, ML_CATEGORY } from './MLAlgorithm';

const round = (value: number) => Math.round(value * 10) / 10;

export class QLearning extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'q-learning',
    name: 'Q-Learning',
    category: ML_CATEGORY,
    group: 'Reinforcement Learning',
    description:
      'Updates action values using reward plus discounted future value, gradually learning which action is best in each state.',
    complexity: {
      time: { best: 'O(episodes * steps)', average: 'O(episodes * steps)', worst: 'O(episodes * steps)' },
      space: 'O(states * actions)',
    },
    accent: '#84cc16',
  };

  makeInput(size: number, _random: () => number): DPInput {
    const episodes = Math.max(5, Math.min(10, size));
    return {
      rows: episodes,
      cols: 4,
      rowLabels: Array.from({ length: episodes }, (_, i) => `episode ${i + 1}`),
      colLabels: ['Q(s0,L)', 'Q(s0,R)', 'Q(s1,L)', 'Q(s1,R)'],
      payload: { episodes },
      title: 'Tiny 2-state agent learning action values',
    };
  }

  protected solve(t: DPTracer): void {
    const { episodes } = t.payload<{ episodes: number }>();
    const q = [
      [0, 0],
      [0, 0],
    ];
    const alpha = 0.5;
    const gamma = 0.8;
    const script = [
      [0, 1, 1, 1],
      [1, 1, 1, 2],
      [0, 0, 0, -1],
      [0, 1, 1, 1],
      [1, 1, 1, 2],
    ];

    for (let e = 0; e < episodes; e += 1) {
      const [state, action, next, reward] = script[e % script.length];
      const bestNext = Math.max(q[next][0], q[next][1]);
      q[state][action] += alpha * (reward + gamma * bestNext - q[state][action]);
      for (let s = 0; s < 2; s += 1) {
        for (let a = 0; a < 2; a += 1) {
          const c = s * 2 + a;
          t.at(3).focus(e, c, `Update Q-value from reward and future value`);
          t.write(e, c, round(q[s][a]));
        }
      }
    }
    t.trace(episodes - 1, 1, 'Learned high-value action from state 0');
  }
}
