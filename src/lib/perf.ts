import type { QualityTier } from '@/core/visualization/engine/VisualizationEngine';

/**
 * Device capability probing for the render quality tier.
 *
 * The expensive part of the scene is post-processing, not the geometry: the
 * bloom chain costs a mid-range phone GPU more than everything else combined.
 * So the tier decides whether the composer runs at all, plus how many pixels we
 * ask for — the two knobs that actually move the frame rate.
 */

/** Coarse pointer = touch. Detected by capability, never by viewport width. */
export function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

interface NavigatorWithMemory extends Navigator {
  /** Chromium-only; absent elsewhere. */
  deviceMemory?: number;
}

/**
 * Initial guess from static device signals.
 *
 * Only downgrades touch devices: a desktop with four cores still has a discrete
 * or decent integrated GPU, whereas a four-core phone almost never does, and
 * getting this wrong on desktop would needlessly strip the app's signature look.
 */
export function detectPerfTier(): QualityTier {
  if (typeof window === 'undefined') return 'high';
  if (!isCoarsePointer()) return 'high';

  const nav = navigator as NavigatorWithMemory;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const denseScreen = (window.devicePixelRatio ?? 1) > 2.5;
  const lowMemory = (nav.deviceMemory ?? 8) <= 4;
  return fewCores || denseScreen || lowMemory ? 'low' : 'high';
}

/**
 * Watch the real frame rate and report a downgrade if the device can't keep up.
 *
 * Static signals miss thermally throttled laptops and unusual GPUs, so this is
 * the safety net. Deliberately **one-way**: a device that recovers is not
 * upgraded back, because oscillating between quality tiers is far more
 * distracting than simply staying at the lower one.
 */
export function watchFrameRate(onDowngrade: () => void, sampleFrames = 90): () => void {
  if (typeof window === 'undefined') return () => {};

  let frames = 0;
  let start = performance.now();
  let rafId = 0;
  let cancelled = false;

  const tick = () => {
    if (cancelled) return;
    frames += 1;
    if (frames >= sampleFrames) {
      const fps = (frames * 1000) / (performance.now() - start);
      if (fps < 40) {
        onDowngrade();
        return; // one-way: stop sampling once downgraded
      }
      frames = 0;
      start = performance.now();
    }
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
