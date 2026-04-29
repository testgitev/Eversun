'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { List, CaretUp } from '@phosphor-icons/react';
import Sidebar from '@/components/Sidebar';
import PageTransition from '@/components/PageTransition';
import SectionTransition from '@/components/SectionTransition';
import { Section } from '@/types/client';
import { useAppStore } from '@/store/useAppStore';
import useDebounceCallback from '@/hooks/useDebounceCallback';

// Code splitting pour les composants lourds
const ClientSection = dynamic(() => import('@/components/ClientSection'), {
  loading: () => <div className="p-8 text-center">Chargement...</div>,
  ssr: false,
});

const DashboardOverview = dynamic(
  () => import('@/components/DashboardOverview'),
  {
    loading: () => <div className="p-8 text-center">Chargement...</div>,
    ssr: false,
  }
);

const ClientAggregationView = dynamic(
  () => import('@/components/ClientAggregationView'),
  {
    loading: () => <div className="p-8 text-center">Chargement...</div>,
    ssr: false,
  }
);

interface DashboardProps {
  /** Section initiale (optionnel, défaut: 'dp-en-cours') */
  initialSection?: Section;
}

export default function Dashboard({
  initialSection = 'dp-en-cours',
}: DashboardProps) {
  const { activeSection, setActiveSection, sectionCounts } = useAppStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isSectionLoading, setIsSectionLoading] = useState(false);

  const handleScroll = useCallback(() => {
    setShowBackToTop(window.scrollY > 300);
  }, []);

  const debouncedHandleScroll = useDebounceCallback(handleScroll, 100);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection, setActiveSection]);

  useEffect(() => {
    window.addEventListener('scroll', debouncedHandleScroll);
    return () => window.removeEventListener('scroll', debouncedHandleScroll);
  }, [debouncedHandleScroll]);

  useEffect(() => {
    const handleSectionLoading = (event: Event) => {
      const customEvent = event as CustomEvent<{
        section: string;
        loading: boolean;
      }>;
      const { section, loading } = customEvent.detail;
      if (section === activeSection) {
        setIsSectionLoading(loading);
      }
    };

    window.addEventListener('sectionLoading', handleSectionLoading);
    return () =>
      window.removeEventListener('sectionLoading', handleSectionLoading);
  }, [activeSection]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sectionCounts={sectionCounts}
        onCollapsedChange={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        onNavigateHome={() => window.location.href = '/'}
      />
      <main
        className={`flex-1 overflow-auto transition-all duration-200 relative ${
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-56'
        }`}
      >
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed top-20 left-4 z-30 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:scale-[1.01] transition-transform duration-200"
          aria-label="Ouvrir le menu"
        >
          <List
            className="h-6 w-6 text-gray-600 dark:text-gray-400"
            weight="bold"
          />
        </button>
        <PageTransition>
          <SectionTransition
            sectionKey={activeSection}
            isLoading={isSectionLoading}
          >
            {activeSection === 'clients' ? (
              <ClientAggregationView />
            ) : (
              <ClientSection section={activeSection} />
            )}
          </SectionTransition>
        </PageTransition>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 bg-primary-500 text-white rounded-lg shadow-md hover:shadow hover:scale-[1.01] transition-all duration-200"
            aria-label="Retour en haut"
          >
            <CaretUp className="h-6 w-6" weight="bold" />
          </button>
        )}
      </main>
    </div>
  );
}
