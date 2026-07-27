import type { AlgorithmMeta } from '../types';
import { randInt } from '../dp/DPAlgorithm';
import type { DPInput } from '../dp/DPStep';
import type { DPTracer } from '../dp/DPTracer';
import { MLAlgorithm, ML_CATEGORY } from './MLAlgorithm';

const round = (value: number) => Math.round(value * 10) / 10;
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export class PerceptronLearning extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'perceptron',
    name: 'Perceptron',
    category: ML_CATEGORY,
    group: 'Neural Networks',
    description:
      'Learns a linear classifier by updating weights only when a training example is misclassified.',
    complexity: {
      time: { best: 'O(en)', average: 'O(en)', worst: 'O(en)' },
      space: 'O(d)',
    },
    accent: '#f43f5e',
  };

  makeInput(size: number, random: () => number): DPInput {
    const epochs = Math.max(5, Math.min(10, size));
    const samples = Array.from({ length: Math.max(6, Math.min(12, size + 2)) }, () => {
      const x1 = randInt(random, -4, 4);
      const x2 = randInt(random, -4, 4);
      return { x1, x2, y: x1 + x2 >= 0 ? 1 : -1 };
    });
    return {
      rows: epochs,
      cols: 4,
      rowLabels: Array.from({ length: epochs }, (_, i) => `pass ${i + 1}`),
      colLabels: ['w1', 'w2', 'bias', 'errors'],
      payload: { samples, epochs },
      title: `${samples.length} linearly separable samples`,
    };
  }

  protected solve(t: DPTracer): void {
    const { samples, epochs } = t.payload<{
      samples: { x1: number; x2: number; y: number }[];
      epochs: number;
    }>();
    let w1 = 0;
    let w2 = 0;
    let b = 0;
    for (let epoch = 0; epoch < epochs; epoch += 1) {
      let errors = 0;
      for (const sample of samples) {
        const pred = w1 * sample.x1 + w2 * sample.x2 + b >= 0 ? 1 : -1;
        if (pred !== sample.y) {
          w1 += sample.y * sample.x1;
          w2 += sample.y * sample.x2;
          b += sample.y;
          errors += 1;
        }
      }
      t.at(3).focus(epoch, 0, 'Update the first feature weight after mistakes');
      t.write(epoch, 0, round(w1));
      t.write(epoch, 1, round(w2));
      t.write(epoch, 2, round(b));
      t.write(epoch, 3, errors);
    }
    t.trace(epochs - 1, 3, 'Training pass error count');
  }
}

export class NeuralNetworkForwardPass extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'nn-forward-pass',
    name: 'Neural Network Forward Pass',
    category: ML_CATEGORY,
    group: 'Neural Networks',
    description:
      'Pushes inputs through hidden neurons and output neurons, showing weighted sums and activations layer by layer.',
    complexity: {
      time: { best: 'O(E)', average: 'O(E)', worst: 'O(E)' },
      space: 'O(V)',
    },
    accent: '#a855f7',
  };

  makeInput(_size: number, _random: () => number): DPInput {
    return {
      rows: 4,
      cols: 4,
      rowLabels: ['input', 'z hidden', 'a hidden', 'output'],
      colLabels: ['n1', 'n2', 'n3', 'n4'],
      payload: {
        input: [0.7, -0.4, 0.9],
        hiddenWeights: [
          [0.8, -0.3, 0.4],
          [-0.5, 0.9, 0.2],
          [0.3, 0.4, -0.7],
          [0.6, 0.1, 0.5],
        ],
        outputWeights: [0.5, -0.8, 0.7, 0.4],
      },
      title: 'Dense network: input -> hidden -> output',
    };
  }

  protected solve(t: DPTracer): void {
    const { input, hiddenWeights, outputWeights } = t.payload<{
      input: number[];
      hiddenWeights: number[][];
      outputWeights: number[];
    }>();
    for (let i = 0; i < input.length; i += 1) {
      t.at(1).focus(0, i, `Input activation ${i + 1}`);
      t.write(0, i, round(input[i]));
    }
    const hidden = hiddenWeights.map((weights, h) => {
      const z = weights.reduce((sum, weight, i) => sum + weight * input[i], 0);
      t.at(2).focus(1, h, `Weighted sum for hidden neuron ${h + 1}`);
      t.write(1, h, round(z));
      const a = sigmoid(z);
      t.at(3).write(2, h, round(a), [[1, h]]);
      return a;
    });
    const zOut = hidden.reduce((sum, a, h) => sum + a * outputWeights[h], 0);
    t.at(5).focus(3, 0, 'Output logit combines hidden activations');
    for (let h = 0; h < hidden.length; h += 1) t.read(2, h);
    t.write(3, 0, round(sigmoid(zOut)), hidden.map((_, h) => [2, h] as const), 'Final output probability');
    t.trace(3, 0);
  }
}

export class Backpropagation extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'backpropagation',
    name: 'Backpropagation',
    category: ML_CATEGORY,
    group: 'Neural Networks',
    description:
      'Computes output error, sends it backward through hidden neurons and applies gradient updates to weights.',
    complexity: {
      time: { best: 'O(E)', average: 'O(E)', worst: 'O(E)' },
      space: 'O(V)',
    },
    accent: '#ef4444',
  };

  makeInput(size: number, _random: () => number): DPInput {
    const steps = Math.max(5, Math.min(10, size));
    return {
      rows: steps,
      cols: 4,
      rowLabels: Array.from({ length: steps }, (_, i) => `step ${i + 1}`),
      colLabels: ['forward', 'loss', 'delta out', 'delta hid'],
      payload: { steps },
      title: 'One tiny network learning one labelled example',
    };
  }

  protected solve(t: DPTracer): void {
    const { steps } = t.payload<{ steps: number }>();
    let w = 0.4;
    const x = 1;
    const y = 1;
    const lr = 0.6;
    for (let s = 0; s < steps; s += 1) {
      const pred = sigmoid(w * x);
      const loss = 0.5 * (pred - y) ** 2;
      const deltaOut = (pred - y) * pred * (1 - pred);
      const deltaHidden = deltaOut * w;
      w -= lr * deltaOut * x;
      t.at(1).focus(s, 0, 'Forward pass prediction');
      t.write(s, 0, round(pred));
      t.at(2).write(s, 1, round(loss), [[s, 0]]);
      t.at(3).write(s, 2, round(deltaOut), [[s, 1]]);
      t.at(4).write(s, 3, round(deltaHidden), [[s, 2]]);
    }
    t.trace(steps - 1, 1, 'Loss after repeated gradient updates');
  }
}

export class CNNConvolution extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'cnn-convolution',
    name: 'CNN Convolution',
    category: ML_CATEGORY,
    group: 'Deep Learning',
    description:
      'Slides a kernel across an image patch and writes each activation in the output feature map.',
    complexity: {
      time: { best: 'O(h*w*k^2)', average: 'O(h*w*k^2)', worst: 'O(h*w*k^2)' },
      space: 'O(h*w)',
    },
    accent: '#f59e0b',
  };

  makeInput(_size: number, _random: () => number): DPInput {
    return {
      rows: 3,
      cols: 3,
      rowLabels: ['y0', 'y1', 'y2'],
      colLabels: ['x0', 'x1', 'x2'],
      payload: {
        image: [
          [2, 1, 0, 2, 3],
          [1, 3, 2, 1, 0],
          [0, 2, 4, 2, 1],
          [3, 1, 2, 0, 2],
          [2, 0, 1, 3, 1],
        ],
        kernel: [
          [1, 0, -1],
          [1, 0, -1],
          [1, 0, -1],
        ],
      },
      title: '3x3 edge-detection kernel over a 5x5 image',
    };
  }

  protected solve(t: DPTracer): void {
    const { image, kernel } = t.payload<{ image: number[][]; kernel: number[][] }>();
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        let sum = 0;
        for (let kr = 0; kr < 3; kr += 1) {
          for (let kc = 0; kc < 3; kc += 1) sum += image[r + kr][c + kc] * kernel[kr][kc];
        }
        t.at(3).focus(r, c, `Apply kernel at output cell (${r}, ${c})`);
        t.write(r, c, sum);
      }
    }
    t.trace(1, 1, 'Central feature activation');
  }
}

export class SelfAttention extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'self-attention',
    name: 'Self-Attention',
    category: ML_CATEGORY,
    group: 'Deep Learning',
    description:
      'Computes token-to-token attention weights, showing how every token decides what context to read from the sequence.',
    complexity: {
      time: { best: 'O(n^2d)', average: 'O(n^2d)', worst: 'O(n^2d)' },
      space: 'O(n^2)',
    },
    accent: '#6366f1',
  };

  makeInput(size: number, random: () => number): DPInput {
    const tokens = Math.max(4, Math.min(8, size));
    const q = Array.from({ length: tokens }, () => randInt(random, -3, 3));
    const k = Array.from({ length: tokens }, () => randInt(random, -3, 3));
    return {
      rows: tokens,
      cols: tokens,
      rowLabels: Array.from({ length: tokens }, (_, i) => `Q${i + 1}`),
      colLabels: Array.from({ length: tokens }, (_, i) => `K${i + 1}`),
      payload: { q, k },
      title: `${tokens} tokens, scaled dot-product attention scores`,
    };
  }

  protected solve(t: DPTracer): void {
    const { q, k } = t.payload<{ q: number[]; k: number[] }>();
    for (let r = 0; r < q.length; r += 1) {
      const raw = k.map((value) => q[r] * value);
      const max = Math.max(...raw);
      const exps = raw.map((value) => Math.exp(value - max));
      const total = exps.reduce((sum, value) => sum + value, 0);
      for (let c = 0; c < k.length; c += 1) {
        t.at(2).focus(r, c, `Query ${r + 1} scores key ${c + 1}`);
        t.write(r, c, round((exps[c] / total) * 100));
      }
    }
    t.trace(0, 0, 'Attention rows sum to 100%');
  }
}
