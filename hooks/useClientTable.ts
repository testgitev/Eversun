import { useState, useMemo } from 'react';
import { ClientRecord } from '@/types/client';

interface UseClientTableFiltersProps {
  items: ClientRecord[];
  section: string;
}

export function useClientTableFilters({ items, section }: UseClientTableFiltersProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterVille, setFilterVille] = useState<string>('');
  const [filterPrestataire, setFilterPrestataire] = useState<string>('');
  const [filterFinancement, setFilterFinancement] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some(
          (value) =>
            value &&
            String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((item) => item.statut === filterStatus);
    }

    // Ville filter
    if (filterVille) {
      filtered = filtered.filter((item) =>
        item.ville?.toLowerCase().includes(filterVille.toLowerCase())
      );
    }

    // Prestataire filter
    if (filterPrestataire) {
      filtered = filtered.filter((item) =>
        item.prestataire?.toLowerCase().includes(filterPrestataire.toLowerCase())
      );
    }

    // Financement filter
    if (filterFinancement) {
      filtered = filtered.filter((item) =>
        item.financement?.toLowerCase().includes(filterFinancement.toLowerCase())
      );
    }

    // Date range filter
    if (filterDateFrom) {
      filtered = filtered.filter((item) => {
        const date = item.dateEnvoi || item.dateEstimative;
        return date && new Date(date) >= new Date(filterDateFrom);
      });
    }

    if (filterDateTo) {
      filtered = filtered.filter((item) => {
        const date = item.dateEnvoi || item.dateEstimative;
        return date && new Date(date) <= new Date(filterDateTo);
      });
    }

    // Sorting
    if (sortKey) {
      filtered.sort((a, b) => {
        const aVal = a[sortKey as keyof ClientRecord];
        const bVal = b[sortKey as keyof ClientRecord];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDir === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [items, search, filterStatus, filterVille, filterPrestataire, filterFinancement, filterDateFrom, filterDateTo, sortKey, sortDir]);

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterVille('');
    setFilterPrestataire('');
    setFilterFinancement('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSortKey('');
    setSortDir('asc');
  };

  return {
    // State
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
    // Computed
    filteredItems,
    // Actions
    resetFilters,
  };
}

interface UseClientTablePaginationProps {
  totalItems: number;
}

export function useClientTablePagination({ totalItems }: UseClientTablePaginationProps) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

  const handlePageChange = (newPage: number) => {
    if (newPage === page) return;

    setTransitionDirection(newPage > page ? 'right' : 'left');
    setPage(newPage);
    setIsPageTransitioning(true);

    setTimeout(() => {
      setIsPageTransitioning(false);
      setTransitionDirection(null);
    }, 300);
  };

  return {
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    isPageTransitioning,
    setIsPageTransitioning,
    transitionDirection,
    setTransitionDirection,
    totalPages,
    startIndex,
    endIndex,
    handlePageChange,
  };
}
