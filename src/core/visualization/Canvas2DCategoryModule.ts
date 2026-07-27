import type { SceneTheme } from '@/theme';
import { CategoryModule } from './CategoryModule';
import { Canvas2DBackend, type Canvas2DOptions } from './backend/Canvas2DBackend';
import type { Canvas2DVisualizer } from './backend/Canvas2DVisualizer';
import type { BackendSpec } from './backend/BackendSpec';
import type { RenderBackend } from './backend/RenderBackend';
import { canvasTheme, type Canvas2DTheme } from './draw/theme2d';

/**
 * Base for families that render as 2D diagrams — DP tables, recursion trees,
 * data-structure layouts.
 *
 * Mirrors {@link WebGLCategoryModule} exactly, so the two are drop-in
 * alternatives from the chrome's point of view. The one asymmetry: 2D families
 * get their palette as a plain {@link Canvas2DTheme} value rather than reading
 * scene lights, so `setTheme` translates the app's `SceneTheme` into it.
 */
export abstract class Canvas2DCategoryModule<
  TStep = unknown,
  TInput = unknown,
> extends CategoryModule<TStep, TInput> {
  /** Backend configuration (backdrop, DPR cap) tuned for this family. */
  abstract readonly canvasOptions: Canvas2DOptions;
  /** The 2D renderer that pulls from `model` every frame. */
  abstract readonly visualizer: Canvas2DVisualizer;

  protected theme: Canvas2DTheme = canvasTheme('dark');
  private canvasBackend: Canvas2DBackend | null = null;

  get backend(): BackendSpec {
    return { kind: 'canvas2d', options: this.canvasOptions };
  }

  createBackend(): RenderBackend {
    this.canvasBackend = new Canvas2DBackend({
      background: this.theme.background,
      ...this.canvasOptions,
    });
    return this.canvasBackend;
  }

  attachTo(backend: RenderBackend): void {
    this.visualizer.attach(backend as Canvas2DBackend);
  }

  detach(): void {
    this.visualizer.detach();
    this.canvasBackend = null;
  }

  override setTheme(theme: SceneTheme): void {
    this.theme = canvasTheme(theme.mode);
    this.canvasBackend?.setBackground(this.theme.background);
    this.onThemeChange(this.theme);
    this.visualizer.invalidateLayout();
  }

  /** Hand the new palette to the family's visualizer. */
  protected abstract onThemeChange(theme: Canvas2DTheme): void;
}
