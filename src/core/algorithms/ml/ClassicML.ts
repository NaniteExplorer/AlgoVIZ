import type { AlgorithmMeta } from '../types';
import { randInt } from '../dp/DPAlgorithm';
import type { DPInput } from '../dp/DPStep';
import type { DPTracer } from '../dp/DPTracer';
import { MLAlgorithm, ML_CATEGORY } from './MLAlgorithm';

interface DatasetPayload {
  x: number[];
  y: number[];
  epochs: number;
}

interface BinaryPayload {
  x: number[];
  y: number[];
  epochs: number;
}

interface PCAInputPayload {
  centered: number[][];
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const round = (value: number) => Math.round(value * 10) / 10;

export class LinearRegressionGradientDescent extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'linear-regression-gd',
    name: 'Linear Regression',
    category: ML_CATEGORY,
    group: 'ML Foundations',
    description:
      'Fits a straight line by gradient descent. Each epoch writes the current slope, intercept and mean squared error so learners can see the loss shrink as parameters move.',
    complexity: {
      time: { best: 'O(en)', average: 'O(en)', worst: 'O(en)' },
      space: 'O(1)',
    },
    accent: '#06b6d4',
  };

  makeInput(size: number, random: () => number): DPInput {
    const n = Math.max(5, Math.min(12, size));
    const epochs = Math.max(5, Math.min(10, size));
    const slope = randInt(random, 1, 4);
    const intercept = randInt(random, -3, 3);
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = x.map((v) => slope * v + intercept + randInt(random, -2, 2));
    return {
      rows: epochs,
      cols: 3,
      rowLabels: Array.from({ length: epochs }, (_, i) => `epoch ${i + 1}`),
      colLabels: ['slope', 'bias', 'mse'],
      payload: { x, y, epochs } satisfies DatasetPayload,
      title: `${n} points fitted with gradient descent`,
    };
  }

  protected solve(t: DPTracer): void {
    const { x, y, epochs } = t.payload<DatasetPayload>();
    let m = 0;
    let b = 0;
    const lr = 0.01;

    for (let epoch = 0; epoch < epochs; epoch += 1) {
      let dm = 0;
      let db = 0;
      let mse = 0;
      for (let i = 0; i < x.length; i += 1) {
        const pred = m * x[i] + b;
        const err = pred - y[i];
        dm += (2 / x.length) * err * x[i];
        db += (2 / x.length) * err;
        mse += (err * err) / x.length;
      }
      m -= lr * dm;
      b -= lr * db;
      t.at(2).focus(epoch, 0, `Update slope using the loss gradient`);
      t.write(epoch, 0, round(m));
      t.at(3).focus(epoch, 1, `Update intercept using the loss gradient`);
      t.write(epoch, 1, round(b));
      t.at(4).focus(epoch, 2, `Mean squared error after epoch ${epoch + 1}`);
      t.write(epoch, 2, round(mse));
    }
    t.trace(epochs - 1, 2, 'Final fitted loss');
  }
}

export class LogisticRegression extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'logistic-regression',
    name: 'Logistic Regression',
    category: ML_CATEGORY,
    group: 'ML Foundations',
    description:
      'Learns a binary decision boundary with sigmoid probabilities. The visualization tracks weight, bias, log loss and accuracy over training epochs.',
    complexity: {
      time: { best: 'O(en)', average: 'O(en)', worst: 'O(en)' },
      space: 'O(1)',
    },
    accent: '#ec4899',
  };

  makeInput(size: number, random: () => number): DPInput {
    const n = Math.max(6, Math.min(14, size + 2));
    const epochs = Math.max(5, Math.min(10, size));
    const x = Array.from({ length: n }, (_, i) => i - Math.floor(n / 2));
    const threshold = randInt(random, -1, 2);
    const y = x.map((v) => (v + randInt(random, -1, 1) > threshold ? 1 : 0));
    return {
      rows: epochs,
      cols: 4,
      rowLabels: Array.from({ length: epochs }, (_, i) => `epoch ${i + 1}`),
      colLabels: ['weight', 'bias', 'loss', 'acc'],
      payload: { x, y, epochs } satisfies BinaryPayload,
      title: `${n} labelled points, sigmoid classifier`,
    };
  }

  protected solve(t: DPTracer): void {
    const { x, y, epochs } = t.payload<BinaryPayload>();
    let w = 0;
    let b = 0;
    const lr = 0.18;

    for (let epoch = 0; epoch < epochs; epoch += 1) {
      let dw = 0;
      let db = 0;
      let loss = 0;
      let correct = 0;
      for (let i = 0; i < x.length; i += 1) {
        const p = sigmoid(w * x[i] + b);
        const err = p - y[i];
        dw += (err * x[i]) / x.length;
        db += err / x.length;
        loss += -(y[i] * Math.log(p + 1e-9) + (1 - y[i]) * Math.log(1 - p + 1e-9)) / x.length;
        if ((p >= 0.5 ? 1 : 0) === y[i]) correct += 1;
      }
      w -= lr * dw;
      b -= lr * db;
      t.at(2).focus(epoch, 0, 'Shift the decision boundary slope');
      t.write(epoch, 0, round(w));
      t.focus(epoch, 1, 'Shift the decision boundary bias');
      t.write(epoch, 1, round(b));
      t.at(4).write(epoch, 2, round(loss));
      t.write(epoch, 3, round((correct / x.length) * 100));
    }
    t.trace(epochs - 1, 3, 'Final training accuracy');
  }
}

export class NaiveBayesClassifier extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'naive-bayes',
    name: 'Naive Bayes',
    category: ML_CATEGORY,
    group: 'ML Foundations',
    description:
      'Classifies an example by multiplying class priors with feature likelihoods under the conditional-independence assumption.',
    complexity: {
      time: { best: 'O(c*f)', average: 'O(c*f)', worst: 'O(c*f)' },
      space: 'O(c*f)',
    },
    accent: '#8b5cf6',
  };

  makeInput(size: number, random: () => number): DPInput {
    const classes = ['A', 'B', 'C'].slice(0, Math.max(2, Math.min(3, Math.round(size / 4))));
    const features = Math.max(3, Math.min(6, Math.round(size / 2)));
    const priors = classes.map(() => randInt(random, 20, 70) / 100);
    const likelihoods = classes.map(() =>
      Array.from({ length: features }, () => randInt(random, 25, 90) / 100),
    );
    return {
      rows: classes.length,
      cols: features + 2,
      rowLabels: classes,
      colLabels: ['prior', ...Array.from({ length: features }, (_, i) => `f${i + 1}`), 'score'],
      payload: { classes, priors, likelihoods },
      title: `${classes.length} classes, ${features} observed features`,
    };
  }

  protected solve(t: DPTracer): void {
    const { classes, priors, likelihoods } = t.payload<{
      classes: string[];
      priors: number[];
      likelihoods: number[][];
    }>();
    let best = 0;
    let bestScore = -Infinity;
    for (let r = 0; r < classes.length; r += 1) {
      let score = priors[r];
      t.at(1).focus(r, 0, `Start with class prior P(${classes[r]})`);
      t.write(r, 0, round(priors[r] * 100));
      for (let f = 0; f < likelihoods[r].length; f += 1) {
        score *= likelihoods[r][f];
        t.at(3).focus(r, f + 1, `Multiply likelihood for feature ${f + 1}`);
        t.write(r, f + 1, round(likelihoods[r][f] * 100), [[r, Math.max(0, f)]]);
      }
      t.at(4).write(r, likelihoods[r].length + 1, round(score * 100), [[r, likelihoods[r].length]]);
      if (score > bestScore) {
        best = r;
        bestScore = score;
      }
    }
    t.at(5).trace(best, likelihoods[best].length + 1, `Predicted class ${classes[best]}`);
  }
}

export class PrincipalComponentAnalysis extends MLAlgorithm {
  readonly meta: AlgorithmMeta = {
    id: 'pca',
    name: 'PCA',
    category: ML_CATEGORY,
    group: 'Linear Algebra',
    description:
      'Centers a dataset and estimates the dominant variance direction. The table shows centered coordinates and each point projection onto the first principal component.',
    complexity: {
      time: { best: 'O(nd^2 + d^3)', average: 'O(nd^2 + d^3)', worst: 'O(nd^2 + d^3)' },
      space: 'O(nd)',
    },
    accent: '#14b8a6',
  };

  makeInput(size: number, random: () => number): DPInput {
    const n = Math.max(5, Math.min(12, size));
    const raw = Array.from({ length: n }, (_, i) => {
      const x = i - n / 2;
      return [x, round(0.7 * x + randInt(random, -3, 3))];
    });
    const mean = [raw.reduce((s, p) => s + p[0], 0) / n, raw.reduce((s, p) => s + p[1], 0) / n];
    const centered = raw.map((p) => [p[0] - mean[0], p[1] - mean[1]]);
    return {
      rows: n,
      cols: 3,
      rowLabels: raw.map((_, i) => `P${i + 1}`),
      colLabels: ['x-center', 'y-center', 'pc1 proj'],
      payload: { centered } satisfies PCAInputPayload,
      title: `${n} centered 2D points projected onto PC1`,
    };
  }

  protected solve(t: DPTracer): void {
    const { centered } = t.payload<PCAInputPayload>();
    let xx = 0;
    let xy = 0;
    let yy = 0;
    for (const [x, y] of centered) {
      xx += x * x;
      xy += x * y;
      yy += y * y;
    }
    const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
    const pc = [Math.cos(angle), Math.sin(angle)];
    for (let r = 0; r < centered.length; r += 1) {
      const [x, y] = centered[r];
      t.at(1).focus(r, 0, 'Center x around the dataset mean');
      t.write(r, 0, round(x));
      t.focus(r, 1, 'Center y around the dataset mean');
      t.write(r, 1, round(y));
      t.at(4).focus(r, 2, 'Project the point onto the first principal direction');
      t.read(r, 0);
      t.read(r, 1);
      t.write(r, 2, round(x * pc[0] + y * pc[1]), [
        [r, 0],
        [r, 1],
      ]);
    }
    t.trace(0, 2, 'Projection axis captures maximum variance');
  }
}
