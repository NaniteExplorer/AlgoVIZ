import * as THREE from 'three';
import { makeLabelSprite } from './glow';

/**
 * A thin glowing connection between two points, oriented as a stretched
 * cylinder so it catches the bloom pass (plain GL lines do not). Colour and
 * opacity are damped toward target state every frame. Optionally carries a
 * weight label at its midpoint (used by weighted-graph algorithms).
 *
 * Endpoints are fixed at construction (graph/tree layouts are static once
 * generated), so the transform is computed once; only the material animates.
 */
export class GlowEdge {
  readonly group = new THREE.Group();
  private readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly label: THREE.Sprite | null;

  private readonly color = new THREE.Color('#1e3a8a');
  private readonly targetColor = new THREE.Color('#1e3a8a');
  private targetEmissive = 0.15;
  private targetOpacity = 0.5;
  /** Baked-in cylinder length, so `setEndpoints` can rescale instead of rebuild. */
  private readonly baseLength: number;

  private static readonly LAMBDA = 12;

  constructor(a: THREE.Vector3, b: THREE.Vector3, radius = 0.12, weight?: number) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = Math.max(dir.length(), 0.0001);
    this.baseLength = length;
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8, 1, true);
    this.material = new THREE.MeshStandardMaterial({
      color: this.color.clone(),
      emissive: this.color.clone(),
      emissiveIntensity: this.targetEmissive,
      transparent: true,
      opacity: this.targetOpacity,
      roughness: 0.4,
      metalness: 0.1,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);

    // Orient the +Y cylinder along the a→b direction and centre it.
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    this.mesh.position.copy(mid);
    this.mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    this.group.add(this.mesh);

    this.label = weight !== undefined ? makeLabelSprite(String(weight), '#94a3b8') : null;
    if (this.label) {
      this.label.scale.multiplyScalar(0.55);
      this.label.position.copy(mid);
      this.group.add(this.label);
    }
  }

  /**
   * Re-aim the edge at a new pair of endpoints.
   *
   * Rescales the existing cylinder rather than rebuilding its geometry, so an
   * edge can be pooled and reused. That matters for the disjoint-set forest,
   * whose parent pointers move on nearly every union — allocating fresh
   * geometry each time would thrash the GPU throughout a Kruskal run.
   */
  setEndpoints(a: THREE.Vector3, b: THREE.Vector3): void {
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = Math.max(dir.length(), 0.0001);
    this.mesh.scale.y = length / this.baseLength;
    this.mesh.position.copy(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5));
    this.mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
  }

  /** Hide without disposing — used by pooled edges that are currently unused. */
  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  setTargetStyle(colorHex: string, emissive: number, opacity: number): void {
    this.targetColor.set(colorHex);
    this.targetEmissive = emissive;
    this.targetOpacity = opacity;
  }

  update(dt: number): void {
    const t = 1 - Math.exp(-GlowEdge.LAMBDA * dt);
    this.color.lerp(this.targetColor, t);
    this.material.color.copy(this.color);
    this.material.emissive.copy(this.color);
    this.material.emissiveIntensity = THREE.MathUtils.damp(
      this.material.emissiveIntensity,
      this.targetEmissive,
      GlowEdge.LAMBDA,
      dt,
    );
    this.material.opacity = THREE.MathUtils.damp(
      this.material.opacity,
      this.targetOpacity,
      GlowEdge.LAMBDA,
      dt,
    );
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    if (this.label) {
      this.label.material.map?.dispose();
      this.label.material.dispose();
    }
  }
}
