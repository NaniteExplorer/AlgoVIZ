import * as THREE from 'three';
import { Visualizer } from '../Visualizer';
import type { FrameContext, VisualizationEngine } from '../engine/VisualizationEngine';
import { SearchModel } from '@/core/model/SearchModel';
import { SCENE } from '@/theme';
import { Bar } from '../primitives/Bar';
import { makeLabelSprite } from '../primitives/glow';
import { SEARCH_ROLE_STYLES, TARGET_MARKER_COLOR } from './palette';

/**
 * Renders a {@link SearchModel} as a sorted staircase of glowing pillars with a
 * floating "target" marker line drawn across the field at the target's height.
 *
 * Like the sorting visualizer it is a pure *pull* renderer — every frame it
 * reads each cell's value + role and eases the bar toward it — so single-step,
 * autoplay and scrubbing all look identical. The target line makes the search
 * goal legible at a glance: learners can see the probe pillar rise to meet it.
 */
export class SearchingVisualizer extends Visualizer {
  private static readonly TOTAL_WIDTH = 64;
  private static readonly MAX_HEIGHT = 26;
  private static readonly FILL_RATIO = 0.72;

  private bars: Bar[] = [];
  private sharedGeometry: THREE.BoxGeometry | null = null;
  private marker: THREE.Group | null = null;

  constructor(private readonly model: SearchModel) {
    super();
  }

  protected onAttach(_engine: VisualizationEngine): void {
    void _engine;
    this.sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.buildEnvironment();
    this.rebuild();
  }

  protected onFrame(ctx: FrameContext): void {
    const { maxValue } = this.model;
    for (let i = 0; i < this.bars.length; i += 1) {
      const target = (this.model.value(i) / maxValue) * SearchingVisualizer.MAX_HEIGHT;
      const style = SEARCH_ROLE_STYLES[this.model.roleAt(i)];
      const bar = this.bars[i];
      bar.setTargetHeight(target);
      bar.setTargetStyle(style.color, style.emissive);
      bar.update(ctx.dt);
    }
    // Gently pulse the target marker so it reads as "the thing we're hunting".
    if (this.marker) {
      const pulse = 0.6 + Math.sin(ctx.elapsed * 2.4) * 0.4;
      this.marker.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
        if (mat?.emissiveIntensity !== undefined) mat.emissiveIntensity = pulse;
      });
    }
  }

  protected onDispose(): void {
    this.sharedGeometry?.dispose();
    this.sharedGeometry = null;
    this.bars = [];
    this.marker = null;
  }

  rebuild(): void {
    if (!this.sharedGeometry) return;
    this.bars.forEach((bar) => {
      this.group.remove(bar.mesh);
      (bar.mesh.material as THREE.Material).dispose();
    });
    this.bars = [];

    const count = this.model.size;
    const { TOTAL_WIDTH, FILL_RATIO, MAX_HEIGHT } = SearchingVisualizer;
    const slot = TOTAL_WIDTH / Math.max(count, 1);
    const width = slot * FILL_RATIO;

    for (let i = 0; i < count; i += 1) {
      const x = -TOTAL_WIDTH / 2 + (i + 0.5) * slot;
      const height = (this.model.value(i) / this.model.maxValue) * MAX_HEIGHT;
      const bar = new Bar(this.sharedGeometry, x, width, height);
      this.bars.push(bar);
      this.group.add(bar.mesh);
    }

    this.buildTargetMarker();
  }

  /** A glowing line + label across the field at the target value's height. */
  private buildTargetMarker(): void {
    if (this.marker) {
      this.group.remove(this.marker);
      this.marker.traverse((obj) => {
        const mesh = obj as THREE.Mesh & { material?: THREE.Material };
        mesh.geometry?.dispose?.();
        const mat = mesh.material;
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
      });
      this.marker = null;
    }

    const { TOTAL_WIDTH, MAX_HEIGHT } = SearchingVisualizer;
    const y = (this.model.target / this.model.maxValue) * MAX_HEIGHT;

    const group = new THREE.Group();
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(TOTAL_WIDTH + 4, 0.3, 0.3),
      new THREE.MeshStandardMaterial({
        color: TARGET_MARKER_COLOR,
        emissive: TARGET_MARKER_COLOR,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85,
      }),
    );
    line.position.set(0, y, 0);
    group.add(line);

    const label = makeLabelSprite(`target ${this.model.target}`, TARGET_MARKER_COLOR);
    label.position.set(TOTAL_WIDTH / 2 + 6, y, 0);
    group.add(label);

    this.marker = group;
    this.group.add(group);
  }

  private buildEnvironment(): void {
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: SCENE.floor,
      roughness: 0.6,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;

    const grid = new THREE.GridHelper(220, 60, SCENE.grid, SCENE.grid);
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;

    this.registerEnvironment(floorMaterial, grid);
    this.group.add(floor, grid);
  }
}
