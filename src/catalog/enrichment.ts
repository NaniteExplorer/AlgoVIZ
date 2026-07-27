import type { Difficulty } from './types';

/**
 * Presentation-only metadata, keyed by algorithm id.
 *
 * Everything here is content the *chrome* needs but a runtime algorithm class
 * has no business carrying: search keywords, teaching order, "what to look at
 * next". Name, complexity and accent are deliberately absent — those are read
 * straight from the registry, so they cannot drift.
 *
 * An algorithm missing from this table still appears everywhere; it just falls
 * back to defaults (see `deriveEntry`).
 */
export interface Enrichment {
  tagline: string;
  difficulty: Difficulty;
  tags: string[];
  aliases?: string[];
  related?: string[];
  /**
   * Light-mode accent override.
   *
   * Only present where the dark-mode neon fails contrast on a white surface —
   * cyan (#22d3ee) at 1.7:1 is the worst offender, and every accent lighter
   * than roughly #94a3b8 needs one.
   */
  accentLight?: string;
}

export const ENRICHMENT: Record<string, Enrichment> = {
  // ── Sorting ─────────────────────────────────────────────────────────
  'bubble-sort': {
    tagline: 'Adjacent swaps bubble the largest element to the end each pass.',
    difficulty: 'intro',
    tags: ['comparison', 'stable', 'in-place', 'quadratic', 'beginner'],
    aliases: ['sinking sort'],
    related: ['cocktail-sort', 'insertion-sort', 'comb-sort'],
    accentLight: '#be123c',
  },
  'insertion-sort': {
    tagline: 'Grows a sorted prefix, sliding each new value back into place.',
    difficulty: 'intro',
    tags: ['comparison', 'stable', 'in-place', 'adaptive', 'online'],
    related: ['shell-sort', 'bubble-sort', 'selection-sort'],
    accentLight: '#0e7490',
  },
  'selection-sort': {
    tagline: 'Repeatedly finds the minimum and swaps it into position.',
    difficulty: 'intro',
    tags: ['comparison', 'in-place', 'quadratic', 'few-swaps'],
    related: ['heap-sort', 'bubble-sort'],
    accentLight: '#b45309',
  },
  'shell-sort': {
    tagline: 'Insertion sort over shrinking gaps, so values travel further per move.',
    difficulty: 'core',
    tags: ['comparison', 'in-place', 'gap-sequence'],
    related: ['insertion-sort', 'comb-sort'],
    accentLight: '#6d28d9',
  },
  'comb-sort': {
    tagline: 'Bubble sort with a shrinking gap that kills small values stranded at the end.',
    difficulty: 'core',
    tags: ['comparison', 'in-place', 'gap-sequence', 'turtles'],
    related: ['bubble-sort', 'shell-sort'],
    accentLight: '#047857',
  },
  'cocktail-sort': {
    tagline: 'Bubble sort that alternates direction on every pass.',
    difficulty: 'core',
    tags: ['comparison', 'stable', 'in-place', 'bidirectional'],
    aliases: ['shaker sort', 'bidirectional bubble sort'],
    related: ['bubble-sort'],
    accentLight: '#be185d',
  },
  'merge-sort': {
    tagline: 'Divide, sort each half, then merge — guaranteed O(n log n).',
    difficulty: 'core',
    tags: ['divide-and-conquer', 'stable', 'recursive', 'linearithmic'],
    related: ['quick-sort', 'heap-sort'],
    accentLight: '#0369a1',
  },
  'quick-sort': {
    tagline: 'Partition around a pivot, then recurse on both sides.',
    difficulty: 'core',
    tags: ['divide-and-conquer', 'in-place', 'partition', 'pivot', 'recursive'],
    aliases: ['quicksort', 'lomuto', 'hoare'],
    related: ['merge-sort', 'heap-sort'],
    accentLight: '#6d28d9',
  },
  'heap-sort': {
    tagline: 'Build a max-heap, then repeatedly extract the root.',
    difficulty: 'advanced',
    tags: ['heap', 'in-place', 'selection', 'linearithmic'],
    related: ['selection-sort', 'merge-sort'],
    accentLight: '#047857',
  },
  'radix-sort': {
    tagline: 'Sorts by digit position — no comparisons at all.',
    difficulty: 'advanced',
    tags: ['non-comparison', 'stable', 'digits', 'linear', 'counting'],
    aliases: ['lsd radix'],
    related: ['merge-sort'],
    accentLight: '#b45309',
  },
  'gnome-sort': {
    tagline: 'Steps forward when ordered, back when not — insertion sort with one loop.',
    difficulty: 'intro',
    tags: ['comparison', 'stable', 'in-place', 'simple'],
    aliases: ['stupid sort'],
    related: ['insertion-sort', 'bubble-sort'],
    accentLight: '#0e7490',
  },
  'odd-even-sort': {
    tagline: 'Alternates comparing odd and even index pairs — trivially parallelisable.',
    difficulty: 'core',
    tags: ['comparison', 'stable', 'parallel', 'brick sort'],
    aliases: ['brick sort'],
    related: ['bubble-sort'],
    accentLight: '#be123c',
  },
  'pancake-sort': {
    tagline: 'Only operation allowed is reversing a prefix — flip the biggest to the top, then to the end.',
    difficulty: 'advanced',
    tags: ['comparison', 'prefix-reversal', 'puzzle'],
    related: ['selection-sort'],
    accentLight: '#be185d',
  },

  // ── Searching ───────────────────────────────────────────────────────
  'linear-search': {
    tagline: 'Check every element in order until the target turns up.',
    difficulty: 'intro',
    tags: ['sequential', 'unsorted', 'baseline'],
    aliases: ['sequential search'],
    related: ['binary-search'],
    accentLight: '#0369a1',
  },
  'binary-search': {
    tagline: 'Halve the search window with every comparison.',
    difficulty: 'intro',
    tags: ['sorted', 'divide-and-conquer', 'logarithmic'],
    aliases: ['bisection'],
    related: ['jump-search', 'interpolation-search', 'ternary-search'],
    accentLight: '#6d28d9',
  },
  'jump-search': {
    tagline: 'Skip ahead in √n blocks, then walk back linearly.',
    difficulty: 'core',
    tags: ['sorted', 'block', 'sqrt'],
    related: ['binary-search', 'exponential-search'],
    accentLight: '#047857',
  },
  'exponential-search': {
    tagline: 'Double the bound until it overshoots, then binary-search inside it.',
    difficulty: 'core',
    tags: ['sorted', 'unbounded', 'doubling'],
    aliases: ['galloping search', 'doubling search'],
    related: ['binary-search', 'jump-search'],
    accentLight: '#b45309',
  },
  'interpolation-search': {
    tagline: 'Guesses where the target should be, given a uniform distribution.',
    difficulty: 'advanced',
    tags: ['sorted', 'uniform', 'estimate'],
    related: ['binary-search'],
    accentLight: '#be185d',
  },
  'ternary-search': {
    tagline: 'Splits the window into thirds instead of halves.',
    difficulty: 'core',
    tags: ['sorted', 'divide-and-conquer', 'unimodal'],
    related: ['binary-search'],
    accentLight: '#0e7490',
  },

  // ── Graph ───────────────────────────────────────────────────────────
  bfs: {
    tagline: 'Expands in rings from the start — shortest path by edge count.',
    difficulty: 'intro',
    tags: ['traversal', 'queue', 'unweighted', 'shortest path', 'level order'],
    aliases: ['breadth first search'],
    related: ['dfs', 'dijkstra'],
    accentLight: '#0e7490',
  },
  dfs: {
    tagline: 'Follows one branch as deep as it goes before backing up.',
    difficulty: 'intro',
    tags: ['traversal', 'stack', 'recursion', 'backtracking'],
    aliases: ['depth first search'],
    related: ['bfs', 'topological-sort'],
    accentLight: '#6d28d9',
  },
  dijkstra: {
    tagline: 'Always settle the nearest unvisited node; relax its edges.',
    difficulty: 'core',
    tags: ['shortest path', 'weighted', 'greedy', 'priority queue'],
    related: ['a-star', 'bellman-ford', 'bfs'],
    accentLight: '#047857',
  },
  'a-star': {
    tagline: "Dijkstra plus a heuristic that aims the search at the goal.",
    difficulty: 'advanced',
    tags: ['shortest path', 'heuristic', 'informed', 'pathfinding', 'admissible'],
    aliases: ['a star', 'astar'],
    related: ['dijkstra', 'bfs'],
    accentLight: '#b45309',
  },

  // ── Tree ────────────────────────────────────────────────────────────
  'bst-insert': {
    tagline: 'Descend left or right by comparison, then hang the new node off a leaf.',
    difficulty: 'intro',
    tags: ['bst', 'insert', 'binary tree'],
    related: ['bst-search', 'inorder'],
    accentLight: '#0369a1',
  },
  'bst-search': {
    tagline: 'One comparison per level discards half the remaining tree.',
    difficulty: 'intro',
    tags: ['bst', 'search', 'binary tree', 'logarithmic'],
    related: ['bst-insert', 'binary-search'],
    accentLight: '#6d28d9',
  },
  inorder: {
    tagline: 'Left, node, right — visits a BST in sorted order.',
    difficulty: 'intro',
    tags: ['traversal', 'recursive', 'sorted', 'dfs'],
    aliases: ['in-order traversal'],
    related: ['preorder', 'postorder'],
    accentLight: '#047857',
  },
  preorder: {
    tagline: 'Node first, then subtrees — the shape you need to rebuild a tree.',
    difficulty: 'intro',
    tags: ['traversal', 'recursive', 'dfs', 'serialize'],
    aliases: ['pre-order traversal'],
    related: ['inorder', 'postorder'],
    accentLight: '#b45309',
  },
  postorder: {
    tagline: 'Subtrees first, node last — the order you free or evaluate in.',
    difficulty: 'intro',
    tags: ['traversal', 'recursive', 'dfs', 'bottom-up'],
    aliases: ['post-order traversal'],
    related: ['inorder', 'preorder'],
    accentLight: '#be185d',
  },

  // ── Dynamic programming ─────────────────────────────────────────────
  'knapsack-01': {
    tagline: 'Take it or skip it — the two-cell decision behind every grid DP.',
    difficulty: 'core',
    tags: ['optimization', 'subset', 'grid', 'traceback', 'np-hard'],
    aliases: ['0/1 knapsack', 'knapsack problem'],
    related: ['coin-change', 'lis'],
    accentLight: '#0e7490',
  },
  'coin-change': {
    tagline: 'Fewest coins for an amount — the classic case where greedy fails.',
    difficulty: 'core',
    tags: ['optimization', 'unbounded', 'grid', 'greedy fails'],
    aliases: ['minimum coins', 'change making'],
    related: ['knapsack-01'],
    accentLight: '#b45309',
  },
  lcs: {
    tagline: 'The longest shared subsequence — the recurrence behind diff.',
    difficulty: 'core',
    tags: ['string', 'alignment', 'diff', 'traceback'],
    aliases: ['longest common subsequence'],
    related: ['edit-distance'],
    accentLight: '#6d28d9',
  },
  'edit-distance': {
    tagline: 'Cheapest sequence of inserts, deletes and substitutions.',
    difficulty: 'core',
    tags: ['string', 'levenshtein', 'fuzzy match', 'spellcheck'],
    aliases: ['levenshtein distance', 'levenshtein'],
    related: ['lcs'],
    accentLight: '#be123c',
  },
  lis: {
    tagline: 'A one-dimensional table that looks back at every earlier answer.',
    difficulty: 'core',
    tags: ['sequence', 'subsequence', 'traceback', 'patience'],
    aliases: ['longest increasing subsequence'],
    related: ['knapsack-01'],
    accentLight: '#047857',
  },
  'matrix-chain': {
    tagline: 'Fills outward along diagonals, not in reading order.',
    difficulty: 'advanced',
    tags: ['interval', 'parenthesisation', 'optimal substructure', 'cubic'],
    aliases: ['matrix chain multiplication'],
    related: ['knapsack-01'],
    accentLight: '#be185d',
  },
  'floyd-warshall': {
    tagline: 'All-pairs shortest paths, one allowed waypoint at a time.',
    difficulty: 'advanced',
    tags: ['shortest path', 'all pairs', 'matrix', 'negative edges', 'transitive closure'],
    aliases: ['floyd warshall', 'all pairs shortest path'],
    related: ['dijkstra', 'a-star'],
    accentLight: '#0369a1',
  },

  // ── Backtracking ────────────────────────────────────────────────────
  'rat-in-maze': {
    tagline: 'Backtracking at its most literal — walk, hit a dead end, retrace.',
    difficulty: 'intro',
    tags: ['maze', 'path finding', 'grid', 'recursion', 'dfs'],
    aliases: ['maze solver', 'rat maze'],
    related: ['n-queens', 'dfs'],
    accentLight: '#047857',
  },
  'n-queens': {
    tagline: 'Place N queens with no two attacking — the textbook search.',
    difficulty: 'core',
    tags: ['constraint', 'chess', 'pruning', 'recursion', 'classic'],
    aliases: ['eight queens', '8 queens'],
    related: ['sudoku-solver', 'permutations'],
    accentLight: '#be123c',
  },
  'sudoku-solver': {
    tagline: 'Constraint propagation and unwinding, on a board you can read.',
    difficulty: 'core',
    tags: ['constraint', 'grid', 'puzzle', 'recursion', 'pruning'],
    aliases: ['sudoku'],
    related: ['n-queens'],
    accentLight: '#6d28d9',
  },
  permutations: {
    tagline: 'Nothing is ever pruned — the purest view of a recursion tree.',
    difficulty: 'intro',
    tags: ['enumeration', 'combinatorics', 'recursion', 'factorial'],
    aliases: ['permute', 'orderings'],
    related: ['subset-sum', 'tower-of-hanoi'],
    accentLight: '#b45309',
  },
  'subset-sum': {
    tagline: 'Take it or skip it, with two prunes — then compare it with the DP.',
    difficulty: 'core',
    tags: ['enumeration', 'pruning', 'np-complete', 'exponential'],
    aliases: ['subset sum problem'],
    related: ['knapsack-01', 'permutations'],
    accentLight: '#0369a1',
  },
  'tower-of-hanoi': {
    tagline: 'Three lines of recursion, a perfectly balanced tree, 2ⁿ−1 moves.',
    difficulty: 'intro',
    tags: ['recursion', 'divide and conquer', 'classic', 'puzzle'],
    aliases: ['hanoi', 'towers of hanoi'],
    related: ['permutations'],
    accentLight: '#be185d',
  },

  // ── Advanced graph ──────────────────────────────────────────────────
  'bellman-ford': {
    tagline: 'Slower than Dijkstra, but correct with negative edges.',
    difficulty: 'core',
    tags: ['shortest path', 'negative weights', 'relaxation', 'negative cycle'],
    aliases: ['bellman ford'],
    related: ['dijkstra', 'floyd-warshall'],
    accentLight: '#be185d',
  },
  kruskal: {
    tagline: 'Cheapest edge first, skipping anything that closes a cycle.',
    difficulty: 'core',
    tags: ['mst', 'greedy', 'union find', 'disjoint set', 'spanning tree'],
    aliases: ['kruskal mst', 'minimum spanning tree'],
    related: ['prim', 'union-find'],
    accentLight: '#b45309',
  },
  prim: {
    tagline: 'Grows one tree outward — same optimum as Kruskal, different picture.',
    difficulty: 'core',
    tags: ['mst', 'greedy', 'cut property', 'spanning tree'],
    aliases: ['prim mst', 'jarnik'],
    related: ['kruskal', 'dijkstra'],
    accentLight: '#047857',
  },
  'topological-sort': {
    tagline: 'Dependency order — the algorithm behind every build system.',
    difficulty: 'core',
    tags: ['dag', 'ordering', 'dependencies', 'kahn', 'cycle detection', 'scheduling'],
    aliases: ['topo sort', 'kahn'],
    related: ['dfs', 'tarjan-scc'],
    accentLight: '#0e7490',
  },
  'union-find': {
    tagline: 'Union by rank and path compression, drawn as a live forest.',
    difficulty: 'core',
    tags: ['disjoint set', 'connectivity', 'components', 'amortised', 'dsu'],
    aliases: ['disjoint set', 'dsu', 'connected components'],
    related: ['kruskal', 'tarjan-scc'],
    accentLight: '#6d28d9',
  },
  'tarjan-scc': {
    tagline: 'Low-links and one DFS pass find every strongly connected component.',
    difficulty: 'advanced',
    tags: ['scc', 'dfs', 'low link', 'directed', 'connectivity', 'condensation'],
    aliases: ['tarjan', 'strongly connected components'],
    related: ['topological-sort', 'dfs'],
    accentLight: '#0369a1',
  },
  'max-flow': {
    tagline: 'Saturate the shortest augmenting path, and let residuals undo mistakes.',
    difficulty: 'advanced',
    tags: ['flow', 'edmonds karp', 'ford fulkerson', 'residual', 'min cut', 'matching'],
    aliases: ['maximum flow', 'edmonds karp', 'ford fulkerson'],
    related: ['bfs', 'dijkstra'],
    accentLight: '#0e7490',
  },

  // ── Data structures ─────────────────────────────────────────────────
  'linked-list': {
    tagline: 'Pointers made visible — O(1) to relink, O(n) to get there.',
    difficulty: 'intro',
    tags: ['pointers', 'linear', 'traversal', 'insert', 'delete'],
    aliases: ['singly linked list', 'list'],
    related: ['stack-queue', 'hash-chaining'],
    accentLight: '#0e7490',
  },
  'stack-queue': {
    tagline: 'One script, two containers — LIFO reverses, FIFO preserves.',
    difficulty: 'intro',
    tags: ['lifo', 'fifo', 'linear', 'push', 'pop', 'comparison'],
    aliases: ['stack', 'queue', 'lifo', 'fifo'],
    related: ['linked-list', 'bfs'],
    accentLight: '#b45309',
  },
  'hash-chaining': {
    tagline: 'Collisions hang off the bucket — cost follows load factor.',
    difficulty: 'core',
    tags: ['hashing', 'collision', 'load factor', 'buckets', 'dictionary'],
    aliases: ['separate chaining', 'hash map', 'hash table'],
    related: ['hash-open-addressing', 'linked-list'],
    accentLight: '#6d28d9',
  },
  'hash-open-addressing': {
    tagline: 'Everything in one array — fast, until the clusters start growing.',
    difficulty: 'core',
    tags: ['hashing', 'linear probing', 'clustering', 'cache', 'tombstone'],
    aliases: ['linear probing', 'open addressing'],
    related: ['hash-chaining'],
    accentLight: '#be123c',
  },
  'min-heap': {
    tagline: 'Only local comparisons, yet the minimum is always on top.',
    difficulty: 'core',
    tags: ['priority queue', 'sift', 'complete tree', 'heap property'],
    aliases: ['binary heap', 'priority queue', 'heap'],
    related: ['heap-sort', 'dijkstra'],
    accentLight: '#047857',
  },
  trie: {
    tagline: 'Shared prefixes are shared paths — the shape is the data.',
    difficulty: 'core',
    tags: ['prefix tree', 'strings', 'autocomplete', 'routing', 'dictionary'],
    aliases: ['prefix tree', 'radix tree', 'autocomplete'],
    related: ['avl-tree'],
    accentLight: '#0369a1',
  },
  'avl-tree': {
    tagline: 'Rotations that stop a BST degenerating into a linked list.',
    difficulty: 'advanced',
    tags: ['self balancing', 'rotation', 'bst', 'balance factor', 'logarithmic'],
    aliases: ['avl', 'balanced bst', 'self-balancing tree'],
    related: ['bst-insert', 'segment-tree'],
    accentLight: '#be185d',
  },
  'segment-tree': {
    tagline: 'Range sums in log time, and still correct after an update.',
    difficulty: 'advanced',
    tags: ['range query', 'intervals', 'prefix sums', 'point update', 'competitive'],
    aliases: ['segment tree', 'range tree'],
    related: ['avl-tree', 'min-heap'],
    accentLight: '#0e7490',
  },

  // Machine learning and probability
  'bayes-rule': {
    tagline: 'Turn priors and likelihoods into posterior beliefs.',
    difficulty: 'intro',
    tags: ['probability', 'bayesian', 'posterior', 'likelihood', 'normalisation'],
    aliases: ['bayes theorem', 'bayesian update', 'conditional probability'],
    related: ['markov-chain'],
    accentLight: '#0369a1',
  },
  'markov-chain': {
    tagline: 'Push a probability distribution through repeated transitions.',
    difficulty: 'core',
    tags: ['probability', 'stochastic process', 'transition matrix', 'state', 'linear algebra'],
    aliases: ['markov process', 'transition matrix'],
    related: ['bayes-rule'],
    accentLight: '#047857',
  },
  'k-means': {
    tagline: 'Alternate nearest-centroid assignment and centroid updates.',
    difficulty: 'core',
    tags: ['machine learning', 'clustering', 'unsupervised', 'centroid', 'optimization'],
    aliases: ['kmeans', 'k means clustering', 'lloyd algorithm'],
    related: ['markov-chain'],
    accentLight: '#c2410c',
  },
  'linear-regression-gd': {
    tagline: 'Fit a line by walking downhill on mean squared error.',
    difficulty: 'intro',
    tags: ['machine learning', 'regression', 'gradient descent', 'loss', 'supervised'],
    aliases: ['linear regression', 'least squares', 'mse'],
    related: ['logistic-regression', 'backpropagation'],
    accentLight: '#0e7490',
  },
  'logistic-regression': {
    tagline: 'A sigmoid classifier trained with log-loss gradients.',
    difficulty: 'core',
    tags: ['machine learning', 'classification', 'sigmoid', 'log loss', 'supervised'],
    aliases: ['binary classifier', 'sigmoid regression'],
    related: ['linear-regression-gd', 'perceptron'],
    accentLight: '#be185d',
  },
  'naive-bayes': {
    tagline: 'Multiply priors and feature likelihoods into class scores.',
    difficulty: 'intro',
    tags: ['machine learning', 'classification', 'bayesian', 'probability', 'features'],
    aliases: ['bayes classifier', 'naive bayes classifier'],
    related: ['bayes-rule', 'logistic-regression'],
    accentLight: '#6d28d9',
  },
  pca: {
    tagline: 'Project data onto the direction of maximum variance.',
    difficulty: 'core',
    tags: ['machine learning', 'linear algebra', 'dimensionality reduction', 'eigenvector'],
    aliases: ['principal component analysis', 'dimension reduction'],
    related: ['k-means', 'linear-regression-gd'],
    accentLight: '#0f766e',
  },
  perceptron: {
    tagline: 'The smallest neural classifier: predict, compare, update.',
    difficulty: 'intro',
    tags: ['neural network', 'classification', 'linear model', 'weights', 'supervised'],
    aliases: ['perceptron learning', 'single neuron'],
    related: ['logistic-regression', 'nn-forward-pass'],
    accentLight: '#be123c',
  },
  'nn-forward-pass': {
    tagline: 'Watch activations move from inputs through hidden neurons to output.',
    difficulty: 'core',
    tags: ['deep learning', 'neural network', 'activation', 'dense layer', 'inference'],
    aliases: ['forward propagation', 'feedforward network', 'dense network'],
    related: ['backpropagation', 'perceptron'],
    accentLight: '#7e22ce',
  },
  backpropagation: {
    tagline: 'Send loss gradients backward so every weight knows how to move.',
    difficulty: 'advanced',
    tags: ['deep learning', 'neural network', 'gradient descent', 'chain rule', 'training'],
    aliases: ['backprop', 'backward pass', 'gradient backpropagation'],
    related: ['nn-forward-pass', 'linear-regression-gd'],
    accentLight: '#b91c1c',
  },
  'cnn-convolution': {
    tagline: 'Slide a kernel across an image to build a feature map.',
    difficulty: 'core',
    tags: ['deep learning', 'cnn', 'computer vision', 'kernel', 'feature map'],
    aliases: ['convolution', 'conv layer', 'convolutional neural network'],
    related: ['self-attention', 'nn-forward-pass'],
    accentLight: '#b45309',
  },
  'self-attention': {
    tagline: 'Every token scores every other token before reading context.',
    difficulty: 'advanced',
    tags: ['deep learning', 'transformer', 'attention', 'nlp', 'softmax'],
    aliases: ['attention mechanism', 'transformer attention', 'scaled dot product attention'],
    related: ['nn-forward-pass', 'cnn-convolution'],
    accentLight: '#4f46e5',
  },
  'q-learning': {
    tagline: 'Learn action values from reward plus discounted future value.',
    difficulty: 'advanced',
    tags: ['reinforcement learning', 'q value', 'reward', 'policy', 'temporal difference'],
    aliases: ['q learning', 'temporal difference learning', 'rl'],
    related: ['markov-chain'],
    accentLight: '#65a30d',
  },
};
