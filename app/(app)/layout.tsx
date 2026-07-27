import { AppShell } from '@/components/shell/AppShell';

/**
 * Layout for the application half of the site.
 *
 * Split from the marketing route group so the landing page keeps its airy,
 * full-bleed hero treatment while every studio route gets the dense product
 * chrome — without either having to conditionally hide the other's navigation.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
