import type { AnyAlgorithm } from '@/core/algorithms';
import { describeSearchStep } from '@/core/algorithms/searching/describe';
import type { SearchInput, SearchStep } from '@/core/algorithms/searching/SearchStep';
import { SearchCellRole, SearchModel } from '@/core/model/SearchModel';
import type { ControlSpec, LegendItem, MetricSpec } from '../CategoryModule';
import { WebGLCategoryModule } from '../WebGLCategoryModule';
import type { EngineOptions } from '../engine/VisualizationEngine';
import { SEARCH_ROLE_LABELS, SEARCH_ROLE_STYLES } from './palette';
import { SearchingVisualizer } from './SearchingVisualizer';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Build a strictly-increasing array and a target that is present ~70% of the time. */
function makeInstance(size: number): SearchInput {
  const values: number[] = [];
  let v = randomInt(2, 8);
  for (let i = 0; i < size; i += 1) {
    values.push(v);
    v += randomInt(2, 12); // gaps ≥ 2 guarantee absent targets can sit between values
  }

  let target: number;
  if (Math.random() < 0.7) {
    target = values[randomInt(0, size - 1)]; // present
  } else {
    const k = randomInt(0, size - 1);
    target = values[k] + 1; // sits in a gap → guaranteed absent
  }
  return { values, target };
}

/** Searching family driver. */
export class SearchingModule extends WebGLCategoryModule<SearchStep, SearchInput> {
  readonly engineOptions: EngineOptions = {
    enableControls: true,
    autoRotate: false,
    cameraPosition: [0, 24, 64],
    cameraTarget: [0, 9, 0],
  };

  readonly controls: ControlSpec[] = [
    { key: 'size', label: 'Array size', min: 8, max: 80, step: 1, default: 30 },
  ];

  readonly metricSpecs: MetricSpec[] = [
    { key: 'comparisons', label: 'comparisons' },
    { key: 'eliminated', label: 'ruled out' },
  ];

  readonly model = new SearchModel();
  readonly visualizer = new SearchingVisualizer(this.model);

  private input: SearchInput = { values: [], target: 0 };

  metrics(): Record<string, number> {
    return { ...this.model.metrics };
  }

  legend(): LegendItem[] {
    return (Object.values(SearchCellRole) as SearchCellRole[]).map((role) => ({
      color: SEARCH_ROLE_STYLES[role].color,
      label: SEARCH_ROLE_LABELS[role],
    }));
  }

  regenerate(params: Record<string, number>): void {
    this.input = makeInstance(Math.round(params.size ?? 30));
    this.model.reset(this.input);
  }

  buildTimeline(algorithm: AnyAlgorithm): SearchStep[] {
    return (algorithm as { run(input: SearchInput): SearchStep[] }).run(this.input);
  }

  getInstance(): SearchInput {
    return { values: [...this.input.values], target: this.input.target };
  }

  setInstance(input: SearchInput): void {
    this.input = { values: [...input.values], target: input.target };
    this.model.reset(this.input);
  }

  describe(step: SearchStep): string {
    return describeSearchStep(step);
  }

  rebuild(): void {
    this.visualizer.rebuild();
  }
}
