import type { AnyAlgorithm } from '@/core/algorithms';
import type { StructureAlgorithm } from '@/core/algorithms/structures/StructureAlgorithm';
import type { StructureInput, StructureStep } from '@/core/algorithms/structures/StructureStep';
import { describeStructureStep } from '@/core/algorithms/structures/describe';
import { StructureModel } from '@/core/model/StructureModel';
import { Canvas2DCategoryModule } from '../Canvas2DCategoryModule';
import type { Canvas2DOptions } from '../backend/Canvas2DBackend';
import type { ControlSpec, LegendItem, MetricSpec, Preset } from '../CategoryModule';
import type { Canvas2DTheme } from '../draw/theme2d';
import { StructureVisualizer } from './StructureVisualizer';
import { STRUCTURE_LEGEND, structurePalette } from './palette';

const EMPTY_INPUT: StructureInput = { layout: 'chain', ops: [], title: '' };

/** Data-structures family driver. */
export class StructureModule extends Canvas2DCategoryModule<StructureStep, StructureInput> {
  readonly canvasOptions: Canvas2DOptions = { maxDpr: 2 };

  readonly controls: ControlSpec[] = [
    { key: 'size', label: 'Operations', min: 4, max: 16, step: 1, default: 9 },
  ];

  readonly metricSpecs: MetricSpec[] = [
    { key: 'operations', label: 'ops' },
    { key: 'comparisons', label: 'comparisons' },
    { key: 'nodes', label: 'nodes' },
    { key: 'collisions', label: 'collisions' },
  ];

  readonly model = new StructureModel();
  readonly visualizer = new StructureVisualizer(this.model);

  private input: StructureInput = EMPTY_INPUT;
  private owner: StructureAlgorithm | null = null;
  private lastSize = 9;
  private random: () => number = Math.random;

  metrics(): Record<string, number> {
    return { ...this.model.metrics };
  }

  legend(): LegendItem[] {
    const palette = structurePalette(this.theme.glow > 0 ? 'dark' : 'light');
    return STRUCTURE_LEGEND.map(({ role, label }) => ({ color: palette[role].border, label }));
  }

  regenerate(params: Record<string, number>): void {
    this.lastSize = Math.round(params.size ?? 9);
    if (this.owner) this.loadFrom(this.owner);
  }

  override applyPreset(preset: Preset): void {
    this.random = preset.seed === undefined ? Math.random : mulberry32(preset.seed);
    this.regenerate(preset.params);
    this.random = Math.random;
  }

  buildTimeline(algorithm: AnyAlgorithm): StructureStep[] {
    const structure = algorithm as unknown as StructureAlgorithm;
    // Each structure needs its own operation script and layout, so switching
    // algorithms within the family regenerates rather than reuses.
    if (structure !== this.owner) this.loadFrom(structure);
    return structure.run(this.input);
  }

  describe(step: StructureStep): string {
    return describeStructureStep(step);
  }

  rebuild(): void {
    this.visualizer.rebuild();
  }

  getInstance(): StructureInput {
    return cloneInput(this.input);
  }

  setInstance(input: StructureInput): void {
    this.input = cloneInput(input);
    this.model.reset(this.input);
    this.visualizer.rebuild();
  }

  protected onThemeChange(theme: Canvas2DTheme): void {
    this.visualizer.setTheme(theme, theme.glow > 0 ? 'dark' : 'light');
  }

  private loadFrom(algorithm: StructureAlgorithm): void {
    this.owner = algorithm;
    this.input = algorithm.makeInput(this.lastSize, this.random);
    this.model.reset(this.input);
    this.visualizer.rebuild();
  }
}

function cloneInput(input: StructureInput): StructureInput {
  return {
    layout: input.layout,
    ops: input.ops.map((op) => ({ ...op })),
    capacity: input.capacity,
    title: input.title,
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
