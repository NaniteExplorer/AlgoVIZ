'use client';

import dynamic from 'next/dynamic';
import { algorithmRegistry } from '@/core/algorithms';

// Client-only: keeps Three.js out of the marketing page's server bundle.
const HeroCanvas = dynamic(() => import('./HeroCanvas'), { ssr: false });

/**
 * Full-bleed AlgoViz hero: an idle 3D scene with the brand wordmark, live
 * platform stats and CTAs layered above it.
 */
export function Hero() {
  const algorithmCount = algorithmRegistry.list().length;
  const familyCount = algorithmRegistry.categories().length;

  const scrollToStudio = () => {
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="top"
      className="relative flex h-[100svh] min-h-[640px] w-full items-center justify-center overflow-hidden"
    >
      <HeroCanvas />

      {/* Layered legibility scrim: a soft central pool lifts contrast behind the
          wordmark, an edge vignette frames the scene, and a bottom fade hands off
          cleanly to the page below. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_center,_rgba(5,6,10,0.7)_0%,_transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(5,6,10,0.6)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-surface-950 via-surface-950/70 to-transparent" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <span className="mb-5 animate-fade-up rounded-full border border-surface-700 bg-surface-900/50 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.3em] text-accent-glow backdrop-blur">
          Learn algorithms by watching them
        </span>

        <h1
          className="animate-fade-up bg-gradient-to-r from-white via-accent-glow to-accent-violet bg-[length:200%_auto] bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-8xl"
          style={{ animationDelay: '0.08s' }}
        >
          AlgoViz
        </h1>

        <p
          className="mt-5 max-w-xl animate-fade-up text-base leading-relaxed text-content-muted md:text-lg"
          style={{ animationDelay: '0.16s' }}
        >
          An interactive 3D playground for sorting, searching, graph and tree algorithms.
          Step through every comparison, swap and visit — or let them play — rendered live with
          WebGL.
        </p>

        <div
          className="mt-9 flex animate-fade-up flex-col items-center gap-4 sm:flex-row"
          style={{ animationDelay: '0.24s' }}
        >
          <button
            onClick={scrollToStudio}
            className="rounded-xl bg-accent px-7 py-3 font-semibold text-surface-950 transition-transform duration-200 hover:scale-105"
            style={{ boxShadow: '0 0 40px -8px #22d3ee' }}
          >
            Launch the Studio
          </button>
          <a
            href="#families"
            className="rounded-xl border border-surface-700 px-7 py-3 font-medium text-content-secondary transition-colors hover:bg-surface-800"
          >
            Browse Families
          </a>
        </div>

        <div
          className="mt-12 flex animate-fade-up items-center gap-8 font-mono text-sm text-content-muted"
          style={{ animationDelay: '0.32s' }}
        >
          <Stat value={`${algorithmCount}`} label="algorithms" />
          <span className="h-8 w-px bg-surface-700" />
          <Stat value={`${familyCount}`} label="families" />
          <span className="h-8 w-px bg-surface-700" />
          <Stat value="3D" label="WebGL scenes" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="text-2xl font-semibold text-content-primary">{value}</span>
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </span>
  );
}
