'use client';

import { useSearchParams } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { Section } from '@/types/client';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') as Section | null;

  return <Dashboard initialSection={sectionParam || 'dp-en-cours'} />;
}
