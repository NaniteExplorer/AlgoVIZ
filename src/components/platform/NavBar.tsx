/**
 * Slim sticky top navigation. The brand mark mirrors the favicon (ascending
 * bars). Anchor links jump to the studio and the learn section; smooth scrolling
 * is handled globally via CSS.
 */
export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-800/70 bg-surface-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight text-content-primary">AlgoViz</span>
        </a>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="#explore">Explore</NavLink>
          <NavLink href="#families">Families</NavLink>
          <NavLink href="#learn">Learn</NavLink>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="ml-1 rounded-lg border border-surface-700 px-3.5 py-1.5 text-sm font-medium text-content-primary transition-colors hover:bg-surface-800"
          >
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-content-muted transition-colors hover:text-content-primary sm:inline-block"
    >
      {children}
    </a>
  );
}

function BrandMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="rgb(var(--c-surface-800))" />
      <rect x="13" y="36" width="8" height="15" rx="2" fill="#22d3ee" />
      <rect x="28" y="26" width="8" height="25" rx="2" fill="#67e8f9" />
      <rect x="43" y="14" width="8" height="37" rx="2" fill="#a78bfa" />
    </svg>
  );
}
