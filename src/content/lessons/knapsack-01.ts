import type { Lesson } from '@/core/learning/types';

export const lesson: Lesson = {
  algorithmId: 'knapsack-01',
  title: 'Reading a DP table',
  summary:
    'How to look at a grid of numbers and see a decision being made — the skill that unlocks every other dynamic-programming problem.',
  estimatedMinutes: 7,
  sections: [
    {
      id: 'question',
      title: 'What each cell asks',
      anchor: { fraction: 0 },
      highlightLines: [1, 2],
      blocks: [
        {
          type: 'p',
          text: 'Cell (i, w) answers exactly one question: "using only the first i items, and with capacity w to spend, what is the most value I can carry?" Nothing more.',
        },
        {
          type: 'callout',
          tone: 'insight',
          text: 'Being able to state a cell\'s meaning in one sentence is the whole job. If you can do that, the recurrence usually writes itself; if you cannot, no amount of staring at the code will help.',
        },
      ],
    },
    {
      id: 'recurrence',
      title: 'Take it or skip it',
      anchor: { fraction: 0.25 },
      highlightLines: [5, 7, 8, 9],
      blocks: [
        {
          type: 'p',
          text: 'There are only two things you can do with item i: leave it, or take it. Each option is already solved by a cell in the row above.',
        },
        {
          type: 'formula',
          text: 'dp[i][w] = max( dp[i−1][w],  value[i] + dp[i−1][w − weight[i]] )',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Skip it — the answer is whatever i−1 items could manage with the same capacity',
            'Take it — its value, plus the best the earlier items could do with the capacity left over',
          ],
        },
        {
          type: 'p',
          text: 'Watch the arrows in the visualization. Every write points back at the one or two cells it was computed from — that is the recurrence, drawn.',
        },
      ],
    },
    {
      id: 'why-not-greedy',
      title: 'Why greedy fails here',
      anchor: { fraction: 0.6 },
      blocks: [
        {
          type: 'p',
          text: 'The obvious heuristic — always take the best value-per-kilogram first — is wrong for 0/1 knapsack. Taking a slightly better ratio can consume capacity that two other items would have used more profitably, and once an item is taken you cannot un-take it.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Greedy is correct for the *fractional* version, where you can take half an item. That one word changes the problem from polynomial-and-easy to NP-hard.',
        },
      ],
    },
    {
      id: 'traceback',
      title: 'Recovering the actual items',
      anchor: { fraction: 0.88 },
      highlightLines: [11, 12],
      blocks: [
        {
          type: 'p',
          text: 'The table gives you the best *value*, not the set of items. To recover those, walk back up from the bottom-right corner. If dp[i][w] differs from dp[i−1][w], the only way that can be true is if item i was taken — so record it and subtract its weight.',
        },
        {
          type: 'callout',
          tone: 'complexity',
          text: 'Filling the table is O(nW); the traceback is O(n). Almost every DP problem has this shape: an expensive fill, then a cheap walk backwards to recover the answer.',
        },
      ],
    },
  ],
  checkpoints: [
    {
      id: 'dependency',
      anchor: { fraction: 0.4 },
      question: 'Which cells does dp[i][w] depend on?',
      kind: 'choice',
      options: [
        'Two cells in the row directly above',
        'Every cell in the row above',
        'The cell immediately to its left',
      ],
      answer: 0,
      explanation:
        'Exactly dp[i−1][w] (skip) and dp[i−1][w − weight[i]] (take). Because it never reads its own row, the whole table can be collapsed into a single 1-D array — the standard space optimisation.',
    },
    {
      id: 'complexity',
      anchor: { fraction: 0.75 },
      question: 'Is O(nW) polynomial in the size of the input?',
      kind: 'choice',
      options: [
        'No — W is a value, not a length, so it is pseudo-polynomial',
        'Yes, it is clearly polynomial in n and W',
        'Only when the weights are small',
      ],
      answer: 0,
      explanation:
        'W is written down in about log W digits, so O(nW) is exponential in the *input length*. This is why 0/1 knapsack is NP-hard despite having a table-filling solution — a genuinely surprising subtlety.',
    },
  ],
};
