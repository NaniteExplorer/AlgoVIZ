'use client';

import { useSelectedLayoutSegments } from 'next/navigation';
import { getEntry, type CatalogEntry } from '@/catalog';

/**
 * The algorithm the current route is showing, if any.
 *
 * Reads the route segments rather than taking props, so the sidebar, top bar
 * and command palette can all highlight the active entry without any of them
 * being prop-drilled from the page — which matters because they live in the
 * layout, above the page in the tree.
 */
export function useActiveEntry(): CatalogEntry | undefined {
  const segments = useSelectedLayoutSegments();
  // Layout is at app/(app), so segments look like ['algorithms', category, slug].
  if (segments[0] !== 'algorithms' || segments.length < 3) return undefined;
  return getEntry(segments[1], segments[2]);
}

/** The category segment of the current route, if the route has one. */
export function useActiveCategory(): string | undefined {
  const segments = useSelectedLayoutSegments();
  return segments[0] === 'algorithms' ? segments[1] : undefined;
}
