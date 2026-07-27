# AlgoVIZ

AlgoVIZ is a production-style algorithm visualization platform built with
Next.js, React, TypeScript, Three.js and Canvas 2D. It turns computer science,
data structures and graph theory into interactive step-by-step visual lessons.

The project is designed as a serious portfolio-grade engineering system: typed
algorithm contracts, deterministic playback, reusable visualization modules,
route-driven catalog pages, pseudocode highlighting, complexity analysis and a
verification harness for the pure algorithm layer.

## Highlights

- Interactive visual studio with play, pause, step, scrub, speed control and
  algorithm-specific input controls.
- Deterministic algorithm timelines, allowing reliable replay, reverse scrubbing
  and side-by-side comparison.
- Hybrid rendering architecture using Three.js/WebGL for spatial visualizations
  and Canvas 2D for structure-heavy views.
- OOP core with registry-driven algorithm discovery, category modules and
  model-renderer separation.
- Built-in pseudocode pane, narrated steps, visual legends and complexity cards.
- Searchable algorithm catalog powered by metadata derived from the runtime
  registry, avoiding duplicated route/catalog state.
- Verification suite that checks determinism, replay correctness and independent
  reference implementations for major algorithm families.
- Experimental DP, backtracking, ML and probability drafts are kept in the
  codebase, but disconnected from the app until they receive more useful visual
  treatments beyond numeric tables or overly abstract boards.

## Algorithm Coverage

AlgoVIZ currently includes broad coverage across:

- Sorting: bubble, insertion, selection, shell, comb, cocktail, merge, quick,
  heap, radix, gnome, odd-even and pancake sort.
- Searching: linear, binary, jump, exponential, interpolation and ternary search.
- Graphs: BFS, DFS, Dijkstra, A*, Bellman-Ford, Kruskal, Prim, topological sort,
  union-find, Tarjan SCC and max-flow.
- Trees: BST insert/search and depth-first traversals.
- Data Structures: linked list, stack/queue, hash tables, min heap, trie, AVL
  rotations and segment tree operations.
- Disconnected source drafts: dynamic programming, backtracking and
  ML/probability implementations remain in source and tests, but are not
  registered into the learner-facing app.
- ML/Probability draft implementations: Bayes Rule, Markov Chains, linear
  regression, logistic regression, Naive Bayes, K-Means, PCA, Perceptron,
  neural-network forward pass, backpropagation, CNN convolution, self-attention
  and Q-Learning are present in source but intentionally not registered in the
  app yet.

## Tech Stack

- Framework: Next.js 15 App Router, React 19
- Language: TypeScript with strict compiler settings
- Rendering: Three.js/WebGL, custom Canvas 2D renderer, requestAnimationFrame
  animation loop
- Styling: Tailwind CSS, custom theme tokens, responsive UI primitives
- Architecture: object-oriented algorithm classes, category modules, typed step
  unions, pure replayable models, registry-based discovery
- Learning UX: pseudocode registry, step narration, legends, metrics and
  complexity profiles
- Quality: ESLint, strict typecheck, custom CommonJS verification harness,
  deterministic seeded checks

## Architecture

The core idea is simple: algorithms do not draw anything. They emit typed,
deterministic steps. Models consume those steps and become the authoritative
state. Renderers read the model and animate the current state.

```text
Algorithm -> Step[] -> Model -> Renderer -> UI
```

This keeps the system extensible. A new sorting algorithm only needs to emit
sorting steps. A new family defines its own step union, model and category
module, then registers itself once.

Important extension points:

- `src/core/algorithms`: pure algorithm implementations and metadata.
- `src/core/model`: replayable state machines for each visualization family.
- `src/core/visualization`: Three.js and Canvas 2D renderers plus category
  modules.
- `src/core/pseudocode`: pseudocode listings keyed by algorithm id.
- `src/catalog`: route/search/presentation metadata derived from the registry.
- `verify`: correctness checks for deterministic algorithm behavior.

## Resume-Ready Summary

Built an extensible algorithm visualization platform using Next.js 15, React 19,
TypeScript, Three.js and Canvas 2D, featuring deterministic playback, typed
algorithm timelines, registry-driven routing, pseudocode synchronization and
custom verification tests across sorting, searching, graph, tree and data
structure algorithms, with additional disconnected source drafts for DP,
backtracking and ML.

Resume bullets:

- Architected a modular visualization engine where pure algorithm classes emit
  typed step timelines consumed by replayable state models and WebGL/Canvas
  renderers.
- Implemented a registry-driven catalog that automatically powers navigation,
  static routes, search metadata and visualizer selection from one source of
  truth.
- Added deterministic playback with step, scrub, replay and race-comparison
  support by designing algorithms as pure functions over structured inputs.
- Built verification tooling that validates determinism, replay correctness and
  algorithm results against independent reference implementations.
- Prepared DP, backtracking and ML expansion layers in source while keeping
  unfinished or low-value visual demos out of the learner-facing app.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run typecheck
npm run lint
npm run verify
npm run build
npm run check
```

## Development Workflow

Add a new algorithm inside the matching family folder, register it in that
family's `index.ts`, and optionally add enrichment and pseudocode entries. The
catalog, route generation, selector and search UI will pick it up from the
registry.

For a new algorithm family, add:

- A category value in `AlgorithmCategory`
- A step union and algorithm base class
- A replayable model
- A `CategoryModule` and renderer
- A visualizer factory case
- A family registration barrel imported by `src/core/algorithms/index.ts`

## Vision

AlgoVIZ is evolving from a classic DSA visualizer into a broader learning lab
for algorithms, mathematics, probability and machine learning. Draft DP,
backtracking and ML implementations exist in source, but they are intentionally
disconnected from the app because the current numeric table and abstract board
views are not good enough for those topics. The next milestone should use richer
visual surfaces: state-space trees, constraint boards with explanations,
geometric plots, decision boundaries, loss landscapes, graph-like neural
networks, convolution windows, attention heatmaps, probability distributions,
matrix transformations, optimizers, regularization, decision trees, random
forests, SVMs and transformer internals.
