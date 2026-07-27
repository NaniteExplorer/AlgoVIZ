import { NavBar } from '@/components/platform/NavBar';

/** Marketing chrome: a transparent nav over the hero, and the site footer. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main id="main" className="relative">
        {children}
        <footer className="border-t border-line px-6 py-10 text-center text-sm text-content-muted">
          <p>
            AlgoViz — built with <span className="text-content-secondary">Next.js</span> &{' '}
            <span className="text-content-secondary">Three.js</span>. An extensible, OOP algorithm
            visualization platform for the learner community.
          </p>
        </footer>
      </main>
    </>
  );
}
