import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SCENE_THEMES, type SceneTheme } from '@/theme';
import type { FrameContext as BaseFrameContext, RenderBackend } from '../backend/RenderBackend';

/**
 * Per-frame context handed to every tick subscriber.
 *
 * Extends the backend-neutral {@link BaseFrameContext} with the WebGL specifics
 * visualizers need. The name is kept (rather than renamed to `WebGLFrameContext`)
 * because every existing visualizer imports it from this module.
 */
export interface FrameContext extends BaseFrameContext {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
}

/** Alias for code that wants to be explicit about which backend it is on. */
export type WebGLFrameContext = FrameContext;

/** How a touch device is allowed to drive the camera. */
export type TouchMode = 'one-finger' | 'two-finger' | 'off';

/** Coarse rendering quality tier, chosen from the device's capabilities. */
export type QualityTier = 'low' | 'high';

export interface EngineOptions {
  /** Bloom strength; 0 disables the glow. */
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  /** Allow the user to orbit the camera. */
  enableControls?: boolean;
  /** Subtle automatic camera drift for a "living" idle scene. */
  autoRotate?: boolean;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  /** Upper bound on `devicePixelRatio`. Lower it on weak GPUs. */
  pixelRatioCap?: number;
  /** Run the bloom/output composer. Disabling renders direct — much cheaper. */
  postProcessing?: boolean;
  antialias?: boolean;
  /**
   * Touch gesture policy. `two-finger` leaves one-finger drag to the page, which
   * is what keeps a phone able to scroll past a full-bleed canvas.
   */
  touchMode?: TouchMode;
  /** Initial colour scheme; switch later with {@link VisualizationEngine.setTheme}. */
  theme?: SceneTheme;
}

type TickFn = (ctx: FrameContext) => void;

/**
 * Owns the entire WebGL stack — renderer, scene, camera, post-processing and the
 * animation loop — and nothing domain-specific. Visualizers attach to it by
 * adding objects to `scene` and subscribing to `onFrame`. This separation means
 * the engine can host a sorting scene today and a graph/tree scene tomorrow with
 * zero changes; only the attached visualizer differs.
 *
 * Lifecycle: `new` → `mount(container)` → … → `dispose()`. All GPU resources are
 * released on dispose, and a ResizeObserver keeps the framebuffer crisp.
 *
 * Implements {@link RenderBackend} so the React bridge can hold it and the 2D
 * backend interchangeably.
 */
export class VisualizationEngine implements RenderBackend<FrameContext> {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloomPass: UnrealBloomPass;
  private controls: OrbitControls | null = null;

  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;
  private running = false;
  private disposed = false;
  private paused = false;

  private theme: SceneTheme;
  private ambient: THREE.AmbientLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private rimLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.PointLight | null = null;

  private readonly tickFns = new Set<TickFn>();
  private readonly options: Required<Omit<EngineOptions, 'theme'>>;

  constructor(options: EngineOptions = {}) {
    this.options = {
      bloomStrength: options.bloomStrength ?? 0.85,
      bloomRadius: options.bloomRadius ?? 0.5,
      bloomThreshold: options.bloomThreshold ?? 0.15,
      enableControls: options.enableControls ?? true,
      autoRotate: options.autoRotate ?? false,
      cameraPosition: options.cameraPosition ?? [0, 26, 62],
      cameraTarget: options.cameraTarget ?? [0, 9, 0],
      pixelRatioCap: options.pixelRatioCap ?? 2,
      postProcessing: options.postProcessing ?? true,
      antialias: options.antialias ?? true,
      touchMode: options.touchMode ?? 'one-finger',
    };
    this.theme = options.theme ?? SCENE_THEMES.dark;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.theme.background);
    this.scene.fog = new THREE.Fog(this.theme.fog, 70, 180);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(...this.options.cameraPosition);

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.options.antialias,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(
      Math.min(globalThis.devicePixelRatio ?? 1, this.options.pixelRatioCap),
    );
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Post-processing chain: scene → bloom → tone-mapped output.
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      this.options.bloomStrength * this.theme.bloomScale,
      this.options.bloomRadius,
      this.options.bloomThreshold,
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    this.setupLighting();
  }

  /** Attach the canvas to the DOM, wire resize, and start the loop. */
  mount(container: HTMLElement): void {
    if (this.disposed) return;
    this.container = container;
    container.appendChild(this.renderer.domElement);
    Object.assign(this.renderer.domElement.style, {
      display: 'block',
      width: '100%',
      height: '100%',
    });

    if (this.options.enableControls) {
      const controls = new OrbitControls(this.camera, this.renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.minDistance = 30;
      controls.maxDistance = 110;
      controls.maxPolarAngle = Math.PI * 0.495; // never drop below the floor
      controls.autoRotate = this.options.autoRotate;
      controls.autoRotateSpeed = 0.6;
      controls.target.set(...this.options.cameraTarget);
      this.applyTouchMode(controls);
      controls.update();
      this.controls = controls;
    } else {
      this.camera.lookAt(new THREE.Vector3(...this.options.cameraTarget));
    }

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.start();
  }

  /** Subscribe a per-frame callback. Returns an unsubscribe fn. */
  onFrame(fn: TickFn): () => void {
    this.tickFns.add(fn);
    return () => this.tickFns.delete(fn);
  }

  /**
   * Recolour the scene in place for a light/dark switch.
   *
   * Materials owned by attached visualizers are *not* touched here — each
   * `Visualizer.setTheme` handles its own meshes — so this only covers the
   * scene-level concerns the engine owns: backdrop, fog, lights and bloom.
   */
  setTheme(theme: SceneTheme): void {
    this.theme = theme;
    (this.scene.background as THREE.Color | null)?.set(theme.background);
    if (this.scene.fog) (this.scene.fog as THREE.Fog).color.set(theme.fog);
    if (this.ambient) this.ambient.intensity = theme.ambientIntensity;
    this.keyLight?.color.set(theme.keyLight);
    this.rimLight?.color.set(theme.rimLight);
    this.fillLight?.color.set(theme.rimLight);
    this.bloomPass.strength = this.options.bloomStrength * theme.bloomScale;
  }

  /** The palette the scene is currently rendering with. */
  getTheme(): SceneTheme {
    return this.theme;
  }

  /**
   * Drop to a cheaper rendering profile on weak hardware.
   *
   * Post-processing is the expensive part — a phone GPU spends more on the
   * bloom passes than on the whole scene — so `low` skips the composer entirely
   * and renders direct.
   */
  setQuality(tier: QualityTier): void {
    if (tier === 'low') {
      this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, 1.5));
      this.options.postProcessing = false;
    } else {
      this.renderer.setPixelRatio(
        Math.min(globalThis.devicePixelRatio ?? 1, this.options.pixelRatioCap),
      );
      this.options.postProcessing = true;
    }
    this.resize();
  }

  /** Enable/disable camera interaction — used by the mobile "Interact" toggle. */
  setControlsEnabled(enabled: boolean): void {
    if (this.controls) this.controls.enabled = enabled;
  }

  /** Change the touch gesture policy after mount. */
  setTouchMode(mode: TouchMode): void {
    this.options.touchMode = mode;
    if (this.controls) this.applyTouchMode(this.controls);
  }

  /**
   * Freeze the loop without tearing down. Driven by an IntersectionObserver on
   * the stage and by `visibilitychange`, which together are the single biggest
   * battery win on mobile.
   */
  setPaused(paused: boolean): void {
    this.paused = paused;
    if (!paused) this.lastTime = performance.now();
  }

  /** Tear down all GPU + DOM resources. Safe to call more than once. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls?.dispose();
    this.controls = null;
    this.tickFns.clear();

    this.disposeSceneGraph();
    this.ambient = null;
    this.keyLight = null;
    this.rimLight = null;
    this.fillLight = null;
    this.composer.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container?.removeChild(this.renderer.domElement);
    }
    this.container = null;
  }

  // ── Internals ───────────────────────────────────────────────────────

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, this.theme.ambientIntensity);
    const key = new THREE.DirectionalLight(this.theme.keyLight, 1.1);
    key.position.set(18, 40, 28);
    const rim = new THREE.DirectionalLight(this.theme.rimLight, 0.8);
    rim.position.set(-24, 16, -18);
    const fill = new THREE.PointLight(this.theme.rimLight, 0.5, 220);
    fill.position.set(0, 30, 40);

    // Held as fields so `setTheme` can recolour them without a scene rebuild.
    this.ambient = ambient;
    this.keyLight = key;
    this.rimLight = rim;
    this.fillLight = fill;
    this.scene.add(ambient, key, rim, fill);
  }

  /**
   * Map the touch policy onto OrbitControls' gesture table.
   *
   * `two-finger` is the important one: it leaves single-finger drag unclaimed so
   * the browser can scroll the page, which is the difference between a canvas
   * that traps the user and one that doesn't.
   */
  private applyTouchMode(controls: OrbitControls): void {
    switch (this.options.touchMode) {
      case 'one-finger':
        controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
        break;
      case 'two-finger':
        // `undefined` = gesture not handled, so the event falls through to the page.
        controls.touches = {
          ONE: undefined as unknown as THREE.TOUCH,
          TWO: THREE.TOUCH.DOLLY_ROTATE,
        };
        break;
      case 'off':
        controls.touches = {
          ONE: undefined as unknown as THREE.TOUCH,
          TWO: undefined as unknown as THREE.TOUCH,
        };
        break;
    }
  }

  private start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      if (!this.paused) {
        this.elapsed += dt;
        this.controls?.update();
        const ctx: FrameContext = {
          dt,
          elapsed: this.elapsed,
          scene: this.scene,
          camera: this.camera,
        };
        this.tickFns.forEach((fn) => fn(ctx));
        if (this.options.postProcessing) this.composer.render();
        else this.renderer.render(this.scene, this.camera);
      }

      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private resize(): void {
    if (!this.container) return;
    const { clientWidth: w, clientHeight: h } = this.container;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloomPass.resolution.set(w, h);
  }

  /** Recursively release geometries/materials for everything still in the scene. */
  private disposeSceneGraph(): void {
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose?.();
    });
    this.scene.clear();
  }
}
