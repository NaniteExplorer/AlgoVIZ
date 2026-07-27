import type { SceneTheme } from '@/theme';
import { CategoryModule } from './CategoryModule';
import type { BackendSpec } from './backend/BackendSpec';
import type { RenderBackend } from './backend/RenderBackend';
import { VisualizationEngine, type EngineOptions } from './engine/VisualizationEngine';
import type { Visualizer } from './Visualizer';

/**
 * Base for families that render as Three.js scenes.
 *
 * Absorbs the backend plumbing so a family only declares its `engineOptions`
 * and its `visualizer` — exactly what the four original families already had
 * before the renderer seam existed.
 */
export abstract class WebGLCategoryModule<
  TStep = unknown,
  TInput = unknown,
> extends CategoryModule<TStep, TInput> {
  /** Engine configuration (camera, bloom, controls) tuned for this family. */
  abstract readonly engineOptions: EngineOptions;
  /** The scene renderer that pulls from `model` every frame. */
  abstract readonly visualizer: Visualizer;

  private engine: VisualizationEngine | null = null;

  get backend(): BackendSpec {
    return { kind: 'webgl', options: this.engineOptions };
  }

  createBackend(): RenderBackend {
    this.engine = new VisualizationEngine(this.engineOptions);
    return this.engine;
  }

  attachTo(backend: RenderBackend): void {
    this.visualizer.attach(backend as VisualizationEngine);
  }

  detach(): void {
    this.visualizer.detach();
    this.engine = null;
  }

  override setTheme(theme: SceneTheme): void {
    this.engine?.setTheme(theme);
    this.visualizer.setTheme(theme);
  }
}
