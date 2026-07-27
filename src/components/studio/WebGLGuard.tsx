'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Detects WebGL support before a family that needs it tries to mount.
 *
 * Probed in an effect, never during render: `document` does not exist during
 * SSR, and a render-time probe would also create a throwaway GL context on
 * every re-render.
 *
 * `undefined` means "not yet determined" — rendering the fallback during that
 * window would flash a failure message at everyone on first paint.
 */
export function useWebGLSupport(): boolean | undefined {
  const [supported, setSupported] = useState<boolean | undefined>();

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const context =
        canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl');
      setSupported(Boolean(context));
      // Release the probe context immediately — browsers cap how many can be
      // live at once, and the race view needs every one of them.
      (context as WebGLRenderingContext | null)
        ?.getExtension('WEBGL_lose_context')
        ?.loseContext();
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}

/**
 * Renders `fallback` when WebGL is unavailable.
 *
 * The point is that the page stays useful: the algorithm's description,
 * complexity, pseudocode and lesson are all plain DOM, so losing the 3D scene
 * costs the animation and nothing else.
 */
export function WebGLGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const supported = useWebGLSupport();
  if (supported === false) return <>{fallback}</>;
  return <>{children}</>;
}

export function WebGLUnavailable() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <p className="text-sm font-medium text-content-primary">3D rendering is unavailable</p>
      <p className="max-w-sm text-xs leading-relaxed text-content-muted">
        Your browser or graphics driver does not expose WebGL, so the animated scene can&apos;t be
        drawn. Everything else on this page — the walkthrough, the pseudocode and the complexity
        analysis — still works.
      </p>
    </div>
  );
}
