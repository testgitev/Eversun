'use client';

import { useState, useMemo } from 'react';
import Badge from '@/components/ui/Badge';
import {
  MagnifyingGlass,
  Pencil,
  ArrowSquareOut,
  X,
  Eye,
  EyeSlash,
  Calendar,
  Buildings,
  FileText,
  User,
  MapPin,
  Shield,
  Globe,
  Key,
  Check,
  WarningCircle,
  Lightning,
  CheckCircle,
  ChatCircle,
  Pen,
  Flag,
  Clock,
  House,
  Funnel,
  CaretDown,
} from '@phosphor-icons/react';
import { ClientRecord } from '@/types/client';
import {
  formatDateFR,
  getStatutBadgeColor,
  getFinancementBadgeColor,
  getRaccordementBadgeColor,
  getEtatActuelBadgeColor,
  getTypeConsuelBadgeColor,
  getPrestataireBadgeColor,
  getCauseNonPresenceBadgeColor,
} from '@/lib/clientTableUtils';
import ClientModal from '@/components/ClientModal';
import PaginationControls from '@/components/PaginationControls';
import { useClientTableFilters, useClientTablePagination } from '@/hooks/useClientTable';
import DatePicker from '@/components/ui/DatePicker';
import FilterChips from '@/components/ui/FilterChips';

/**
 * Props pour le composant ClientTable
 */
interface ClientTableProps {
  /** Section actuelle (utilise string pour compatibilité avec le code existant) */
  section: string;
  /** Liste des clients à afficher */
  items: ClientRecord[];
  /** Callback pour l'édition d'un client */
  onEdit: (client: ClientRecord) => void;
  /** Callback pour la suppression d'un client */
  onDelete: (id: string) => void;
  /** Callback optionnel pour la sauvegarde directe depuis le tableau */
  onSave?: (client: ClientRecord) => void;
  /** Callback optionnel pour rafraîchir les données */
  onRefresh?: () => void;
}

export default function ClientTable({
  section,
  items,
  onEdit,
  onDelete,
  onSave,
  onRefresh,
}: ClientTableProps) {
  // Custom hooks for filters and pagination
  const {
    search,
    setSearch,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    showFilters,
    setShowFilters,
    filterStatus,
    setFilterStatus,
    filterVille,
    setFilterVille,
    filterPrestataire,
    setFilterPrestataire,
    filterFinancement,
    setFilterFinancement,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    filteredItems,
    resetFilters,
  } = useClientTableFilters({ items, section });

  const {
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    isPageTransitioning,
    setIsPageTransitioning,
    transitionDirection,
    setTransitionDirection,
    totalPages,
    handlePageChange,
  } = useClientTablePagination({ totalItems: filteredItems.length });

  // Client sélectionné pour la vue détaillée
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(
    null
  );
  // États pour la modal
  const [showPassword, setShowPassword] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const columns: Array<{ key: keyof ClientRecord; label: string }> = [];
  const isDp = section.startsWith('dp');
  const isDpAccordes = section === 'dp-accordes';
  const isDpRefuses = section === 'dp-refuses';
  const isDaact = section === 'daact';
  const isConsuelEnCours = section === 'consuel-en-cours';
  const isConsuelFinalise = section === 'consuel-finalise';
  const isConsuel = isConsuelEnCours || isConsuelFinalise;
  const isInstallation = section === 'installation';
  const isRaccordement = section === 'raccordement';
  const isRaccordementMes = section === 'raccordement-mes';

  if (isDp) {
    columns.push(
      { key: 'client', label: 'Client' },
      { key: 'dateEnvoi', label: "Date d'envoi" },
      { key: 'dateEstimative', label: 'Date estimative' },
      { key: 'financement', label: 'Financement' },
      { key: 'statut', label: 'Statut' },
      { key: 'noDp', label: 'N° DP' },
      { key: 'ville', label: 'Ville' }
    );
    // Ajouter Portail, Identifiant, Mot de passe seulement si ce n'est pas DP Accordés ou DP Refus
    if (!isDpAccordes && !isDpRefuses) {
      columns.push(
        { key: 'portail', label: 'Portail' },
        { key: 'identifiant', label: 'Identifiant' },
        { key: 'motDePasse', label: 'Mot de passe' }
      );
    }
  } else if (isDaact) {
    columns.push(
      { key: 'client', label: 'Client' },
      { key: 'noDp', label: 'Numéro DP' },
      { key: 'ville', label: 'Ville' },
      { key: 'statut', label: 'DAACT' }
    );
  } else if (isInstallation) {
    columns.push(
      { key: 'client', label: 'Client' },
      { key: 'statut', label: 'Statut' },
      { key: 'financement', label: 'Financement' },
      { key: 'pvChantier', label: 'PV Chantier' },
      { key: 'commentaires', label: 'Commentaires' },
      { key: 'dateEstimative', label: 'Date de pose' },
      { key: 'datePV', label: 'Date PV' }
    );
  } else if (isConsuelEnCours) {
    columns.push(
      { key: 'client', label: 'Client' },
      { key: 'pvChantierDate', label: 'PV Chantier' },
      { key: 'causeNonPresence', label: 'Cause de non présence Consuel' },
      { key: 'prestataire', label: 'Prestataire' },
      { key: 'etatActuel', label: 'Etat Actuel' },
      { key: 'typeConsuel', label: 'Type de consuel demandé' },
      { key: 'dateDerniereDemarche', label: 'Date dernière démarche' },
      { key: 'commentaires', label: 'Commentaires' },
      { key: 'dateEstimative', label: 'Date Estimatives' }
    );
  } else if (isConsuelFinalise) {
    columns.push(
      { key: 'client', label: 'Nom' },
      { key: 'pvChantierDate', label: 'PV Chantier' },
      { key: 'causeNonPresence', label: 'Cause de non présence Consuel' },
      { key: 'prestataire', label: 'Prestataire' },
      { key: 'etatActuel', label: 'Etat Actuel' },
      { key: 'typeConsuel', label: 'Type de consuel demandé' },
      { key: 'dateDerniereDemarche', label: 'Date dernière démarche' },
      { key: 'commentaires', label: 'Commentaires' },
      { key: 'dateEstimative', label: 'Date Estimatives' }
    );
  } else if (isRaccordement) {
    columns.push(
      { key: 'client', label: 'Client' },
      { key: 'prestataire', label: 'Prestataire' },
      { key: 'typeConsuel', label: 'Type de consuel demandé' },
      { key: 'raccordement', label: 'Raccordement' },
      { key: 'dateDerniereDemarche', label: 'Date dernière démarche' },
      { key: 'commentaires', label: 'Commentaires' },
      { key: 'dateEstimative', label: 'Date Estimatives' }
    );
  } else if (isRaccordementMes) {
    columns.push(
      { key: 'client', label: 'Client' },
      { key: 'prestataire', label: 'Prestataire' },
      { key: 'typeConsuel', label: 'Type de consuel demandé' },
      { key: 'raccordement', label: 'Raccordement' },
      { key: 'dateDerniereDemarche', label: 'Date dernière démarche' },
      { key: 'numeroContrat', label: 'Numéro de contrat' },
      { key: 'dateMiseEnService', label: 'Date de Mise en service raccordement' }
    );
  }

  const paginated = filteredItems.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleClientClick = (client: ClientRecord) => {
    setSelectedClient(client);
  };

  const closeClientDetails = () => {
    setSelectedClient(null);
    setShowPassword(false);
  };

  // Build active filters list for FilterChips
  const activeFilters = [
    ...(filterStatus ? [{ key: 'status', label: 'Statut', value: filterStatus }] : []),
    ...(filterVille ? [{ key: 'ville', label: 'Ville', value: filterVille }] : []),
    ...(filterPrestataire ? [{ key: 'prestataire', label: 'Prestataire', value: filterPrestataire }] : []),
    ...(filterFinancement ? [{ key: 'financement', label: 'Financement', value: filterFinancement }] : []),
    ...(filterDateFrom ? [{ key: 'dateFrom', label: 'Date de', value: filterDateFrom }] : []),
    ...(filterDateTo ? [{ key: 'dateTo', label: 'Date à', value: filterDateTo }] : []),
  ];

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case 'status': setFilterStatus(''); break;
      case 'ville': setFilterVille(''); break;
      case 'prestataire': setFilterPrestataire(''); break;
      case 'financement': setFilterFinancement(''); break;
      case 'dateFrom': setFilterDateFrom(''); break;
      case 'dateTo': setFilterDateTo(''); break;
    }
  };

  return (
    <>
      <div className="w-full overflow-x-auto py-6">
        {/* Header du tableau - Responsive */}
        <div className="mb-6 flex flex-col gap-4">

          {/* Filter Panel */}
          {showFilters && (
            <div
              className="bg-primary rounded-lg border border-primary p-4 shadow-md animate-in slide-in-top duration-300"
              role="region"
              aria-label="Filtres du tableau"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-1">Statut</label>
                  <input
                    type="text"
                    placeholder="Filtrer par statut"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    aria-label="Filtrer par statut"
                    className="w-full px-3 py-2 rounded-lg border border-primary bg-primary text-sm text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-1">Ville</label>
                  <input
                    type="text"
                    placeholder="Filtrer par ville"
                    value={filterVille}
                    onChange={(e) => setFilterVille(e.target.value)}
                    aria-label="Filtrer par ville"
                    className="w-full px-3 py-2 rounded-lg border border-primary bg-primary text-sm text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-1">Prestataire</label>
                  <input
                    type="text"
                    placeholder="Filtrer par prestataire"
                    value={filterPrestataire}
                    onChange={(e) => setFilterPrestataire(e.target.value)}
                    aria-label="Filtrer par prestataire"
                    className="w-full px-3 py-2 rounded-lg border border-primary bg-primary text-sm text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-1">Financement</label>
                  <input
                    type="text"
                    placeholder="Filtrer par financement"
                    value={filterFinancement}
                    onChange={(e) => setFilterFinancement(e.target.value)}
                    aria-label="Filtrer par financement"
                    className="w-full px-3 py-2 rounded-lg border border-primary bg-primary text-sm text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-1">Date estimative (de)</label>
                  <DatePicker
                    value={filterDateFrom}
                    onChange={setFilterDateFrom}
                    placeholderText="JJ/MM/AAAA"
                    className="h-10 px-3 py-2 text-sm shadow-none hover:shadow-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-1">Date estimative (à)</label>
                  <DatePicker
                    value={filterDateTo}
                    onChange={setFilterDateTo}
                    placeholderText="JJ/MM/AAAA"
                    className="h-10 px-3 py-2 text-sm shadow-none hover:shadow-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-primary">
                <button
                  onClick={() => {
                    setFilterStatus('');
                    setFilterVille('');
                    setFilterPrestataire('');
                    setFilterFinancement('');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                  }}
                  className="px-4 py-2 rounded-lg border border-primary text-secondary font-semibold hover:bg-secondary transition-all duration-200"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md hover:shadow transition-all duration-200"
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}
          
          {/* Active Filter Chips */}
          <FilterChips
            filters={activeFilters}
            onRemove={handleRemoveFilter}
            onResetAll={resetFilters}
          />
          
          <div className="flex items-center justify-between gap-3">
            <label className="text-secondary font-medium text-sm">Lignes par page</label>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="select-enhanced h-10 px-3 py-2"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tableau moderne - Responsive Design */}
        <div
          className={`rounded-lg shadow-sm bg-primary border border-primary overflow-hidden transition-all duration-300 ${
            isPageTransitioning
              ? transitionDirection === 'right'
                ? 'opacity-0 transform translateX(-20px)'
                : 'opacity-0 transform translateX(20px)'
              : 'opacity-100 transform translateX(0)'
          }`}
        >
          {/* Desktop/Tablette Table - Horizontal scroll for all columns */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-primary">
              <caption className="sr-only">
                Tableau des dossiers clients, {filteredItems.length} resultats
              </caption>
              <thead>
                <tr className="bg-secondary border-b border-primary">
                  {columns.map((col, idx) => (
                    <th
                      key={col.key as string}
                      aria-sort={
                        sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                      }
                      className={`px-4 py-3 font-semibold text-left cursor-pointer select-none hover:bg-secondary-dark transition-colors duration-200 whitespace-nowrap text-xs uppercase tracking-wider text-tertiary ${
                        idx === 0 ? 'sticky left-0 bg-secondary z-10 shadow-r' : ''
                      }`}
                      onClick={() => setSortKey(col.key as string)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        {sortKey === col.key && (
                          <span className="text-accent">
                            {sortDir === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-16"
                    >
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                          <svg
                            className="w-10 h-10 text-amber-500 dark:text-amber-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {search ? 'Aucun résultat trouvé' : 'Aucune donnée disponible'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {search ? 'Essayez de modifier votre recherche' : 'Commencez par ajouter votre premier dossier'}
                          </p>
                          {!search && !['dp-accordes', 'dp-refuses', 'consuel-finalise', 'raccordement-mes'].includes(section) && (
                            <button
                              onClick={() => onEdit({} as ClientRecord)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow transition-all duration-200 hover:scale-[1.01]"
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Créer un dossier
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {paginated.map((item, idx) => (
                  <tr
                    key={item._id || item.id || idx}
                    className={`group hover:bg-secondary dark:hover:bg-gray-800 transition-colors duration-200 border-b border-border dark:border-gray-700 last:border-b-0 ${
                      isPageTransitioning
                        ? 'opacity-0 transform translateX(10px)'
                        : 'opacity-100 transform translateX(0)'
                    }`}
                    style={{
                      animation: isPageTransitioning
                        ? 'none'
                        : `slideIn 0.4s ease-out ${idx * 30}ms forwards`,
                    }}
                  >
                    {columns.map((col, cellIdx) => (
                      <td
                        key={col.key as string}
                        className={`px-4 py-4 whitespace-nowrap ${
                          cellIdx === 0 ? 'sticky left-0 bg-primary z-10' : ''
                        }`}
                      >
                        {cellIdx === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleClientClick(item)}
                            className="text-left w-full font-semibold text-primary hover:text-amber-600 dark:hover:text-amber-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                            aria-label={`Voir le détail du dossier ${item.client || 'client'}`}
                          >
                            {(item[col.key] as string) || '-'}
                          </button>
                        ) : col.key === 'dateEnvoi' ||
                        col.key === 'dateEstimative' ||
                        col.key === 'dateDerniereDemarche' ||
                        col.key === 'dateMiseEnService' ||
                        col.key === 'datePV' ||
                        col.key === 'pvChantierDate' ? (
                          formatDateFR(item[col.key] as string)
                        ) : col.key === 'pvChantier' && isInstallation && item.pvChantier ? (
                          <span className="font-medium text-primary">{item.pvChantier}</span>
                        ) : col.key === 'pvChantier' && item.pvChantier ? (
                          formatDateFR(item[col.key] as string)
                        ) : col.key === 'portail' &&
                          isDp &&
                          item.portail &&
                          item.portail.startsWith('http') ? (
                          <a
                            href={item.portail}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-success-500 text-white dark:text-white font-medium hover:bg-success-600 dark:hover:bg-success-600 transition-colors duration-200 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Connexion
                            <ArrowSquareOut className="w-3 h-3" weight="bold" />
                          </a>
                        ) : col.key === 'identifiant' && item.identifiant ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium text-xs border border-primary-200 dark:border-primary-800">
                            <Key className="w-3 h-3" weight="bold" />
                            {item.identifiant}
                          </span>
                        ) : col.key === 'motDePasse' && item.motDePasse ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 font-medium text-xs border border-error-200 dark:border-error-800">
                              <Key className="w-3 h-3" weight="bold" />
                              {item.motDePasse}
                            </span>
                          ) : col.key === 'statut' && item.statut ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded font-medium text-xs border ${getStatutBadgeColor(item.statut)}`}>
                              {item.statut}
                            </span>
                          ) : col.key === 'financement' && item.financement ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded font-medium text-xs border ${getFinancementBadgeColor(item.financement)}`}>
                              {item.financement}
                            </span>
                          ) : col.key === 'raccordement' && item.raccordement ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded font-medium text-xs border ${getRaccordementBadgeColor(item.raccordement)}`}>
                              {item.raccordement}
                            </span>
                          ) : col.key === 'etatActuel' && item.etatActuel ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded font-medium text-xs border ${getEtatActuelBadgeColor(item.etatActuel)}`}>
                              {item.etatActuel}
                            </span>
                          ) : col.key === 'typeConsuel' && item.typeConsuel ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded font-medium text-xs border ${getTypeConsuelBadgeColor(item.typeConsuel)}`}>
                              {item.typeConsuel}
                            </span>
                          ) : col.key === 'prestataire' && item.prestataire ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded font-medium text-xs border ${getPrestataireBadgeColor(item.prestataire)}`}>
                              {item.prestataire}
                            </span>
                          ) : col.key === 'causeNonPresence' && item.causeNonPresence ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded font-medium text-xs border ${getCauseNonPresenceBadgeColor(item.causeNonPresence)}`}>
                              {item.causeNonPresence}
                            </span>
                          ) : (
                            <span className="font-medium text-primary">
                              {(item[col.key] as string) || '-'}
                            </span>
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isPageTransitioning={isPageTransitioning}
          />
        </div>
      </div>

      {/* Modal Client Details */}
      <ClientModal
        selectedClient={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        section={section}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />
    </>
  );
}

