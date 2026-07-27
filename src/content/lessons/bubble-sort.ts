import type { Lesson } from '@/core/learning/types';

export const lesson: Lesson = {
  algorithmId: 'bubble-sort',
  title: 'Why bubble sort is slow',
  summary:
    'The simplest sort there is, and a precise demonstration of what quadratic time costs you.',
  estimatedMinutes: 5,
  sections: [
    {
      id: 'idea',
      title: 'The idea',
      anchor: { fraction: 0 },
      highlightLines: [4, 5, 6],
      blocks: [
        {
          type: 'p',
          text: 'Bubble sort only ever compares neighbours. Walk the array left to right, and any time two adjacent values are out of order, swap them. Repeat until a full pass makes no swaps.',
        },
        {
          type: 'callout',
          tone: 'insight',
          text: 'Because it only swaps neighbours, a value can move at most one position per pass. That single constraint is the whole reason the algorithm is quadratic.',
        },
      ],
    },
    {
      id: 'bubbling',
      title: 'What "bubbling" means',
      anchor: { fraction: 0.2 },
      highlightLines: [6, 8],
      blocks: [
        {
          type: 'p',
          text: 'Watch the largest remaining value. Once the pass reaches it, it gets swapped forward at every single comparison until it hits the end — it bubbles to the top in one pass.',
        },
        {
          type: 'p',
          text: 'Small values have no such luck. A small value near the end moves left by exactly one position per pass, no matter how far it has to travel. Those are sometimes called "turtles", and they are what comb sort was invented to fix.',
        },
      ],
    },
    {
      id: 'cost',
      title: 'Counting the work',
      anchor: { fraction: 0.55 },
      blocks: [
        {
          type: 'p',
          text: 'Pass 1 makes n−1 comparisons, pass 2 makes n−2, and so on. Adding those up gives the classic triangular number:',
        },
        { type: 'formula', text: '(n−1) + (n−2) + … + 1 = n(n−1)/2 ≈ n²/2' },
        {
          type: 'callout',
          tone: 'complexity',
          text: 'Doubling the array roughly quadruples the comparisons. At n = 40 that is around 780; at n = 400 it is nearly 80,000.',
        },
      ],
    },
    {
      id: 'best-case',
      title: 'The one thing it does well',
      anchor: { fraction: 0.85 },
      highlightLines: [3, 9],
      blocks: [
        {
          type: 'p',
          text: 'The `swapped` flag gives bubble sort a genuinely good property: on already-sorted input it makes one pass, sees no swaps, and stops. That is O(n) — better than merge sort or heap sort, which do their full work regardless.',
        },
        {
          type: 'list',
          items: [
            'Best case O(n) — one clean pass over sorted data',
            'Average and worst case O(n²)',
            'O(1) extra space, and stable',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'That best case is the only realistic reason to reach for it. For anything else, insertion sort is strictly better at the same conceptual simplicity.',
        },
      ],
    },
  ],
  checkpoints: [
    {
      id: 'movement',
      anchor: { fraction: 0.3 },
      question: 'In a single pass, how far can one value move toward the front of the array?',
      kind: 'choice',
      options: ['One position', 'Half the array', 'All the way to the front'],
      answer: 0,
      explanation:
        'Swaps only ever happen between neighbours, and a leftward move happens at most once per pass. A value that needs to travel k positions left therefore needs k passes — which is exactly why the algorithm is quadratic.',
    },
    {
      id: 'comparisons',
      anchor: { fraction: 0.99 },
      question: 'Roughly how many comparisons did this run make?',
      kind: 'predict-metric',
      metricKey: 'comparisons',
      tolerance: 0.25,
      explanation:
        'For n elements the count is close to n²/2. Compare that with quick sort on the same array size — the gap is the practical meaning of O(n²) versus O(n log n).',
    },
  ],
};
