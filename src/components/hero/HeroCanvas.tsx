'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { VisualizationEngine } from '@/core/visualization/engine/VisualizationEngine';
import { HeroVisualizer } from '@/core/visualization/hero/HeroVisualizer';
import { detectPerfTier } from '@/lib/perf';

/**
 * The hero's idle, auto-rotating background scene.
 *
 * Split out of `Hero` and loaded with `ssr: false` so Three.js stays out of the
 * marketing page's server bundle. It is pure decoration — server-rendering it
 * would cost the entire library on a page whose actual content is text.
 */
export default function HeroCanvas() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const { scene } = useTheme();
  const engineRef = useRef<VisualizationEngine | null>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const engine = new VisualizationEngine({
      enableControls: false,
      autoRotate: false,
      // Restrained bloom: enough to make the nodes glow, not so much that the
      // scene blooms into a white wash behind the wordmark.
      bloomStrength: 0.55,
      bloomRadius: 0.6,
      bloomThreshold: 0.22,
      cameraPosition: [0, 4, 64],
      cameraTarget: [0, 0, 0],
    });
    engineRef.current = engine;
    engine.mount(container);
    if (detectPerfTier() === 'low') engine.setQuality('low');

    const visualizer = new HeroVisualizer();
    visualizer.attach(engine);

    // Decoration should never burn battery in a background tab.
    const onVisibility = () => engine.setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      visualizer.detach();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setTheme(scene);
  }, [scene]);

  return <div ref={canvasRef} className="absolute inset-0" aria-hidden />;
}
