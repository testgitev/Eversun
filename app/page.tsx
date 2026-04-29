import { Suspense } from 'react';
import Link from 'next/link';
import { HomeContent, HomeContentSkeleton } from './HomeContent';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header - Rendu immédiatement côté serveur */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Eversun
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Dashboard de suivi des installations solaires
                </p>
              </div>
            </div>
            <Link
              href="/dashboard?section=clients"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Voir tous les clients
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content avec Suspense pour streaming */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section - Rendu immédiatement */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Bienvenue sur le Dashboard Eversun
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Sélectionnez une section ci-dessous pour accéder à la gestion de vos dossiers
            d&apos;installations solaires
          </p>
        </div>

        {/* Cards et Stats avec Suspense */}
        <Suspense fallback={<HomeContentSkeleton />}>
          <HomeContent />
        </Suspense>

        {/* Footer - Rendu immédiatement */}
        <footer className="mt-16 text-center text-slate-500 dark:text-slate-500 text-sm">
          <p>© 2026 Eversun - Dashboard de suivi des installations solaires</p>
        </footer>
      </main>
    </div>
  );
}
