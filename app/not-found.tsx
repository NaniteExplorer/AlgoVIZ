import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-content-primary">
        No algorithm here
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-content-muted">
        That URL doesn&apos;t match anything in the catalog. Try the full list, or press{' '}
        <kbd className="rounded border border-line-strong bg-surface-800 px-1 font-mono text-[11px]">
          ⌘K
        </kbd>{' '}
        anywhere in the app to search by name.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <ButtonLink href="/algorithms" variant="primary" size="sm">
          Browse the catalog
        </ButtonLink>
        <Link
          href="/"
          className="inline-flex h-8 items-center px-3 text-xs text-content-muted hover:text-content-primary"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
