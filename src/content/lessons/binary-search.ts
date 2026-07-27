import type { Lesson } from '@/core/learning/types';

export const lesson: Lesson = {
  algorithmId: 'binary-search',
  title: 'Halving the haystack',
  summary:
    'One comparison, half the remaining work. The clearest demonstration of logarithmic time in the catalog.',
  estimatedMinutes: 4,
  sections: [
    {
      id: 'invariant',
      title: 'The invariant',
      anchor: { fraction: 0 },
      highlightLines: [1, 2],
      blocks: [
        {
          type: 'p',
          text: 'Binary search maintains one promise from start to finish: if the target is in the array at all, it is inside the window [lo, hi]. Everything outside that window has been proven irrelevant.',
        },
        {
          type: 'callout',
          tone: 'insight',
          text: 'Every algorithm with a loop has an invariant. Naming it is usually the difference between "I followed the code" and "I understand why it works".',
        },
      ],
    },
    {
      id: 'halving',
      title: 'Why halving is so powerful',
      anchor: { fraction: 0.35 },
      highlightLines: [3, 4, 6, 8],
      blocks: [
        {
          type: 'p',
          text: 'Probe the middle. If it is not the target, one comparison tells you which half cannot contain it, and that half is discarded — not searched and rejected, discarded without ever being looked at.',
        },
        { type: 'formula', text: 'n → n/2 → n/4 → … → 1  requires ⌈log₂ n⌉ probes' },
        {
          type: 'callout',
          tone: 'complexity',
          text: 'A million sorted items need at most 20 comparisons. A billion needs 30. Linear search would need 500 million on average.',
        },
      ],
    },
    {
      id: 'cost',
      title: "What it costs you",
      anchor: { fraction: 0.7 },
      blocks: [
        {
          type: 'p',
          text: 'The array has to be sorted. That is not a small footnote — sorting costs O(n log n), so a single binary search over unsorted data is far more expensive than just scanning it.',
        },
        {
          type: 'list',
          items: [
            'One lookup on unsorted data: linear search wins outright',
            'Many lookups: sort once, then every search is logarithmic',
            'Data that keeps changing: a hash table or a balanced tree is usually the better answer',
          ],
        },
      ],
    },
    {
      id: 'pitfalls',
      title: 'The bugs everyone writes',
      anchor: { fraction: 0.95 },
      blocks: [
        {
          type: 'p',
          text: 'Binary search is famously easy to get subtly wrong. The two classics:',
        },
        {
          type: 'code',
          lines: [
            'mid = (lo + hi) / 2        // overflows for large lo + hi',
            'mid = lo + (hi - lo) / 2   // safe',
            '',
            'while (lo < hi)            // off by one: misses lo == hi',
            'while (lo <= hi)           // correct for an inclusive window',
          ],
          caption: 'Both bugs shipped in real standard libraries for years.',
        },
      ],
    },
  ],
  checkpoints: [
    {
      id: 'probes',
      anchor: { fraction: 0.5 },
      question: 'At most how many probes does binary search need on 1,000 sorted items?',
      kind: 'choice',
      options: ['About 10', 'About 100', 'About 500'],
      answer: 0,
      explanation:
        'log₂(1000) ≈ 9.97, so ten probes suffice. Each one throws away half of whatever is left.',
    },
    {
      id: 'sorted',
      anchor: { fraction: 0.8 },
      question: 'What breaks if the array is not sorted?',
      kind: 'choice',
      options: [
        'The comparison no longer tells you which half to discard',
        'It gets slower but still finds the target',
        'Nothing — it works on any array',
      ],
      answer: 0,
      explanation:
        'The whole method rests on "smaller than the probe means it is to the left". Without ordering, that inference is false and the algorithm confidently discards the half containing the target.',
    },
  ],
};
