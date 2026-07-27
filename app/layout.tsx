import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeScript } from '@/components/theme/ThemeScript';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  // `metadataBase` is what lets every page emit absolute OG/canonical URLs
  // from the relative paths they declare.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AlgoViz — Learn Algorithms in 3D',
    // Every child route supplies only its own name.
    template: '%s | AlgoViz',
  },
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en',
  },
  description:
    'An interactive, WebGL-powered platform for learning sorting, searching, graph and tree algorithms as living 3D geometry. Step through every operation. Built with Next.js and Three.js.',
  keywords: [
    'algorithms',
    'visualization',
    'three.js',
    'sorting',
    'searching',
    'graphs',
    'trees',
    'data structures',
    'webgl',
    'next.js',
    'learn to code',
  ],
};

export const viewport: Viewport = {
  // Per-scheme values so the browser chrome matches the page in both themes.
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#05060a' },
    { media: '(prefers-color-scheme: light)', color: '#fafafc' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Pinch-zoom stays enabled deliberately: disabling it is an accessibility
  // regression, and the stage handles its own gestures instead.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` belongs on <html>: ThemeScript mutates its
    // class list before React hydrates, which React would otherwise flag.
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-contrast"
        >
          Skip to content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
