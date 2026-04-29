'use client';

import { useState, useEffect } from 'react';
import { ClientRecord } from '@/types/client';
import {
  User,
  CheckCircle,
  Clock,
  XCircle,
  Buildings,
  Lightning,
  FileText,
  House,
  Flag,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface ClientStage {
  section: string;
  statut: string;
  date?: string;
  noDp?: string;
  financement?: string;
  typeConsuel?: string;
  raccordement?: string;
}

interface AggregatedClient {
  name: string;
  stages: Record<string, ClientStage>;
  ville?: string;
  financement?: string;
}

export default function ClientAggregationView() {
  const [clients, setClients] = useState<AggregatedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSectionCounts } = useAppStore();

  const fetchSectionCounts = async () => {
    try {
      const res = await fetch('/api/clients/counts');
      const response = await res.json();
      if (response.counts) {
        setSectionCounts(response.counts);
      }
    } catch (error) {
      console.error('Error fetching section counts:', error);
    }
  };

  useEffect(() => {
    fetchAllClients();
    fetchSectionCounts();
  }, []);

  const fetchAllClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients/sync');
      const response = await res.json();
      const data = response.data || response;

      if (Array.isArray(data)) {
        const aggregatedClients: AggregatedClient[] = data.map((item: any) => ({
          name: item.client,
          ville: item.ville,
          financement: item.financement,
          stages: item.stages || {},
        }));
        setClients(aggregatedClients);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (section: string) => {
    switch (section) {
      case 'dp-en-cours':
      case 'dp-accordes':
      case 'dp-refuses':
        return <FileText className="h-3.5 w-3.5" />;
      case 'daact':
        return <Buildings className="h-3.5 w-3.5" />;
      case 'consuel-en-cours':
      case 'consuel-finalise':
        return <Lightning className="h-3.5 w-3.5" />;
      case 'installation':
        return <House className="h-3.5 w-3.5" />;
      case 'raccordement':
        return <House className="h-3.5 w-3.5" />;
      case 'raccordement-mes':
        return <Flag className="h-3.5 w-3.5" />;
      default:
        return <User className="h-3.5 w-3.5" />;
    }
  };

  const getStageLabel = (section: string) => {
    switch (section) {
      case 'dp-en-cours':
        return 'DP';
      case 'dp-accordes':
        return 'DP Acc.';
      case 'dp-refuses':
        return 'DP Ref.';
      case 'daact':
        return 'DAACT';
      case 'consuel-en-cours':
        return 'Consuel';
      case 'consuel-finalise':
        return 'Consuel OK';
      case 'installation':
        return 'Install.';
      case 'raccordement':
        return 'Racc.';
      case 'raccordement-mes':
        return 'Racc. MES';
      default:
        return section;
    }
  };

  const getStatusColor = (statut: string) => {
    if (!statut) return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

    const lowerStatut = statut.toLowerCase();
    if (
      lowerStatut.includes('accord') ||
      lowerStatut.includes('favorable') ||
      lowerStatut.includes('visé') ||
      lowerStatut.includes('validé') ||
      lowerStatut.includes('ok') ||
      lowerStatut.includes('fait') ||
      lowerStatut.includes('finalisé')
    ) {
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700';
    }
    if (lowerStatut.includes('refus') || lowerStatut.includes('ko')) {
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-700';
    }
    if (
      lowerStatut.includes('en cours') ||
      lowerStatut.includes('attente') ||
      lowerStatut.includes('effectuer')
    ) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700';
    }
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
  };

  const getStatusIcon = (statut: string) => {
    if (!statut) return null;

    const lowerStatut = statut.toLowerCase();
    if (
      lowerStatut.includes('accord') ||
      lowerStatut.includes('favorable') ||
      lowerStatut.includes('visé') ||
      lowerStatut.includes('validé') ||
      lowerStatut.includes('ok') ||
      lowerStatut.includes('fait') ||
      lowerStatut.includes('finalisé')
    ) {
      return <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />;
    }
    if (lowerStatut.includes('refus') || lowerStatut.includes('ko')) {
      return <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />;
    }
    return <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.ville?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Vue Clients
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-80 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Professional Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-48">
                  Déclaration Préalable
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-48">
                  DAACT
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-48">
                  Consuel
                </th>
                <th className="text-left py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-48">
                  Raccordement
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, index) => (
                <tr
                  key={`${client.name}-${index}`}
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" weight="bold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white text-base truncate">
                          {client.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {client.ville && (
                            <>
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                {client.ville}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* DP Column */}
                  <td className="py-4 px-4">
                    {(() => {
                      const dpStage = client.stages['dp-en-cours'] ||
                                       client.stages['dp-accordes'] ||
                                       client.stages['dp-refuses'];
                      if (!dpStage) {
                        return (
                          <div className="h-20 flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <span className="text-xs font-medium">—</span>
                          </div>
                        );
                      }
                      return (
                        <div className={cn('h-20 p-3 rounded-lg border text-xs flex flex-col justify-between', getStatusColor(dpStage.statut))}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStageIcon(dpStage.section)}
                              <span className="font-bold text-xs">{getStageLabel(dpStage.section)}</span>
                            </div>
                            {getStatusIcon(dpStage.statut)}
                          </div>
                          <div className="font-medium truncate mt-1">
                            {dpStage.statut || '-'}
                          </div>
                          <div className="text-[10px] opacity-75 font-medium">
                            {formatDate(dpStage.date)}
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* DAACT Column */}
                  <td className="py-4 px-4">
                    {(() => {
                      const daactStage = client.stages['daact'];
                      if (!daactStage) {
                        return (
                          <div className="h-20 flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <span className="text-xs font-medium">—</span>
                          </div>
                        );
                      }
                      return (
                        <div className={cn('h-20 p-3 rounded-lg border text-xs flex flex-col justify-between', getStatusColor(daactStage.statut))}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStageIcon(daactStage.section)}
                              <span className="font-bold text-xs">DAACT</span>
                            </div>
                            {getStatusIcon(daactStage.statut)}
                          </div>
                          <div className="font-medium truncate mt-1">
                            {daactStage.statut || '-'}
                          </div>
                          <div className="text-[10px] opacity-75 font-medium">
                            {formatDate(daactStage.date)}
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Consuel Column */}
                  <td className="py-4 px-4">
                    {(() => {
                      const consuelStage = client.stages['consuel-en-cours'] ||
                                          client.stages['consuel-finalise'];
                      if (!consuelStage) {
                        return (
                          <div className="h-20 flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <span className="text-xs font-medium">—</span>
                          </div>
                        );
                      }
                      return (
                        <div className={cn('h-20 p-3 rounded-lg border text-xs flex flex-col justify-between', getStatusColor(consuelStage.statut))}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStageIcon(consuelStage.section)}
                              <span className="font-bold text-xs">{getStageLabel(consuelStage.section)}</span>
                            </div>
                            {getStatusIcon(consuelStage.statut)}
                          </div>
                          <div className="font-medium truncate mt-1">
                            {consuelStage.statut || '-'}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            {consuelStage.typeConsuel && (
                              <span className="text-[10px] opacity-75 font-medium">
                                {consuelStage.typeConsuel}
                              </span>
                            )}
                            <span className="text-[10px] opacity-75 font-medium ml-auto">
                              {formatDate(consuelStage.date)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Raccordement Column */}
                  <td className="py-4 px-4">
                    {(() => {
                      const raccStage = client.stages['raccordement'] ||
                                       client.stages['raccordement-mes'];
                      if (!raccStage) {
                        return (
                          <div className="h-20 flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <span className="text-xs font-medium">—</span>
                          </div>
                        );
                      }
                      return (
                        <div className={cn('h-20 p-3 rounded-lg border text-xs flex flex-col justify-between', getStatusColor(raccStage.statut))}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStageIcon(raccStage.section)}
                              <span className="font-bold text-xs">{getStageLabel(raccStage.section)}</span>
                            </div>
                            {getStatusIcon(raccStage.statut)}
                          </div>
                          <div className="font-medium truncate mt-1">
                            {raccStage.statut || '-'}
                          </div>
                          <div className="text-[10px] opacity-75 font-medium">
                            {formatDate(raccStage.date)}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="py-16 text-center">
            <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
              <User className="h-8 w-8 text-slate-400" weight="bold" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Aucun client trouvé
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Essayez de modifier votre recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
