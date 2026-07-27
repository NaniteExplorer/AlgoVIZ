import { Hero } from '@/components/hero/Hero';
import { Features } from '@/components/marketing/Features';
import { FamilyGrid } from '@/components/marketing/FamilyGrid';

export default function Home() {
  return (
    <>
      <Hero />
      <FamilyGrid />
      <Features />
    </>
  );
}
