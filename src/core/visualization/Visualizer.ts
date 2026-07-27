import * as THREE from 'three';
import type { SceneTheme } from '@/theme';
import type { Renderable } from './backend/RenderBackend';
import type { FrameContext, VisualizationEngine } from './engine/VisualizationEngine';

/**
 * Base class for every scene-level visualization (sorting bars today; graph,
 * tree and searching scenes in future). It standardises the attach/detach
 * lifecycle against the engine and guarantees deterministic resource cleanup.
 *
 * Concrete visualizers own a `group`; everything they add to it is removed and
 * disposed automatically when the visualizer detaches. They implement three
 * hooks: build on attach, animate per frame, release on dispose.
 */
export abstract class Visualizer implements Renderable<VisualizationEngine> {
  protected readonly group = new THREE.Group();
  protected engine: VisualizationEngine | null = null;
  private unsubscribe: (() => void) | null = null;
  private floorMaterial: THREE.MeshStandardMaterial | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  /** Wire this visualizer into a running engine. */
  attach(engine: VisualizationEngine): void {
    if (this.engine) this.detach();
    this.engine = engine;
    engine.scene.add(this.group);
    this.onAttach(engine);
    this.unsubscribe = engine.onFrame((ctx) => this.onFrame(ctx));
  }

  /** Remove from the engine and free all GPU resources held by `group`. */
  detach(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.onDispose();
    if (this.engine) this.engine.scene.remove(this.group);
    this.disposeGroup();
    this.floorMaterial = null;
    this.gridHelper = null;
    this.engine = null;
  }

  /**
   * Re-colour existing meshes for a light/dark switch.
   *
   * The base implementation handles the shared "stage furniture" — floor plane
   * and grid — which every 3D family builds the same way. Families with themed
   * content of their own (bars, nodes, edges) override this and call `super`.
   *
   * Implementations must mutate materials in place: a geometry rebuild here
   * would drop every in-flight tween and make a theme switch look like a reset.
   */
  setTheme(theme: SceneTheme): void {
    this.floorMaterial?.color.set(theme.floor);
    if (this.gridHelper) {
      const material = this.gridHelper.material as THREE.Material & { color?: THREE.Color };
      material.color?.set(theme.grid);
    }
  }

  /**
   * Record the stage furniture so {@link setTheme} can recolour it.
   *
   * Called from each family's environment builder. Without this, a theme switch
   * would leave a black floor sitting under a light-mode scene.
   */
  protected registerEnvironment(
    floorMaterial: THREE.MeshStandardMaterial | null,
    grid: THREE.GridHelper | null,
  ): void {
    this.floorMaterial = floorMaterial;
    this.gridHelper = grid;
  }

  // ── Subclass contract ───────────────────────────────────────────────

  /** Build initial scene content. */
  protected abstract onAttach(engine: VisualizationEngine): void;
  /** Advance animation each frame (tweening, idle motion). */
  protected abstract onFrame(ctx: FrameContext): void;
  /** Release any non-`group` resources (shared geometries, etc.). */
  protected abstract onDispose(): void;

  // ── Shared helpers ──────────────────────────────────────────────────

  private disposeGroup(): void {
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose?.();
    });
    this.group.clear();
  }
}
