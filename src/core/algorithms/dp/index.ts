import { algorithmRegistry } from '../AlgorithmRegistry';
import { CoinChange } from './CoinChange';
import { EditDistance } from './EditDistance';
import { FloydWarshall } from './FloydWarshall';
import { Knapsack01 } from './Knapsack01';
import { LongestCommonSubsequence } from './LongestCommonSubsequence';
import { LongestIncreasingSubsequence } from './LongestIncreasingSubsequence';
import { MatrixChainMultiplication } from './MatrixChainMultiplication';

/**
 * Registration barrel for the dynamic-programming family.
 *
 * Ordered so the gentlest recurrence comes first: a learner who opens the
 * family lands on knapsack, not on matrix chain order.
 */
export const DP_ALGORITHMS = [
  new Knapsack01(),
  new CoinChange(),
  new LongestCommonSubsequence(),
  new EditDistance(),
  new LongestIncreasingSubsequence(),
  new MatrixChainMultiplication(),
  new FloydWarshall(),
];

algorithmRegistry.registerAll(DP_ALGORITHMS);

export { DPAlgorithm, DP_CATEGORY } from './DPAlgorithm';
export { DPTracer } from './DPTracer';
export * from './DPStep';
export { describeDPStep } from './describe';
