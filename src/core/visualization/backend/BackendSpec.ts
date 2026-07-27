import type { EngineOptions } from '../engine/VisualizationEngine';
import type { Canvas2DOptions } from './Canvas2DBackend';

/**
 * Declarative, serialisable statement of which renderer a family needs.
 *
 * Kept as plain data (rather than "the module just news up a backend") so the
 * chrome can reason about the renderer *before* mounting — e.g. the perf tier
 * only downgrades WebGL settings, and the WebGL-unsupported fallback only
 * applies to `kind: 'webgl'` families.
 */
export type BackendSpec =
  | { readonly kind: 'webgl'; readonly options: EngineOptions }
  | { readonly kind: 'canvas2d'; readonly options: Canvas2DOptions };
