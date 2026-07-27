import { notFound, redirect } from 'next/navigation';
import { ACTIVE_CATEGORIES, algorithmHref, firstOf } from '@/catalog';
import type { AlgorithmCategory } from '@/core/algorithms';

export const dynamicParams = false;

export function generateStaticParams() {
  return ACTIVE_CATEGORIES.map((info) => ({ category: info.category }));
}

/**
 * A family URL has no visualization of its own, so it forwards to the family's
 * first algorithm. Redirecting rather than rendering a second index page keeps
 * `/algorithms/sorting` a usable shorthand without creating a page that has to
 * be designed, indexed and kept in sync with the catalog grid.
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const landing = firstOf(category as AlgorithmCategory);
  if (!landing) notFound();
  redirect(algorithmHref(landing));
}
