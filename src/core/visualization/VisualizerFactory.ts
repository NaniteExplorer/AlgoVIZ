import { AlgorithmCategory } from '@/core/algorithms/types';
import type { CategoryModule } from './CategoryModule';
import { SortingModule } from './sorting/SortingModule';
import { SearchingModule } from './searching/SearchingModule';
import { GraphModule } from './graph/GraphModule';
import { TreeModule } from './tree/TreeModule';
import { StructureModule } from './structures/StructureModule';

/**
 * Maps an algorithm category to the {@link CategoryModule} that drives it.
 *
 * This is the rendering-side extension seam that mirrors `AlgorithmRegistry` on
 * the logic side. Adding a family means: build its `CategoryModule` (model,
 * visualizer, input generation, UI metadata), then add one `case` here. Nothing
 * upstream changes — the engine, playback controller, React hook and every
 * chrome component are all category-blind.
 */
export class VisualizerFactory {
  static create(category: AlgorithmCategory): CategoryModule {
    switch (category) {
      case AlgorithmCategory.Sorting:
        return new SortingModule();
      case AlgorithmCategory.Searching:
        return new SearchingModule();
      case AlgorithmCategory.Graph:
        return new GraphModule();
      case AlgorithmCategory.Tree:
        return new TreeModule();
      case AlgorithmCategory.Structures:
        return new StructureModule();
      default:
        throw new Error(
          `VisualizerFactory: no visualizer registered for category "${category}".`,
        );
    }
  }
}
