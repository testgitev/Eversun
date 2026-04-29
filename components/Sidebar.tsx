'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  XCircle,
  Circle,
  Lightning,
  Flag,
  CaretLeft,
  CaretRight,
  CaretDown,
  CheckSquare,
  MagnifyingGlass,
  X,
  List,
  House,
} from '@phosphor-icons/react';
import { Section } from '@/types/client';
import Input from '@/components/ui/Input';
import useDebounceCallback from '@/hooks/useDebounceCallback';

interface SidebarProps {
  /** Section actuellement active */
  activeSection: Section;
  /** Fonction pour changer la section active */
  setActiveSection: (section: Section) => void;
  /** Comptes de clients par section */
  sectionCounts?: Record<string, number>;
  /** Callback appelé quand la sidebar est réduite/étendue */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** État mobile de la sidebar */
  isMobileOpen?: boolean;
  /** Callback pour fermer la sidebar mobile */
  onMobileClose?: () => void;
  /** Callback pour naviguer vers l'accueil */
  onNavigateHome?: () => void;
}

const sectionGroups = [
  {
    title: 'Déclarations Préalables',
    sections: [
      {
        id: 'dp-en-cours' as const,
        label: 'DP En cours',
        icon: FileText,
      },
      {
        id: 'dp-accordes' as const,
        label: 'DP Accordés',
        icon: CheckCircle,
      },
      {
        id: 'dp-refuses' as const,
        label: 'DP Refus',
        icon: XCircle,
      },
      {
        id: 'daact' as const,
        label: 'DAACT',
        icon: CheckSquare,
      },
    ],
  },
  {
    title: 'Installation',
    sections: [
      {
        id: 'installation' as const,
        label: 'Installation en cours',
        icon: House,
      },
    ],
  },
  {
    title: 'Certifications Consuel',
    sections: [
      {
        id: 'consuel-en-cours' as const,
        label: 'Consuel En cours',
        icon: Circle,
      },
      {
        id: 'consuel-finalise' as const,
        label: 'Consuel Finalisé',
        icon: CheckCircle,
      },
    ],
  },
  {
    title: 'Raccordement',
    sections: [
      {
        id: 'raccordement' as const,
        label: 'Raccordement',
        icon: Lightning,
      },
      {
        id: 'raccordement-mes' as const,
        label: 'Raccordement MES',
        icon: Flag,
      },
    ],
  },
];

function Sidebar({
  activeSection,
  setActiveSection,
  sectionCounts,
  onCollapsedChange,
  isMobileOpen = false,
  onMobileClose,
  onNavigateHome,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(sectionGroups.map((group) => group.title))
  );

  // Debounce le handler de resize
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const debouncedCheckMobile = useDebounceCallback(checkMobile, 250);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', debouncedCheckMobile);
    return () => window.removeEventListener('resize', debouncedCheckMobile);
  }, [debouncedCheckMobile, checkMobile]);

  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupTitle)) {
        next.delete(groupTitle);
      } else {
        next.add(groupTitle);
      }
      return next;
    });
  };

  // Load saved state
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed !== null) setIsCollapsed(savedCollapsed === 'true');
  }, []);

  // Save state
  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  // Filter sections based on search query
  const filteredSectionGroups = sectionGroups
    .map((group) => ({
      ...group,
      sections: group.sections.filter((section) =>
        section.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.sections.length > 0);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 h-[calc(100vh-4rem)] z-40 flex flex-col shadow-lg shadow-slate-200/30 dark:shadow-black/30 transition-all duration-200 ease-out flex-shrink-0 ${
          isMobile
            ? isMobileOpen
              ? 'translate-x-0 w-52 fixed left-0 top-16'
              : '-translate-x-full w-52 fixed left-0 top-16'
            : 'fixed left-0 top-16 ' + (isCollapsed ? 'w-14' : 'w-56')
        }`}
        role="navigation"
        aria-label="Navigation principale"
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="absolute right-4 top-4 z-50 p-2 bg-primary rounded-lg shadow border border-primary hover:scale-[1.01] transition-transform duration-200 md:hidden"
            aria-label="Fermer la sidebar"
          >
            <X className="h-5 w-5 text-secondary" weight="bold" />
          </button>
        )}

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-2.5 py-2">
            <div className="relative">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 py-1 pl-7 pr-7 text-xs shadow-none hover:shadow-none"
                aria-label="Rechercher une section"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-3 w-3" weight="bold" />
                </button>
              )}
            </div>
          </div>
        )}

        <nav className="py-2 flex-1 overflow-y-auto">
          {/* Accueil Button */}
          <div className="px-1.5 mb-4">
            <button
              onClick={onNavigateHome}
              className={`w-full text-left rounded-lg text-xs font-medium transition-all duration-200 ease-out flex items-center group relative overflow-hidden
              ${
                isCollapsed
                  ? 'justify-center px-1.5 py-2.5'
                  : 'px-3 py-2.5 gap-2.5'
              }
              text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900`}
              aria-label="Accueil"
            >
              <House
                weight="regular"
                className="h-4.5 w-4.5 flex-shrink-0 transition-all duration-200 text-slate-400 dark:text-slate-500 group-hover:text-primary-500 dark:group-hover:text-primary-400"
                aria-hidden="true"
              />
              {!isCollapsed && (
                <span className="flex-1 relative z-10">Accueil</span>
              )}
            </button>
          </div>

          {filteredSectionGroups.map((group, groupIndex) => {
            const isGroupOpen =
              isCollapsed ||
              openGroups.has(group.title) ||
              searchQuery.trim() !== '';
            return (
              <div key={group.title} className="mb-4">
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>{group.title}</span>
                    <CaretDown
                      weight="bold"
                      className={`h-3 w-3 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
                {isGroupOpen && (
                  <ul className="space-y-1 px-1.5 mt-1.5" role="list">
                    {group.sections.map((section, sectionIndex) => {
                      const globalIndex =
                        sectionGroups
                          .slice(0, groupIndex)
                          .reduce((acc, g) => acc + g.sections.length, 0) +
                        sectionIndex +
                        1;
                      return (
                        <li key={section.id} role="listitem">
                          <button
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full text-left rounded-lg text-xs font-medium transition-all duration-200 ease-out flex items-center group relative overflow-hidden
                            ${
                              isCollapsed
                                ? 'justify-center px-1.5 py-2.5'
                                : 'px-3 py-2.5 gap-2.5'
                            }
                            ${
                              activeSection === section.id
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/25'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900'
                            }`}
                            tabIndex={0}
                            aria-current={
                              activeSection === section.id ? 'page' : undefined
                            }
                            title={
                              isCollapsed
                                ? `${section.label} (Alt+${globalIndex})`
                                : undefined
                            }
                          >
                            {section.icon && (
                              <section.icon
                                weight="regular"
                                className={`h-4.5 w-4.5 flex-shrink-0 transition-all duration-200 ${
                                  activeSection === section.id
                                    ? 'text-white'
                                    : 'text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400'
                                }`}
                                aria-hidden="true"
                              />
                            )}
                            {!isCollapsed && (
                              <>
                                <span className="flex-1 relative z-10">
                                  {section.label}
                                </span>
                                {sectionCounts &&
                                  sectionCounts[section.id] !== undefined && (
                                    <span
                                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-all duration-200 relative z-10 ${
                                        activeSection === section.id
                                          ? 'bg-white/20 text-white'
                                          : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800/50'
                                      }`}
                                    >
                                      {sectionCounts[section.id]}
                                    </span>
                                  )}
                              </>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse Toggle - Desktop only */}
        {!isMobile && (
          <div className="px-2 py-2 border-t border-primary">
            <button
              onClick={handleCollapse}
              className="w-full flex items-center justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-150"
              aria-label={
                isCollapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'
              }
            >
              {isCollapsed ? (
                <CaretRight className="h-3 w-3 text-secondary" />
              ) : (
                <>
                  <CaretLeft className="h-3 w-3 text-secondary" />
                  <span className="text-xs font-medium text-secondary">
                    Réduire
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
