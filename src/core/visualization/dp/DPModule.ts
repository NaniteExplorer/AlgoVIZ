import type { AnyAlgorithm } from '@/core/algorithms';
import { DPAlgorithm } from '@/core/algorithms/dp/DPAlgorithm';
import { describeDPStep } from '@/core/algorithms/dp/describe';
import type { DPInput, DPStep } from '@/core/algorithms/dp/DPStep';
import { DPModel } from '@/core/model/DPModel';
import { Canvas2DCategoryModule } from '../Canvas2DCategoryModule';
import type { Canvas2DOptions } from '../backend/Canvas2DBackend';
import type { ControlSpec, LegendItem, MetricSpec, Preset } from '../CategoryModule';
import type { Canvas2DTheme } from '../draw/theme2d';
import { DPVisualizer } from './DPVisualizer';
import { DP_LEGEND, dpPalette } from './palette';

const EMPTY_INPUT: DPInput = {
  rows: 0,
  cols: 0,
  rowLabels: [],
  colLabels: [],
  payload: {},
  title: '',
};

/**
 * Dynamic-programming family driver.
 *
 * The one structural difference from the 3D families: the *algorithm* owns
 * instance generation, not the module. A knapsack table is items × capacity
 * while an LCS table is |A| × |B|, so there is no single "generate a DP
 * instance" that makes sense at the family level — `DPAlgorithm.makeInput` is
 * the seam instead, and the module simply asks the selected algorithm for one.
 */
export class DPModule extends Canvas2DCategoryModule<DPStep, DPInput> {
  readonly canvasOptions: Canvas2DOptions = { maxDpr: 2 };

  readonly controls: ControlSpec[] = [
    { key: 'size', label: 'Problem size', min: 3, max: 14, step: 1, default: 7 },
  ];

  readonly metricSpecs: MetricSpec[] = [
    { key: 'cellsFilled', label: 'cells' },
    { key: 'reads', label: 'reads' },
    { key: 'writes', label: 'writes' },
  ];

  readonly model = new DPModel();
  readonly visualizer = new DPVisualizer(this.model);

  private input: DPInput = EMPTY_INPUT;
  /** The algorithm whose table shape the current instance was built for. */
  private owner: DPAlgorithm | null = null;
  private lastSize = 7;
  private random: () => number = Math.random;

  metrics(): Record<string, number> {
    return { ...this.model.metrics };
  }

  legend(): LegendItem[] {
    const palette = dpPalette(this.theme.glow > 0 ? 'dark' : 'light');
    return DP_LEGEND.map(({ role, label }) => ({ color: palette[role].border, label }));
  }

  regenerate(params: Record<string, number>): void {
    this.lastSize = Math.round(params.size ?? 7);
    // Without a selected algorithm there is no table shape to generate yet;
    // `buildTimeline` fills this in as soon as one is chosen.
    if (this.owner) this.loadFrom(this.owner);
  }

  override applyPreset(preset: Preset): void {
    // A seeded generator makes the instance reproducible, which is what lets a
    // lesson or a race hand every lane the identical problem.
    this.random = preset.seed === undefined ? Math.random : mulberry32(preset.seed);
    this.regenerate(preset.params);
    this.random = Math.random;
  }

  buildTimeline(algorithm: AnyAlgorithm): DPStep[] {
    const dp = algorithm as unknown as DPAlgorithm;
    // Switching algorithms within the family changes the table shape, so the
    // instance has to be rebuilt rather than reused.
    if (dp !== this.owner) this.loadFrom(dp);
    return dp.run(this.input);
  }

  describe(step: DPStep): string {
    return describeDPStep(step);
  }

  rebuild(): void {
    this.visualizer.rebuild();
  }

  getInstance(): DPInput {
    return cloneInput(this.input);
  }

  setInstance(input: DPInput): void {
    this.input = cloneInput(input);
    this.model.reset(this.input);
    this.visualizer.rebuild();
  }

  protected onThemeChange(theme: Canvas2DTheme): void {
    this.visualizer.setTheme(theme, theme.glow > 0 ? 'dark' : 'light');
  }

  private loadFrom(algorithm: DPAlgorithm): void {
    this.owner = algorithm;
    this.input = algorithm.makeInput(this.lastSize, this.random);
    this.model.reset(this.input);
    this.visualizer.rebuild();
  }
}

/**
 * `payload` is opaque to the module, so a shallow copy would let two lanes
 * share (and mutate) the same items array. Structured clone keeps instances
 * genuinely independent.
 */
function cloneInput(input: DPInput): DPInput {
  return {
    rows: input.rows,
    cols: input.cols,
    rowLabels: [...input.rowLabels],
    colLabels: [...input.colLabels],
    payload: structuredClone(input.payload),
    title: input.title,
  };
}

/** Small, fast seeded PRNG — enough for reproducible problem instances. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
