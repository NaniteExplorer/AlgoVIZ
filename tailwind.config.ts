import type { Config } from 'tailwindcss';

/**
 * AlgoViz design tokens.
 *
 * Every colour resolves to a CSS variable declared in `app/globals.css`, so a
 * single `.dark` class on `<html>` re-themes the entire chrome. The channel
 * form (`R G B`) plus `<alpha-value>` is what keeps opacity modifiers such as
 * `bg-surface-800/60` working against variables.
 *
 * The same tokens are mirrored for the renderers in `src/theme.ts` (WebGL) and
 * `src/core/visualization/draw/theme2d.ts` (Canvas), so the 2D chrome, the 3D
 * scenes and the 2D diagrams never drift apart.
 */
const channel = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: channel('--c-surface-950'),
          900: channel('--c-surface-900'),
          800: channel('--c-surface-800'),
          700: channel('--c-surface-700'),
          600: channel('--c-surface-600'),
        },
        content: {
          DEFAULT: channel('--c-content-primary'),
          primary: channel('--c-content-primary'),
          secondary: channel('--c-content-secondary'),
          muted: channel('--c-content-muted'),
          inverse: channel('--c-content-inverse'),
        },
        line: {
          DEFAULT: channel('--c-line'),
          strong: channel('--c-line-strong'),
        },
        accent: {
          DEFAULT: channel('--c-accent'),
          glow: channel('--c-accent-glow'),
          violet: channel('--c-accent-violet'),
          rose: channel('--c-accent-rose'),
          amber: channel('--c-accent-amber'),
          emerald: channel('--c-accent-emerald'),
          contrast: channel('--c-accent-contrast'),
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'sheet-in': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        shimmer: 'shimmer 6s linear infinite',
        'fade-in': 'fade-in 0.15s ease-out',
        'sheet-in': 'sheet-in 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
