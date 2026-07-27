const { suite, check, seeded, replay } = require('./harness.cjs');

const B = '../.verify-build';
const { Knapsack01 } = require(`${B}/core/algorithms/dp/Knapsack01`);
const { CoinChange } = require(`${B}/core/algorithms/dp/CoinChange`);
const { LongestCommonSubsequence } = require(`${B}/core/algorithms/dp/LongestCommonSubsequence`);
const { EditDistance } = require(`${B}/core/algorithms/dp/EditDistance`);
const {
  LongestIncreasingSubsequence,
} = require(`${B}/core/algorithms/dp/LongestIncreasingSubsequence`);
const {
  MatrixChainMultiplication,
} = require(`${B}/core/algorithms/dp/MatrixChainMultiplication`);
const { FloydWarshall } = require(`${B}/core/algorithms/dp/FloydWarshall`);
const { DPModel } = require(`${B}/core/model/DPModel`);

/**
 * Every DP algorithm is checked against an independent reference
 * implementation written inline here. Comparing against a second
 * implementation (rather than a hard-coded expected number) is what makes the
 * check meaningful across randomly generated instances.
 */
module.exports = function runDPChecks() {
  suite('Dynamic Programming');

  // 0/1 knapsack — reference is exhaustive subset enumeration.
  {
    const algo = new Knapsack01();
    const input = algo.makeInput(8, seeded(7));
    const { items, capacity } = input.payload;
    let best = 0;
    for (let mask = 0; mask < 1 << items.length; mask += 1) {
      let w = 0;
      let v = 0;
      for (let i = 0; i < items.length; i += 1) {
        if (mask & (1 << i)) {
          w += items[i].weight;
          v += items[i].value;
        }
      }
      if (w <= capacity && v > best) best = v;
    }
    const { model } = replay(algo, input, new DPModel(), 'knapsack');
    check('knapsack matches brute force', model.valueAt(items.length, capacity), best);
  }

  // Coin change — reference is the standard 1-D formulation.
  {
    const algo = new CoinChange();
    const input = algo.makeInput(8, seeded(3));
    const { coins, target } = input.payload;
    const ref = new Array(target + 1).fill(Infinity);
    ref[0] = 0;
    for (let x = 1; x <= target; x += 1) {
      for (const c of coins) if (c <= x) ref[x] = Math.min(ref[x], ref[x - c] + 1);
    }
    const { model } = replay(algo, input, new DPModel(), 'coin change');
    const got = model.valueAt(coins.length, target);
    check('coin change is minimal', got >= 9999 ? Infinity : got, ref[target]);
  }

  // LCS.
  {
    const algo = new LongestCommonSubsequence();
    const input = algo.makeInput(9, seeded(11));
    const { a, b } = input.payload;
    const d = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1]);
      }
    }
    const { model } = replay(algo, input, new DPModel(), 'LCS');
    check('LCS length matches reference', model.valueAt(a.length, b.length), d[a.length][b.length]);
  }

  // Edit distance.
  {
    const algo = new EditDistance();
    const input = algo.makeInput(9, seeded(5));
    const { a, b } = input.payload;
    const d = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
    }
    const { model } = replay(algo, input, new DPModel(), 'edit distance');
    check('edit distance matches reference', model.valueAt(a.length, b.length), d[a.length][b.length]);
  }

  // LIS.
  {
    const algo = new LongestIncreasingSubsequence();
    const input = algo.makeInput(12, seeded(23));
    const v = input.payload.values;
    const dp = v.map(() => 1);
    for (let i = 0; i < v.length; i += 1) {
      for (let j = 0; j < i; j += 1) if (v[j] < v[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    const { model } = replay(algo, input, new DPModel(), 'LIS');
    let got = 0;
    for (let i = 0; i < v.length; i += 1) got = Math.max(got, model.valueAt(1, i));
    check('LIS length matches reference', got, Math.max(...dp));
  }

  // Matrix chain order.
  {
    const algo = new MatrixChainMultiplication();
    const input = algo.makeInput(6, seeded(31));
    const d = input.payload.dims;
    const n = d.length - 1;
    const dp = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let len = 2; len <= n; len += 1) {
      for (let i = 0; i + len - 1 < n; i += 1) {
        const j = i + len - 1;
        dp[i][j] = Infinity;
        for (let k = i; k < j; k += 1) {
          dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k + 1][j] + d[i] * d[k + 1] * d[j + 1]);
        }
      }
    }
    const { model } = replay(algo, input, new DPModel(), 'matrix chain');
    check('matrix chain cost matches reference', model.valueAt(0, n - 1), dp[0][n - 1]);
  }

  // Floyd–Warshall — every cell must match, not just one.
  {
    const algo = new FloydWarshall();
    const input = algo.makeInput(6, seeded(41));
    const { matrix, n } = input.payload;
    const d = matrix.map((r) => [...r]);
    for (let k = 0; k < n; k += 1) {
      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) {
          if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
        }
      }
    }
    const { model } = replay(algo, input, new DPModel(), 'floyd-warshall');
    let mismatches = 0;
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) if (model.valueAt(i, j) !== d[i][j]) mismatches += 1;
    }
    check('floyd-warshall: all cells match reference', mismatches, 0);
  }
};
