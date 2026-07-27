'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { algorithmRegistry, type AlgorithmCategory } from '@/core/algorithms';
import { MAX_LANES, RaceController } from '@/core/playback/RaceController';
import { VisualizerLane } from '@/core/visualization/VisualizerLane';

export interface UseRaceOptions {
  category: AlgorithmCategory;
  /** Algorithm ids, one per lane. */
  algorithmIds: string[];
  seed: number;
  size: number;
}

/**
 * Runs several algorithms against one shared problem instance, on one clock.
 *
 * The bridge is intentionally symmetric with `useVisualizer`: same imperative
 * graph held in a ref, same `useSyncExternalStore` subscription, same
 * regenerate-then-reload lifecycle — just N lanes instead of one.
 */
export function useRace({ category, algorithmIds, seed, size }: UseRaceOptions) {
  const { scene } = useTheme();

  // One ref per lane, handed to the DOM. Sized to the cap so the array
  // identity is stable across renders even as the lane count changes.
  const containerRefs = useMemo(
    () => Array.from({ length: MAX_LANES }, () => ({ current: null as HTMLDivElement | null })),
    [],
  );

  const graph = useRef<{ lanes: VisualizerLane[]; controller: RaceController } | null>(null);
  const [ready, setReady] = useState(false);

  // Re-create the whole graph when the *set* of algorithms changes. Lanes own
  // GPU resources, so mutating the roster in place would be far more error-prone
  // than rebuilding it.
  const rosterKey = `${category}:${algorithmIds.join(',')}`;

  useEffect(() => {
    const ids = algorithmIds.slice(0, MAX_LANES).filter((id) => algorithmRegistry.get(id));
    if (ids.length === 0) return;

    const lanes = ids.map(
      (id, index) => new VisualizerLane(`lane-${index}`, category, id, { selfClocked: false }),
    );
    const controller = new RaceController(lanes);
    graph.current = { lanes, controller };

    lanes.forEach((lane, index) => {
      const container = containerRefs[index].current;
      if (container) lane.mount(container);
      lane.setTheme(scene);
    });

    // Lane 0 owns the clock; every lane advances by its delta so the race is
    // driven by exactly one time source.
    const unsubscribe = lanes[0].onFrame((dtMs) => controller.advance(dtMs));

    // Generate once, then clone into the others. Identical input is what makes
    // the comparison mean anything.
    lanes[0].regenerate({ size }, seed);
    const instance = lanes[0].module.getInstance();
    for (let i = 1; i < lanes.length; i += 1) lanes[i].useInstance(structuredClone(instance));

    setReady(true);

    return () => {
      unsubscribe();
      // Reverse order: the clock-owning lane goes last so no `advance` can
      // fire against an already-disposed model.
      for (let i = lanes.length - 1; i >= 0; i -= 1) lanes[i].dispose();
      graph.current = null;
      setReady(false);
    };
    // `scene` is applied via its own effect below; including it here would
    // tear down and rebuild every GPU context on a theme toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterKey, containerRefs]);

  const controller = graph.current?.controller;

  const snapshot = useSyncExternalStore(
    controller?.subscribe ?? noopSubscribe,
    controller?.getSnapshot ?? emptySnapshot,
    controller?.getSnapshot ?? emptySnapshot,
  );

  useEffect(() => {
    graph.current?.lanes.forEach((lane) => lane.setTheme(scene));
  }, [scene]);

  // Re-deal the problem without rebuilding the lanes.
  const regenerate = useCallback(
    (nextSeed: number, nextSize: number) => {
      const lanes = graph.current?.lanes;
      if (!lanes?.length) return;
      lanes[0].regenerate({ size: nextSize }, nextSeed);
      const instance = lanes[0].module.getInstance();
      for (let i = 1; i < lanes.length; i += 1) lanes[i].useInstance(structuredClone(instance));
      graph.current?.controller.reset();
    },
    [],
  );

  useEffect(() => {
    if (ready) regenerate(seed, size);
  }, [ready, seed, size, regenerate]);

  const actions = useMemo(
    () => ({
      toggle: () => graph.current?.controller.toggle(),
      reset: () => graph.current?.controller.reset(),
      stepForward: () => graph.current?.controller.stepForward(),
      stepBackward: () => graph.current?.controller.stepBackward(),
      seek: (fraction: number) => graph.current?.controller.seek(fraction),
      setSpeed: (speed: number) => graph.current?.controller.setSpeed(speed),
      regenerate: (nextSeed: number) => regenerate(nextSeed, size),
    }),
    [regenerate, size],
  );

  return { containerRefs, snapshot, ready, actions };
}

const EMPTY = {
  status: 'idle' as const,
  speed: 30,
  lanes: [],
  finishOrder: [],
};

function noopSubscribe(): () => void {
  return () => {};
}

function emptySnapshot() {
  return EMPTY;
}
