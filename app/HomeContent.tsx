'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  FileText,
  Wrench,
  CheckCircle,
  Plug,
} from '@phosphor-icons/react';

interface SectionCard {
  title: string;
  description: string;
  icon: React.ElementType;
  targetSection: string;
  color: string;
}

interface SectionCounts {
  [key: string]: number;
}

const sections: SectionCard[] = [
  {
    title: 'Déclarations Préalables',
    description: 'Gérez vos déclarations préalables (DP) en cours, accordées et refusées',
    icon: FileText,
    targetSection: 'dp-en-cours',
    color: 'bg-primary-500',
  },
  {
    title: 'Installation',
    description: 'Suivez l\'avancement des installations solaires et PV de chantier',
    icon: Wrench,
    targetSection: 'installation',
    color: 'bg-accent-500',
  },
  {
    title: 'Consuel',
    description: 'Certifications Consuel en cours et finalisées',
    icon: CheckCircle,
    targetSection: 'consuel-en-cours',
    color: 'bg-success-500',
  },
  {
    title: 'Raccordement',
    description: 'Demandes de raccordement et raccordements MES',
    icon: Plug,
    targetSection: 'raccordement',
    color: 'bg-sky-500',
  },
];

export function HomeContent() {
  const router = useRouter();
  const [counts, setCounts] = useState<SectionCounts>({});

  useEffect(() => {
    fetch('/api/clients/counts')
      .then(res => res.json())
      .then(data => setCounts(data.counts || {}))
      .catch(() => setCounts({}));
  }, []);

  const handleCardClick = (targetSection: string) => {
    router.push(`/dashboard?section=${targetSection}`);
  };

  // Calculate total counts for each category
  const dpTotal = (counts['dp-en-cours'] || 0) + (counts['dp-accordes'] || 0) + (counts['dp-refuses'] || 0);
  const installationTotal = counts['installation'] || 0;
  const consuelTotal = (counts['consuel-en-cours'] || 0) + (counts['consuel-finalise'] || 0);
  const raccordementTotal = (counts['raccordement'] || 0) + (counts['raccordement-mes'] || 0);

  return (
    <>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <button
              key={section.title}
              onClick={() => handleCardClick(section.targetSection)}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${section.color} rounded-lg flex-shrink-0`}>
                  <Icon className="h-6 w-6 text-white" weight="bold" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'DP', value: dpTotal.toString(), color: 'bg-primary-500' },
          { label: 'Installations', value: installationTotal.toString(), color: 'bg-accent-500' },
          { label: 'Consuel', value: consuelTotal.toString(), color: 'bg-success-500' },
          { label: 'Raccordements', value: raccordementTotal.toString(), color: 'bg-sky-500' },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className={`h-1 w-8 ${stat.color} rounded mb-2`} />
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {stat.value}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

// Skeleton Loader pendant le chargement
export function HomeContentSkeleton() {
  return (
    <>
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Skeleton */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 animate-pulse"
          >
            <div className="h-1 w-8 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    </>
  );
}
