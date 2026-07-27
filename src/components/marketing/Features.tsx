interface Feature {
  title: string;
  body: string;
}

/**
 * "Learn" section — explains how to get the most out of the studio and what
 * makes the platform unique, framed for the learner community it's built for.
 */
const FEATURES: Feature[] = [
  {
    title: 'Step through every operation',
    body: 'Play, pause, scrub, or single-step forward and back. Backward seeking replays a deterministic timeline from the start, so what you see is always exactly correct.',
  },
  {
    title: 'Real 3D, not charts',
    body: 'Every family renders as living WebGL geometry with bloom-lit highlights — orbit the camera, watch frontiers expand and pivots glow. Built on raw Three.js, wrapped in clean OOP.',
  },
  {
    title: 'Read the complexity',
    body: 'Each algorithm ships its best/average/worst time and space bounds, stability, and a plain-language explanation — alongside live counters for comparisons, swaps and visits.',
  },
  {
    title: 'Tune the input',
    body: 'Resize the dataset, grow the graph, regenerate a fresh tree, and change playback speed on the fly. Keyboard shortcuts (space, ← →) keep you in flow.',
  },
  {
    title: 'One engine, every family',
    body: 'Sorting, searching, graphs and trees all run on a single category-agnostic engine. The architecture is the lesson: steps are the only contract between logic and rendering.',
  },
  {
    title: 'Built to extend',
    body: 'Adding an algorithm is a new class and one line; adding a whole family is a model, a visualizer and a factory case. Open, modular, and ready for the community.',
  },
];

export function Features() {
  return (
    <section id="learn" className="mx-auto w-full max-w-7xl scroll-mt-20 px-6 py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">How it works</p>
      <h2 className="mt-2 text-3xl font-semibold text-content-primary md:text-4xl">
        A studio built for understanding
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex flex-col gap-2 rounded-2xl border border-surface-700 bg-surface-900/50 p-6 transition-colors hover:border-surface-600"
          >
            <h3 className="text-base font-semibold text-content-primary">{f.title}</h3>
            <p className="text-sm leading-relaxed text-content-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
