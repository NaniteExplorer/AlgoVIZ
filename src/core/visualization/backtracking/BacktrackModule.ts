import type { AnyAlgorithm } from '@/core/algorithms';
import type { BacktrackAlgorithm } from '@/core/algorithms/backtracking/BacktrackAlgorithm';
import type { BacktrackInput, BacktrackStep } from '@/core/algorithms/backtracking/BacktrackStep';
import { describeBacktrackStep } from '@/core/algorithms/backtracking/describe';
import { BacktrackModel } from '@/core/model/BacktrackModel';
import { Canvas2DCategoryModule } from '../Canvas2DCategoryModule';
import type { Canvas2DOptions } from '../backend/Canvas2DBackend';
import type { ControlSpec, LegendItem, MetricSpec, Preset } from '../CategoryModule';
import type { Canvas2DTheme } from '../draw/theme2d';
import { BacktrackVisualizer } from './BacktrackVisualizer';
import { BACKTRACK_LEGEND, boardPalette } from './palette';

const EMPTY_INPUT: BacktrackInput = {
  width: 0,
  height: 0,
  initial: [],
  payload: {},
  title: '',
  board: 'cells',
};

/**
 * Backtracking family driver.
 *
 * Like the DP module, instance generation belongs to the algorithm rather than
 * the family: a chess board, a Sudoku grid, a maze and a subset row share no
 * common generator.
 */
export class BacktrackModule extends Canvas2DCategoryModule<BacktrackStep, BacktrackInput> {
  readonly canvasOptions: Canvas2DOptions = { maxDpr: 2 };

  readonly controls: ControlSpec[] = [
    // Kept deliberately tight. The search space is exponential, so the
    // difference between 8 and 12 is the difference between a few thousand
    // steps and several million.
    { key: 'size', label: 'Problem size', min: 4, max: 10, step: 1, default: 6 },
  ];

  readonly metricSpecs: MetricSpec[] = [
    { key: 'explored', label: 'explored' },
    { key: 'pruned', label: 'pruned' },
    { key: 'maxDepth', label: 'depth' },
  ];

  readonly model = new BacktrackModel();
  readonly visualizer = new BacktrackVisualizer(this.model);

  private input: BacktrackInput = EMPTY_INPUT;
  private owner: BacktrackAlgorithm | null = null;
  private lastSize = 6;
  private random: () => number = Math.random;

  metrics(): Record<string, number> {
    return { ...this.model.metrics };
  }

  legend(): LegendItem[] {
    const palette = boardPalette(this.theme.glow > 0 ? 'dark' : 'light');
    return BACKTRACK_LEGEND.map(({ role, label }) => ({ color: palette[role].border, label }));
  }

  regenerate(params: Record<string, number>): void {
    this.lastSize = Math.round(params.size ?? 6);
    if (this.owner) this.loadFrom(this.owner);
  }

  override applyPreset(preset: Preset): void {
    this.random = preset.seed === undefined ? Math.random : mulberry32(preset.seed);
    this.regenerate(preset.params);
    this.random = Math.random;
  }

  buildTimeline(algorithm: AnyAlgorithm): BacktrackStep[] {
    const bt = algorithm as unknown as BacktrackAlgorithm;
    if (bt !== this.owner) this.loadFrom(bt);
    return bt.run(this.input);
  }

  describe(step: BacktrackStep): string {
    return describeBacktrackStep(step);
  }

  rebuild(): void {
    this.visualizer.rebuild();
  }

  getInstance(): BacktrackInput {
    return cloneInput(this.input);
  }

  setInstance(input: BacktrackInput): void {
    this.input = cloneInput(input);
    this.model.reset(this.input);
    this.visualizer.rebuild();
  }

  protected onThemeChange(theme: Canvas2DTheme): void {
    this.visualizer.setTheme(theme, theme.glow > 0 ? 'dark' : 'light');
  }

  private loadFrom(algorithm: BacktrackAlgorithm): void {
    this.owner = algorithm;
    this.input = algorithm.makeInput(this.lastSize, this.random);
    this.model.reset(this.input);
    this.visualizer.rebuild();
  }
}

function cloneInput(input: BacktrackInput): BacktrackInput {
  return {
    width: input.width,
    height: input.height,
    initial: [...input.initial],
    payload: structuredClone(input.payload),
    title: input.title,
    board: input.board,
  };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
