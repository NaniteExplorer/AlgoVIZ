'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { algorithmRegistry, type AlgorithmCategory, type AlgorithmMeta } from '@/core/algorithms';
import { PlaybackController } from '@/core/playback/PlaybackController';
import { pseudocodeRegistry, type Pseudocode } from '@/core/pseudocode';
import { useTheme } from '@/components/theme/ThemeProvider';
import { VisualizerFactory } from '@/core/visualization/VisualizerFactory';
import { VisualizationEngine } from '@/core/visualization/engine/VisualizationEngine';
import type { RenderBackend } from '@/core/visualization/backend/RenderBackend';
import { detectPerfTier, watchFrameRate } from '@/lib/perf';
import { MetricSeries } from '@/core/analysis/MetricSeries';
import type { ControlSpec, LegendItem, MetricSpec } from '@/core/visualization/CategoryModule';

export interface VisualizerActions {
  play(): void;
  pause(): void;
  toggle(): void;
  stepForward(): void;
  stepBackward(): void;
  seek(index: number): void;
  setSpeed(stepsPerSecond: number): void;
  regenerate(): void;
  selectAlgorithm(id: string): void;
  setParam(key: string, value: number): void;
}

/**
 * The single React ⇄ engine bridge, generic over the algorithm family.
 *
 * It owns the imperative object graph (engine, playback controller, and the
 * family's {@link CategoryModule}) in refs so React re-renders never recreate
 * the WebGL world, and surfaces playback state through `useSyncExternalStore`
 * so the UI stays in lock-step with the render loop without polling.
 *
 * Everything below the hook is category-blind: the only family-specific code is
 * the `CategoryModule` resolved from the factory. The hook is instantiated once
 * per category (the studio remounts on category change via a React `key`), which
 * guarantees clean WebGL teardown without any dynamic re-subscription.
 */
export interface UseVisualizerOptions {
  /**
   * Algorithm to open with — the route's slug.
   *
   * Passed rather than defaulted so a deep link lands on the right algorithm
   * without a visible switch from the family's first entry.
   */
  initialAlgorithmId?: string;
}

export function useVisualizer(category: AlgorithmCategory, options: UseVisualizerOptions = {}) {
  const { scene } = useTheme();
  const algorithms = useMemo<AlgorithmMeta[]>(
    () => algorithmRegistry.listByCategory(category).map((a) => a.meta),
    [category],
  );

  const [algorithmId, setAlgorithmId] = useState(
    () => options.initialAlgorithmId ?? algorithms[0]?.id ?? '',
  );

  // Imperative singletons — created exactly once for this category's lifetime.
  const graph = useRef<{
    vizModule: ReturnType<typeof VisualizerFactory.create>;
    controller: PlaybackController<unknown>;
    series: MetricSeries;
  } | null>(null);
  if (!graph.current) {
    const vizModule = VisualizerFactory.create(category);
    const series = new MetricSeries(vizModule.metricSpecs.map((m) => m.key));
    const controller = new PlaybackController<unknown>(vizModule.model, {
      getMetrics: () => vizModule.metrics(),
      getNote: (step) => vizModule.describe(step),
      getLine: (step) => vizModule.lineOf(step),
      // Capture the metric history as the run unfolds. Because each cursor is
      // recorded only the first time it is reached, scrubbing costs nothing.
      onStepApplied: (cursor) => series.record(cursor, vizModule.metrics()),
      speed: 30,
    });
    graph.current = { vizModule, controller, series };
  }
  const { vizModule, controller, series } = graph.current;

  const [params, setParams] = useState<Record<string, number>>(() =>
    Object.fromEntries(vizModule.controls.map((c) => [c.key, c.default])),
  );

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  // Retained so imperative controls (the mobile Interact toggle) can reach the
  // live backend without threading it through React state.
  const backendRef = useRef<RenderBackend | null>(null);
  const algorithmIdRef = useRef(algorithmId);
  const paramsRef = useRef(params);
  algorithmIdRef.current = algorithmId;
  paramsRef.current = params;

  // Run the *current* algorithm against the *current* dataset.
  const reloadTimeline = useCallback(() => {
    const algorithm = algorithmRegistry.require(algorithmIdRef.current);
    const steps = vizModule.buildTimeline(algorithm);
    // Size the series for the new timeline before loading it, so the very
    // first applied step has somewhere to go.
    series.reset(steps.length, vizModule.metricSpecs.map((m) => m.key));
    controller.load(steps);
  }, [vizModule, controller, series]);

  // Fresh random dataset → re-layout the scene → recompute the timeline.
  const regenerate = useCallback(() => {
    vizModule.regenerate(paramsRef.current);
    vizModule.rebuild();
    reloadTimeline();
  }, [vizModule, reloadTimeline]);

  // Renderer lifecycle — mount on first paint, fully dispose on unmount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let stopFrameWatch: (() => void) | null = null;

    // The module owns which backend it needs (WebGL scene vs 2D diagram); the
    // hook stays renderer-blind.
    const backend = vizModule.createBackend();
    backendRef.current = backend;
    backend.mount(container);
    vizModule.attachTo(backend);
    // The backend's clock is the single time source: it advances playback, which
    // mutates the model, which the visualizer reads on the very same frame.
    const unsubscribe = backend.onFrame((ctx) => controller.advance(ctx.dt * 1000));
    regenerate();

    // Drop to the cheap profile immediately on a weak device, and again if the
    // measured frame rate says we guessed wrong.
    if (backend instanceof VisualizationEngine) {
      if (detectPerfTier() === 'low') backend.setQuality('low');
      stopFrameWatch = watchFrameRate(() => backend.setQuality('low'));
    }

    // Stop rendering when the stage scrolls out of view or the tab is hidden.
    // On a phone this is the difference between a warm battery and a hot one.
    const pausable = backend as { setPaused?(paused: boolean): void };
    const observer = new IntersectionObserver(
      ([entry]) => pausable.setPaused?.(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(container);

    const onVisibility = () => pausable.setPaused?.(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stopFrameWatch?.();
      stopFrameWatch = null;
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
      unsubscribe();
      vizModule.detach();
      backend.dispose();
      backendRef.current = null;
    };
    // Intentionally run once: the imperative graph is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recolour in place on a theme switch. Remounting would be far simpler but
  // would also reset playback to step zero, which is a hostile thing to do to
  // someone halfway through watching a sort.
  useEffect(() => {
    vizModule.setTheme(scene);
  }, [vizModule, scene]);

  // Follow the route. Navigating between siblings in a family changes only this
  // prop, so the scene, camera and GPU context all survive the transition —
  // remounting per algorithm would make every sidebar click flash black.
  const routeAlgorithmId = options.initialAlgorithmId;
  useEffect(() => {
    if (!routeAlgorithmId || routeAlgorithmId === algorithmIdRef.current) return;
    if (!algorithms.some((a) => a.id === routeAlgorithmId)) return;
    setAlgorithmId(routeAlgorithmId);
    algorithmIdRef.current = routeAlgorithmId;
    reloadTimeline();
  }, [routeAlgorithmId, algorithms, reloadTimeline]);

  /**
   * Camera interaction toggle.
   *
   * On touch devices the stage starts non-interactive so one-finger drag
   * scrolls the page; enabling it hands single-finger gestures to OrbitControls.
   * On desktop this is always on and the control isn't shown.
   */
  const setInteractive = useCallback((interactive: boolean) => {
    const backend = backendRef.current;
    if (!(backend instanceof VisualizationEngine)) return;
    backend.setControlsEnabled(interactive);
    backend.setTouchMode(interactive ? 'one-finger' : 'off');
  }, []);

  const actions = useMemo<VisualizerActions>(
    () => ({
      play: () => controller.play(),
      pause: () => controller.pause(),
      toggle: () => controller.toggle(),
      stepForward: () => controller.stepForward(),
      stepBackward: () => controller.stepBackward(),
      seek: (index) => controller.seek(index),
      setSpeed: (s) => controller.setSpeed(s),
      regenerate: () => regenerate(),
      selectAlgorithm: (id) => {
        setAlgorithmId(id);
        algorithmIdRef.current = id;
        reloadTimeline();
      },
      setParam: (key, value) => {
        setParams((prev) => {
          const next = { ...prev, [key]: value };
          paramsRef.current = next;
          return next;
        });
        regenerate();
      },
    }),
    [controller, regenerate, reloadTimeline],
  );

  const currentMeta = useMemo(
    () => algorithms.find((a) => a.id === algorithmId) ?? algorithms[0],
    [algorithms, algorithmId],
  );

  // Undefined for algorithms that haven't been annotated yet — the pane hides
  // itself rather than showing an empty listing.
  const pseudocode = useMemo<Pseudocode | undefined>(
    () => pseudocodeRegistry.get(algorithmId),
    [algorithmId],
  );

  return {
    containerRef,
    snapshot,
    algorithms,
    algorithmId,
    currentMeta,
    pseudocode,
    params,
    controls: vizModule.controls as ControlSpec[],
    metricSpecs: vizModule.metricSpecs as MetricSpec[],
    legend: vizModule.legend() as LegendItem[],
    /** 'webgl' or 'canvas2d' — lets the chrome show a WebGL fallback only where relevant. */
    backendKind: vizModule.backend.kind,
    series,
    setInteractive,
    actions,
  };
}
