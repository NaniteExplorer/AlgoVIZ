import type { Lesson } from '@/core/learning/types';

export const lesson: Lesson = {
  algorithmId: 'dijkstra',
  title: 'Why Dijkstra can settle a node forever',
  summary:
    'The greedy argument that makes shortest paths work — and the exact assumption that breaks it.',
  estimatedMinutes: 6,
  sections: [
    {
      id: 'setup',
      title: 'Tentative versus settled',
      anchor: { fraction: 0 },
      highlightLines: [1, 2],
      blocks: [
        {
          type: 'p',
          text: 'Every node carries a tentative distance: the best route found so far. Initially that is 0 for the source and infinity for everything else. As the search proceeds, nodes move from tentative to settled, and a settled node is never revisited.',
        },
        {
          type: 'callout',
          tone: 'insight',
          text: 'That "never revisited" is the entire performance story. It is also the part that needs justifying — why is it safe to close the book on a node?',
        },
      ],
    },
    {
      id: 'greedy',
      title: 'The greedy argument',
      anchor: { fraction: 0.3 },
      highlightLines: [4, 6],
      blocks: [
        {
          type: 'p',
          text: 'Take the unsettled node u with the smallest tentative distance. Could there be a shorter route to u that we have not found?',
        },
        {
          type: 'p',
          text: 'Such a route would have to leave the settled set at some node v and then continue. But v is unsettled, so its distance is at least as large as u\'s — and the rest of the path only adds more. So no shorter route exists.',
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Notice the load-bearing phrase: "the rest of the path only adds more". That is true only because every edge weight is non-negative.',
        },
      ],
    },
    {
      id: 'relaxation',
      title: 'Relaxation',
      anchor: { fraction: 0.55 },
      highlightLines: [8, 9, 10],
      blocks: [
        {
          type: 'p',
          text: 'Once u is settled, every edge leaving it is checked: does going through u give a shorter route to the neighbour than anything found so far? If so, the neighbour\'s tentative distance improves. That check is called relaxation, and it is the only way distances ever change.',
        },
        {
          type: 'formula',
          text: 'if dist[u] + w(u, v) < dist[v] then dist[v] ← dist[u] + w(u, v)' },
      ],
    },
    {
      id: 'negative',
      title: 'Where it breaks',
      anchor: { fraction: 0.85 },
      blocks: [
        {
          type: 'p',
          text: 'Give one edge a negative weight and the greedy argument collapses. A longer-looking route can suddenly become shorter later on, but Dijkstra has already settled the node and will never look again. It does not detect the mistake — it silently returns a wrong answer.',
        },
        {
          type: 'list',
          items: [
            'Non-negative weights → Dijkstra, O(E log V)',
            'Negative weights → Bellman–Ford, O(VE), and it detects negative cycles',
            'All pairs → Floyd–Warshall, O(V³)',
            'A useful heuristic available → A*, same guarantees with far less exploration',
          ],
        },
        {
          type: 'callout',
          tone: 'complexity',
          text: 'Open Bellman–Ford next and run it on the same graph. It relaxes every edge V−1 times instead of settling greedily — slower, but immune to the failure above.',
        },
      ],
    },
  ],
  checkpoints: [
    {
      id: 'why-safe',
      anchor: { fraction: 0.45 },
      question: 'Why is it safe to settle the nearest unvisited node permanently?',
      kind: 'choice',
      options: [
        'Any alternative route must pass through a node that is already at least as far away',
        'Because the graph is connected',
        'Because the priority queue is sorted',
      ],
      answer: 0,
      explanation:
        'Any undiscovered route to u must leave the settled set through some unsettled node, which by construction is no closer than u — and the remaining edges only add non-negative weight.',
    },
    {
      id: 'negative-edge',
      anchor: { fraction: 0.95 },
      question: 'What does Dijkstra do when given a negative edge weight?',
      kind: 'choice',
      options: [
        'Returns a wrong answer without any error',
        'Loops forever',
        'Still finds the shortest path, just more slowly',
      ],
      answer: 0,
      explanation:
        'It terminates normally and reports distances that are simply incorrect. Silent wrongness is the dangerous kind — it is why knowing the precondition matters as much as knowing the algorithm.',
    },
  ],
};
