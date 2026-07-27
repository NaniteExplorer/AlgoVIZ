import type { AnyAlgorithm } from '@/core/algorithms';
import { buildBST } from '@/core/algorithms/tree/buildTree';
import { describeTreeStep } from '@/core/algorithms/tree/describe';
import type { TreeData, TreeStep } from '@/core/algorithms/tree/TreeStep';
import { TreeModel } from '@/core/model/TreeModel';
import type { ControlSpec, LegendItem, MetricSpec } from '../CategoryModule';
import { WebGLCategoryModule } from '../WebGLCategoryModule';
import type { EngineOptions } from '../engine/VisualizationEngine';
import { TREE_LEGEND, TREE_NODE_STYLES } from './palette';
import { TreeVisualizer } from './TreeVisualizer';

/** Build a BST from `n` distinct random values, with a search target that is present ~60% of the time. */
function makeTree(n: number): TreeData {
  const pool: number[] = [];
  for (let i = 1; i <= 99; i += 1) pool.push(i);
  // Fisher–Yates shuffle.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const values = pool.slice(0, n);

  let target: number;
  if (Math.random() < 0.6) {
    target = values[Math.floor(Math.random() * n)]; // present
  } else {
    target = pool[n] ?? values[0] + 1; // distinct from chosen set → absent
  }
  return buildBST(values, target);
}

/**
 * Deep copy of a tree instance.
 *
 * `TreeNode` carries mutable layout fields (`x`, `y`, `depth`), so a shallow
 * copy would let one consumer's re-layout bleed into another's — exactly the
 * bug the race view would hit when several lanes share an instance.
 */
function cloneTree(data: TreeData): TreeData {
  return {
    nodes: data.nodes.map((n) => ({ ...n })),
    root: data.root,
    order: [...data.order],
    target: data.target,
  };
}

/** Tree family driver. */
export class TreeModule extends WebGLCategoryModule<TreeStep, TreeData> {
  readonly engineOptions: EngineOptions = {
    enableControls: true,
    autoRotate: false,
    bloomStrength: 0.9,
    cameraPosition: [0, 3, 80],
    cameraTarget: [0, 0, 0],
  };

  readonly controls: ControlSpec[] = [
    { key: 'count', label: 'Values', min: 3, max: 28, step: 1, default: 14 },
  ];

  readonly metricSpecs: MetricSpec[] = [
    { key: 'comparisons', label: 'comparisons' },
    { key: 'visited', label: 'visited' },
  ];

  readonly model = new TreeModel();
  readonly visualizer = new TreeVisualizer(this.model);

  private input: TreeData = { nodes: [], root: null, order: [] };

  metrics(): Record<string, number> {
    return { ...this.model.metrics };
  }

  legend(): LegendItem[] {
    return TREE_LEGEND.map(({ role, label }) => ({
      color: TREE_NODE_STYLES[role].color,
      label,
    }));
  }

  regenerate(params: Record<string, number>): void {
    this.input = makeTree(Math.round(params.count ?? 14));
    this.model.reset(this.input);
  }

  buildTimeline(algorithm: AnyAlgorithm): TreeStep[] {
    return (algorithm as { run(input: TreeData): TreeStep[] }).run(this.input);
  }

  getInstance(): TreeData {
    return cloneTree(this.input);
  }

  setInstance(input: TreeData): void {
    this.input = cloneTree(input);
    this.model.reset(this.input);
  }

  describe(step: TreeStep): string {
    return describeTreeStep(step);
  }

  rebuild(): void {
    this.visualizer.rebuild();
  }
}
