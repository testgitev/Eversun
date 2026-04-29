'use client';

import { useState, useMemo } from 'react';
import React from 'react';
import { ClientRecord, Section } from '@/types/client';
import {
  FileText,
  Calendar,
  MapPin,
  Pencil,
  Trash,
  ArrowsLeftRight,
  CaretDown,
  CaretUp,
  List,
  SquaresFour,
  SortAscending,
  SortDescending,
  CheckCircle,
} from '@phosphor-icons/react';

interface ClientGridProps {
  section: Section;
  items: ClientRecord[];
  onEdit: (client: ClientRecord) => void;
  onDelete: (id: string) => void;
  onMove?: (client: ClientRecord, newSection: Section) => void;
}

type SortField =
  | 'client'
  | 'statut'
  | 'dateEnvoi'
  | 'dateEstimative'
  | 'ville'
  | 'typeConsuel';
type SortDirection = 'asc' | 'desc';
type CardView = 'compact' | 'detailed';
type GroupBy = 'none' | 'statut' | 'ville' | 'typeConsuel';

export default function ClientGrid({
  section,
  items,
  onEdit,
  onDelete,
  onMove,
}: ClientGridProps) {
  const [sortField, setSortField] = useState<SortField>('client');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [cardView, setCardView] = useState<CardView>('detailed');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'client':
          comparison = (a.client || '').localeCompare(b.client || '');
          break;
        case 'statut':
          let aStatus = '';
          let bStatus = '';

          if (section === 'daact') {
            aStatus = a.statut || '';
            bStatus = b.statut || '';
          } else if (section.startsWith('consuel')) {
            aStatus = a.statut || '';
            bStatus = b.statut || '';
          } else if (section === 'raccordement' || section === 'raccordement-mes') {
            aStatus = a.statut || a.raccordement || '';
            bStatus = b.statut || b.raccordement || '';
          } else {
            aStatus = a.statut || '';
            bStatus = b.statut || '';
          }

          comparison = aStatus.localeCompare(bStatus);
          break;
        case 'dateEnvoi':
          comparison =
            new Date(a.dateEnvoi || 0).getTime() -
            new Date(b.dateEnvoi || 0).getTime();
          break;
        case 'dateEstimative':
          comparison =
            new Date(a.dateEstimative || 0).getTime() -
            new Date(b.dateEstimative || 0).getTime();
          break;
        case 'ville':
          comparison = (a.ville || '').localeCompare(b.ville || '');
          break;
        case 'typeConsuel':
          comparison = (a.typeConsuel || '').localeCompare(b.typeConsuel || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [items, sortField, sortDirection, section]);

  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return { '': sortedItems };
    }

    const groups: Record<string, ClientRecord[]> = {};

    sortedItems.forEach((item) => {
      let key = 'Non défini';

      switch (groupBy) {
        case 'statut':
          key = item.statut || 'Non défini';
          break;
        case 'ville':
          key = item.ville || 'Non défini';
          break;
        case 'typeConsuel':
          key = item.typeConsuel || 'Non défini';
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }, [sortedItems, groupBy, section]);

  const getUrgencyIndicator = (client: ClientRecord) => {
    if (!client.dateEstimative) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const estimatedDate = new Date(client.dateEstimative);
    estimatedDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (estimatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return {
        color: 'from-red-500 to-rose-600',
        label: 'En retard',
        urgent: true,
      };
    } else if (diffDays === 0) {
      return {
        color: 'from-red-500 to-orange-500',
        label: "Aujourd'hui",
        urgent: true,
      };
    } else if (diffDays <= 3) {
      return {
        color: 'from-orange-500 to-amber-500',
        label: 'Urgent',
        urgent: true,
      };
    } else if (diffDays <= 7) {
      return {
        color: 'from-yellow-500 to-amber-500',
        label: 'Proche',
        urgent: false,
      };
    }
    return {
      color: 'from-emerald-500 to-green-500',
      label: 'À venir',
      urgent: false,
    };
  };

  const renderCard = (client: ClientRecord, index: number) => {
    const urgency = section.startsWith('dp')
      ? getUrgencyIndicator(client)
      : null;

    return (
      <div
        key={client.id}
        className={`bg-primary border border-primary rounded-lg hover:border-amber-500 transition-all duration-200 cursor-pointer hover:shadow hover:scale-[1.01] group relative ${
          cardView === 'compact' ? 'p-4' : 'p-6'
        }`}
        onClick={() => onEdit(client)}
        style={{
          animation: `slideIn 0.5s ease-out ${index * 30}ms`,
        }}
      >
        {urgency?.urgent && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md animate-pulse z-10">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}

        <div className="flex items-start justify-between mb-3">
          <h3
            className={`font-bold text-primary truncate ${cardView === 'compact' ? 'text-sm' : 'text-lg'}`}
          >
            {client.client}
          </h3>
          {(() => {
            let statusValue = '';
            let statusLabel = '';

            if (section === 'daact') {
              statusValue = client.statut || '';
              statusLabel = 'DAACT';
            } else if (section.startsWith('consuel')) {
              statusValue = client.statut || '';
              statusLabel = 'Statut';
            } else if (section === 'raccordement' || section === 'raccordement-mes') {
              statusValue = client.statut || client.raccordement || '';
              statusLabel = 'Statut';
            } else {
              statusValue = client.statut || '';
              statusLabel = 'Statut';
            }

            return statusValue ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-700 shadow-sm">
                {statusValue}
              </span>
            ) : null;
          })()}
        </div>

        {cardView === 'detailed' && (
          <>
            <div className="space-y-3 text-sm">
              {section === 'daact' ? (
                <>
                  {client.noDp && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                        <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-secondary truncate">
                        {client.noDp}
                      </span>
                    </div>
                  )}
                </>
              ) : section.startsWith('dp') ? (
                <>
                  {client.dateEstimative && urgency && (
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-r ${urgency.color}`}
                      >
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-secondary block">
                          {new Date(client.dateEstimative).toLocaleDateString(
                            'fr-FR'
                          )}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${urgency.color} text-white shadow-sm`}
                        >
                          {urgency.label}
                        </span>
                      </div>
                    </div>
                  )}
                  {client.noDp && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                        <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-secondary truncate">
                        {client.noDp}
                      </span>
                    </div>
                  )}
                  {client.ville && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                        <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-secondary truncate">
                        {client.ville}
                      </span>
                    </div>
                  )}
                </>
              ) : section.startsWith('consuel') ? (
                <>
                  {client.typeConsuel && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600">
                        <FileText
                          className="h-4 w-4 text-white"
                          weight="bold"
                        />
                      </div>
                      <div>
                        <span className="text-secondary block text-xs uppercase tracking-wide">
                          Type Consuel
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 text-blue-100 dark:text-blue-200 shadow-sm">
                          {client.typeConsuel}
                        </span>
                      </div>
                    </div>
                  )}
                  {client.statut && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 dark:from-purple-600 dark:to-violet-600">
                        <CheckCircle
                          className="h-4 w-4 text-white"
                          weight="bold"
                        />
                      </div>
                      <div>
                        <span className="text-secondary block text-xs uppercase tracking-wide">
                          Statut
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-violet-500 dark:from-purple-600 dark:to-violet-600 text-purple-100 dark:text-purple-200 shadow-sm">
                          {client.statut}
                        </span>
                      </div>
                    </div>
                  )}
                  {client.dateEnvoi && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                        <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-secondary">
                        {new Date(client.dateEnvoi).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {client.ville && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                        <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-secondary truncate">
                        {client.ville}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {client.dateEnvoi && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                        <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-secondary">
                        {new Date(client.dateEnvoi).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {client.ville && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                        <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="text-secondary truncate">
                        {client.ville}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-primary flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(client);
                }}
                className="flex-1 px-3 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg text-sm font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(String(client._id || client.id || ''));
                }}
                className="px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {cardView === 'compact' && (
          <div className="flex items-center gap-2">
            {client.ville && (
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                {client.ville}
              </span>
            )}
            {urgency && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${urgency.color} text-white shadow-sm`}
              >
                {urgency.label}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
              <SquaresFour className="h-6 w-6" weight="bold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Vue Grille
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {items.length} dossiers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setCardView(cardView === 'compact' ? 'detailed' : 'compact')
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Changer la vue"
            >
              {cardView === 'compact' ? (
                <List className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <SquaresFour className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
              <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                {cardView === 'compact' ? 'Détaillée' : 'Compacte'}
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Trier par:
            </label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            >
              <option value="client">Client</option>
              <option value="statut">Statut</option>
              <option value="dateEnvoi">Date d'envoi</option>
              <option value="dateEstimative">Date estimative</option>
              <option value="ville">Ville</option>
              <option value="typeConsuel">Type Consuel</option>
            </select>
          </div>
          <button
            onClick={() =>
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {sortDirection === 'asc' ? (
              <SortAscending className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <SortDescending className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Grouper par:
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            >
              <option value="none">Aucun</option>
              <option value="statut">Statut</option>
              <option value="ville">Ville</option>
              <option value="typeConsuel">Type Consuel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        className={`grid gap-4 ${cardView === 'compact' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}
      >
        {Object.entries(groupedItems).map(([groupKey, groupItems]) => {
          if (groupBy === 'none') {
            return groupItems.map((client, index) => (
              <React.Fragment key={client._id || client.id || index}>
                {renderCard(client, index)}
              </React.Fragment>
            ));
          }

          const isExpanded = expandedGroups.has(groupKey);
          return (
            <div key={groupKey} className="contents">
              <div className="col-span-full mb-4">
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{groupKey}</span>
                    <span className="px-2 py-1 bg-white/20 rounded-full text-sm font-semibold">
                      {groupItems.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <CaretUp className="h-5 w-5" weight="bold" />
                  ) : (
                    <CaretDown className="h-5 w-5" weight="bold" />
                  )}
                </button>
              </div>
              {isExpanded &&
                groupItems.map((client, index) => (
                  <React.Fragment key={client._id || client.id || index}>
                    {renderCard(client, index)}
                  </React.Fragment>
                ))}
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Aucun dossier à afficher
          </p>
        </div>
      )}
    </div>
  );
}
