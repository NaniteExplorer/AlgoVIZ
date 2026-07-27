import type { Pseudocode } from '../PseudocodeRegistry';

/**
 * Pseudocode listings for the dynamic-programming family.
 *
 * Line indices are load-bearing — each algorithm's `tracer.at(n)` calls point
 * at these arrays. Reordering a line here without updating the algorithm will
 * silently highlight the wrong row.
 */
export const DP_PSEUDOCODE: Record<string, Pseudocode> = {
  'knapsack-01': {
    lines: [
      /* 0 */ 'procedure knapsack(items, W)',
      /* 1 */ '  dp[0][w] ← 0 for all w        // no items, no value',
      /* 2 */ '  dp[i][0] ← 0 for all i        // no capacity, no value',
      /* 3 */ '  for i ← 1 to n do',
      /* 4 */ '    for w ← 1 to W do',
      /* 5 */ '      skip ← dp[i-1][w]',
      /* 6 */ '      if weight[i] > w then dp[i][w] ← skip; continue',
      /* 7 */ '      take ← value[i] + dp[i-1][w - weight[i]]',
      /* 8 */ '      if take > skip then dp[i][w] ← take',
      /* 9 */ '      else                dp[i][w] ← skip',
      /* 10 */ '',
      /* 11 */ '  // traceback: a change between rows means "item taken"',
      /* 12 */ '  if dp[i][w] ≠ dp[i-1][w] then take item i; w ← w - weight[i]',
    ],
  },

  'coin-change': {
    lines: [
      /* 0 */ 'procedure coinChange(coins, target)',
      /* 1 */ '  dp[0][0] ← 0;  dp[0][a] ← ∞ for a > 0',
      /* 2 */ '  dp[i][0] ← 0 for all i',
      /* 3 */ '  for i ← 1 to |coins| do',
      /* 4 */ '    for a ← 1 to target do',
      /* 5 */ '      without ← dp[i-1][a]',
      /* 6 */ '      if coins[i] > a then dp[i][a] ← without; continue',
      /* 7 */ '      with ← dp[i][a - coins[i]] + 1   // same row ⇒ reuse allowed',
      /* 8 */ '      if with < without then dp[i][a] ← with',
      /* 9 */ '      else                   dp[i][a] ← without',
      /* 10 */ '',
      /* 11 */ '  // traceback recovers which coins were used',
    ],
  },

  lcs: {
    lines: [
      /* 0 */ 'procedure LCS(A, B)',
      /* 1 */ '  dp[0][*] ← 0;  dp[*][0] ← 0',
      /* 2 */ '  for i ← 1 to |A| do  for j ← 1 to |B| do',
      /* 3 */ '    compare A[i] with B[j]',
      /* 4 */ '    if A[i] = B[j] then',
      /* 5 */ '      dp[i][j] ← dp[i-1][j-1] + 1     // extend the diagonal',
      /* 6 */ '    else',
      /* 7 */ '      up ← dp[i-1][j];  left ← dp[i][j-1]',
      /* 8 */ '      dp[i][j] ← max(up, left)',
      /* 9 */ '',
      /* 10 */ '  // traceback from (|A|, |B|) spells out the subsequence',
      /* 11 */ '  return the collected characters',
    ],
  },

  'edit-distance': {
    lines: [
      /* 0 */ 'procedure editDistance(A, B)',
      /* 1 */ '  dp[0][j] ← j;  dp[i][0] ← i        // pure inserts / deletes',
      /* 2 */ '  for i ← 1 to |A| do  for j ← 1 to |B| do',
      /* 3 */ '    same ← (A[i] = B[j])',
      /* 4 */ '    del ← dp[i-1][j]   + 1',
      /* 5 */ '    ins ← dp[i][j-1]   + 1',
      /* 6 */ '    sub ← dp[i-1][j-1] + (same ? 0 : 1)',
      /* 7 */ '    dp[i][j] ← min(del, ins, sub)',
      /* 8 */ '',
      /* 9 */ '  // traceback reconstructs the edit script',
    ],
  },

  lis: {
    lines: [
      /* 0 */ 'procedure LIS(A)',
      /* 1 */ '  // row 0 is the input, row 1 the DP lengths',
      /* 2 */ '  for i ← 0 to n-1 do',
      /* 3 */ '    dp[i] ← 1                      // A[i] alone',
      /* 4 */ '    for j ← 0 to i-1 do',
      /* 5 */ '      if A[j] < A[i] and dp[j] + 1 > dp[i] then',
      /* 6 */ '        dp[i] ← dp[j] + 1;  prev[i] ← j',
      /* 7 */ '',
      /* 8 */ '  // traceback from the largest dp[i]',
      /* 9 */ '  return the reconstructed chain',
    ],
  },

  'matrix-chain': {
    lines: [
      /* 0 */ 'procedure matrixChain(dims)',
      /* 1 */ '  dp[i][i] ← 0                     // one matrix costs nothing',
      /* 2 */ '  for len ← 2 to n do              // fill by chain length',
      /* 3 */ '    for i ← 0 to n - len do',
      /* 4 */ '      j ← i + len - 1',
      /* 5 */ '      dp[i][j] ← ∞',
      /* 6 */ '      for k ← i to j-1 do',
      /* 7 */ '        cost ← dp[i][k] + dp[k+1][j] + d[i]·d[k+1]·d[j+1]',
      /* 8 */ '        if cost < dp[i][j] then dp[i][j] ← cost; split[i][j] ← k',
      /* 9 */ '',
      /* 10 */ '  // traceback over split[] draws the parenthesisation',
    ],
  },

  'floyd-warshall': {
    lines: [
      /* 0 */ 'procedure floydWarshall(W)',
      /* 1 */ '  dp ← copy of the weight matrix W',
      /* 2 */ '  for k ← 0 to n-1 do              // allow k as a waypoint',
      /* 3 */ '    for i ← 0 to n-1 do  for j ← 0 to n-1 do',
      /* 4 */ '      direct  ← dp[i][j]',
      /* 5 */ '      through ← dp[i][k] + dp[k][j]',
      /* 6 */ '      if through < direct then dp[i][j] ← through',
      /* 7 */ '  // after pass k, paths may use vertices 0..k as intermediates',
    ],
  },
};
