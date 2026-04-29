'use client';

import { useEffect, useRef, useState } from 'react';
import {
  User,
  X,
  Eye,
  EyeSlash,
  Calendar,
  Buildings,
  FileText,
  Key,
  WarningCircle,
  Lightning,
  CheckCircle,
  ChatCircle,
  Flag,
  House,
  Clock,
  Copy,
  Link,
  Folder,
} from '@phosphor-icons/react';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ClientRecord } from '@/types/client';
import { formatDateFR, getStatutBadgeColor } from '@/lib/clientTableUtils';
import { toast } from '@/store/useToastStore';

interface ClientModalProps {
  selectedClient: ClientRecord | null;
  onClose: () => void;
  onEdit: (client: ClientRecord) => void;
  onDelete?: (id: string) => void;
  section: string;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export default function ClientModal({
  selectedClient,
  onClose,
  onEdit,
  onDelete,
  section,
  showPassword,
  setShowPassword,
}: ClientModalProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientFiles, setClientFiles] = useState<Array<{ id: string; name: string; url: string; size: number; type: string }>>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedClient) return;

    // Load client files from Google Drive
    const loadClientFiles = async () => {
      if (!selectedClient.client) return;
      
      const isDp = section.startsWith('dp');
      const isConsuel = section.startsWith('consuel');
      
      if (!isDp && !isConsuel) return;

      setLoadingFiles(true);
      try {
        const response = await fetch(`/api/files?clientName=${encodeURIComponent(selectedClient.client)}`);
        const data = await response.json();
        if (data.success) {
          setClientFiles(data.files || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des fichiers:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadClientFiles();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };

    previousActiveElementRef.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'unset';
      previousActiveElementRef.current?.focus();
    };
  }, [onClose, selectedClient]);

  const getUrgencyInfo = () => {
    if (!selectedClient) return null;
    if (!selectedClient.dateEstimative) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const estimatedDate = new Date(selectedClient.dateEstimative);
    estimatedDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (estimatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return {
        color: 'from-red-500 to-rose-600',
        label: 'En retard',
        urgent: true,
        diffDays,
      };
    }
    if (diffDays === 0) {
      return {
        color: 'from-red-500 to-orange-500',
        label: "Aujourd'hui",
        urgent: true,
        diffDays,
      };
    }
    if (diffDays <= 3) {
      return {
        color: 'from-orange-500 to-amber-500',
        label: 'Urgent',
        urgent: true,
        diffDays,
      };
    }
    if (diffDays <= 7) {
      return {
        color: 'from-yellow-500 to-amber-500',
        label: 'Proche',
        urgent: false,
        diffDays,
      };
    }
    return null;
  };

  const urgency = getUrgencyInfo();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} a été copié dans le presse-papier`);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedClient) return;
    if (onDelete) {
      onDelete(String(selectedClient._id || selectedClient.id || ''));
      onClose();
    }
    setShowDeleteDialog(false);
  };

  if (!selectedClient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-slate-900 backdrop-blur-xl rounded-lg shadow-lg w-full max-w-4xl max-h-[95vh] overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`Dossier ${selectedClient.client || 'client'}`}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
              <User className="h-6 w-6 text-white" weight="bold" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {selectedClient.client}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {section.startsWith('consuel') ? (
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                    {selectedClient.causeNonPresence || selectedClient.statut || 'Sans statut'}
                  </Badge>
                ) : (
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                    {selectedClient.statut || selectedClient.raccordement || 'Sans statut'}
                  </Badge>
                )}
                {urgency && !section.startsWith('consuel') && (
                  <Badge
                    className="bg-white/30 text-white border-white/40 backdrop-blur-sm shadow-lg text-xs"
                  >
                    {urgency.label} ({urgency.diffDays}j)
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {urgency && !section.startsWith('consuel') && section !== 'dp-refuses' && (
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" weight="bold" />
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Jours restants</span>
                  </div>
                  <div className={`text-xl font-bold ${urgency.urgent ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                    {urgency.diffDays}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${urgency.urgent ? 'text-red-500' : 'text-slate-500'}`}>
                    {urgency.label}
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-violet-200 dark:border-violet-800 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" weight="bold" />
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Documents</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {clientFiles.length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Fichiers
                </div>
              </div>
              {selectedClient.dateEstimative && section !== 'consuel-finalise' && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" weight="bold" />
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{section === 'installation' ? 'Date de pose' : 'Date estimative'}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedClient.dateEstimative
                      ? formatDateFR(selectedClient.dateEstimative)
                      : 'N/A'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Estimation
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <Lightning className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" weight="bold" />
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Financement</span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {selectedClient.financement || 'N/A'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Type
                </div>
              </div>
            </div>

            {/* Informations générales */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-500" weight="bold" />
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedClient.dateEnvoi && (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-cyan-500" weight="bold" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        Date d'envoi
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatDateFR(selectedClient.dateEnvoi)}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.dateEstimative && section !== 'consuel-finalise' && (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Clock className="h-3.5 w-3.5 text-cyan-500" weight="bold" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        {section === 'installation' ? 'Date de pose' : 'Date estimative'}
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatDateFR(selectedClient.dateEstimative)}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.financement && (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Lightning
                      className="h-3.5 w-3.5 text-cyan-500"
                      weight="bold"
                    />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        Financement
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {selectedClient.financement}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.noDp && (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <FileText className="h-3.5 w-3.5 text-cyan-500" weight="bold" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        Numéro DP
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {selectedClient.noDp}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.ville && (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Buildings
                      className="h-3.5 w-3.5 text-cyan-500"
                      weight="bold"
                    />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        Ville
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {selectedClient.ville}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Identifiants Portail - Affiché uniquement pour DP en cours */}
            {section.startsWith('dp') &&
              section !== 'dp-accordes' &&
              section !== 'dp-refuses' && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4 text-cyan-500" weight="bold" />
                    Identifiants Portail
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedClient.portail && (
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Buildings
                          className="h-3.5 w-3.5 text-cyan-500"
                          weight="bold"
                        />
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            Portail
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {selectedClient.portail}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedClient.identifiant && (
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <User className="h-3.5 w-3.5 text-cyan-500" weight="bold" />
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            Identifiant
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {selectedClient.identifiant}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedClient.motDePasse && (
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Key
                          className="h-3.5 w-3.5 text-cyan-500"
                          weight="bold"
                        />
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            Mot de passe
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {showPassword
                              ? selectedClient.motDePasse
                              : '••••••••'}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {showPassword ? (
                            <EyeSlash
                              className="h-3.5 w-3.5 text-slate-500"
                              weight="bold"
                            />
                          ) : (
                            <Eye
                              className="h-3.5 w-3.5 text-slate-500"
                              weight="bold"
                            />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Documents - Affiché pour DP et Consuel */}
            {(section.startsWith('dp') || section.startsWith('consuel')) && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Folder className="h-4 w-4 text-cyan-500" weight="bold" />
                  Documents
                </h3>
                {loadingFiles ? (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-3 text-sm">Chargement des fichiers...</div>
                ) : clientFiles.length === 0 ? (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-3 text-sm">Aucun document disponible</div>
                ) : (
                  <div className="space-y-2">
                    {clientFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-cyan-500" weight="bold" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewFile({ name: file.name, url: file.url, type: file.type })}
                            className="p-1.5 text-gray-500 hover:text-cyan-500 transition-colors"
                            title="Prévisualiser"
                          >
                            <Eye className="h-4 w-4" weight="bold" />
                          </button>
                          <a
                            href={file.url}
                            download={file.name}
                            className="p-1.5 text-gray-500 hover:text-cyan-500 transition-colors"
                            title="Télécharger"
                          >
                            <Link className="h-4 w-4" weight="bold" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Informations Consuel - Affiché uniquement pour Consuel */}
            {section.startsWith('consuel') && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Lightning className="h-4 w-4 text-cyan-500" weight="bold" />
                  Informations Consuel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedClient.pvChantierDate && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Calendar
                        className="h-3.5 w-3.5 text-cyan-500"
                        weight="bold"
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          PV Chantier
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDateFR(selectedClient.pvChantierDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.causeNonPresence && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <WarningCircle
                        className="h-3.5 w-3.5 text-red-500"
                        weight="bold"
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          Statut
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {selectedClient.causeNonPresence}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.typeConsuel && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Lightning
                        className="h-3.5 w-3.5 text-cyan-500"
                        weight="bold"
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          Type Consuel
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {selectedClient.typeConsuel}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateDerniereDemarche && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Calendar
                        className="h-3.5 w-3.5 text-cyan-500"
                        weight="bold"
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          Dernière démarche
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDateFR(selectedClient.dateDerniereDemarche)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateEstimative && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Clock className="h-3.5 w-3.5 text-cyan-500" weight="bold" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          {section === 'installation' ? 'Date de pose' : 'Date estimative'}
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDateFR(selectedClient.dateEstimative)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Commentaires - Affiché pour Consuel, Raccordement et Raccordement MES */}
            {(section.startsWith('consuel') ||
              section === 'raccordement' ||
              section === 'raccordement-mes') &&
              selectedClient.commentaires && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <ChatCircle
                      className="h-4 w-4 text-cyan-500"
                      weight="bold"
                    />
                    Commentaires
                  </h3>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <p className="text-sm font-medium text-slate-900 dark:text-white whitespace-pre-wrap">
                      {selectedClient.commentaires}
                    </p>
                  </div>
                </div>
              )}

            {/* Informations Raccordement - Affiché uniquement pour Raccordement */}
            {section === 'raccordement' && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-cyan-500" weight="bold" />
                  Raccordement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedClient.typeConsuel && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Lightning
                        className="h-3.5 w-3.5 text-cyan-500"
                        weight="bold"
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          Type de consuel
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {selectedClient.typeConsuel}
                        </p>
                      </div>
                    </div>
                  )}
                  {(selectedClient.statut || selectedClient.raccordement) && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Flag className="h-3.5 w-3.5 text-cyan-500" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          Statut
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {selectedClient.statut || selectedClient.raccordement}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateDerniereDemarche && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Calendar
                        className="h-3.5 w-3.5 text-cyan-500"
                        weight="bold"
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          Date dernière démarche
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDateFR(selectedClient.dateDerniereDemarche)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateEstimative && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Clock className="h-3.5 w-3.5 text-cyan-500" weight="bold" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          {section === 'installation' ? 'Date de pose' : 'Date estimative'}
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDateFR(selectedClient.dateEstimative)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations Raccordement MES - Affiché uniquement pour Raccordement MES */}
            {section === 'raccordement-mes' && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <House className="h-4 w-4 text-cyan-500" weight="bold" />
                  Mise en service
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedClient.numeroContrat && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <FileText
                        className="h-3.5 w-3.5 text-cyan-500"
                        weight="bold"
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          Numéro de contrat
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {selectedClient.numeroContrat}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateMiseEnService && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Calendar
                        className="h-3.5 w-3.5 text-cyan-500"
                        weight="bold"
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          Date de Mise en service
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDateFR(selectedClient.dateMiseEnService)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-primary bg-secondary">
          <div className="text-sm text-tertiary">
            ID: {selectedClient.clientId || selectedClient._id || selectedClient.id}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-primary text-secondary hover:bg-secondary transition-colors duration-150 font-medium"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer le dossier de ${selectedClient.client} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-primary rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-primary">
              <h3 className="text-lg font-bold text-primary">{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" weight="bold" />
              </button>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {previewFile.type?.startsWith('image/') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : previewFile.type === 'application/pdf' ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[70vh]"
                  title={previewFile.name}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" weight="bold" />
                  <p className="text-gray-400">Prévisualisation non disponible pour ce type de fichier</p>
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="inline-block mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    Télécharger le fichier
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
