import type { AnyAlgorithm } from '@/core/algorithms';
import { describeSortStep } from '@/core/algorithms/sorting/describe';
import type { SortStep } from '@/core/algorithms/sorting/SortStep';
import { ArrayModel, CellRole } from '@/core/model/ArrayModel';
import { ROLE_LABELS, ROLE_STYLES } from '@/theme';
import type { ControlSpec, LegendItem, MetricSpec } from '../CategoryModule';
import { WebGLCategoryModule } from '../WebGLCategoryModule';
import type { EngineOptions } from '../engine/VisualizationEngine';
import { SortingVisualizer } from './SortingVisualizer';

const VALUE_MIN = 8;
const VALUE_MAX = 100;

function randomArray(size: number): number[] {
  return Array.from(
    { length: size },
    () => Math.floor(Math.random() * (VALUE_MAX - VALUE_MIN + 1)) + VALUE_MIN,
  );
}

/**
 * Sorting family driver. Wraps the array model + bar visualizer behind the
 * universal {@link CategoryModule} contract so the generic hook/UI can host it
 * exactly like every other family.
 */
export class SortingModule extends WebGLCategoryModule<SortStep, number[]> {
  readonly engineOptions: EngineOptions = {
    enableControls: true,
    autoRotate: false,
    cameraPosition: [0, 26, 62],
    cameraTarget: [0, 9, 0],
  };

  readonly controls: ControlSpec[] = [
    { key: 'size', label: 'Array size', min: 5, max: 120, step: 1, default: 40 },
  ];

  readonly metricSpecs: MetricSpec[] = [
    { key: 'comparisons', label: 'comparisons' },
    { key: 'swaps', label: 'swaps' },
    { key: 'writes', label: 'writes' },
  ];

  readonly model = new ArrayModel();
  readonly visualizer = new SortingVisualizer(this.model);

  private input: number[] = [];

  metrics(): Record<string, number> {
    return { ...this.model.metrics };
  }

  legend(): LegendItem[] {
    return (Object.values(CellRole) as CellRole[])
      .filter((role) => ROLE_LABELS[role])
      .map((role) => ({ color: ROLE_STYLES[role].color, label: ROLE_LABELS[role]! }));
  }

  regenerate(params: Record<string, number>): void {
    this.input = randomArray(Math.round(params.size ?? 40));
    this.model.reset(this.input);
  }

  buildTimeline(algorithm: AnyAlgorithm): SortStep[] {
    return (algorithm as { run(input: number[]): SortStep[] }).run(this.input);
  }

  getInstance(): number[] {
    return [...this.input];
  }

  setInstance(input: number[]): void {
    this.input = [...input];
    this.model.reset(this.input);
  }

  describe(step: SortStep): string {
    return describeSortStep(step);
  }

  rebuild(): void {
    this.visualizer.rebuild();
  }
}
