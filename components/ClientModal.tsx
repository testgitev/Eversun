'use client';

import { useEffect, useRef, useState } from 'react';
import { User, X, Eye, EyeSlash, Calendar, Buildings, FileText, Key, WarningCircle, Lightning, CheckCircle, ChatCircle, Flag, House, Clock, Copy, Link, Trash, PencilSimple } from '@phosphor-icons/react';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ClientRecord } from '@/types/client';
import {
  formatDateFR,
  getStatutBadgeColor,
} from '@/lib/clientTableUtils';
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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedClient) return;
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
    const diffDays = Math.ceil((estimatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: 'from-red-500 to-rose-600', label: 'En retard', urgent: true, diffDays };
    }
    if (diffDays === 0) {
      return { color: 'from-red-500 to-orange-500', label: "Aujourd'hui", urgent: true, diffDays };
    }
    if (diffDays <= 3) {
      return { color: 'from-orange-500 to-amber-500', label: 'Urgent', urgent: true, diffDays };
    }
    if (diffDays <= 7) {
      return { color: 'from-yellow-500 to-amber-500', label: 'Proche', urgent: false, diffDays };
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
        className="relative bg-primary backdrop-blur-xl rounded-lg shadow-md w-full max-w-4xl max-h-[90vh] overflow-hidden border border-primary flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`Dossier ${selectedClient.client || 'client'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary bg-secondary">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 rounded-lg bg-primary-500 text-white shadow-sm">
              <User className="h-6 w-6" weight="bold" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedClient.client}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatutBadgeColor(selectedClient.statut)}>
                  {selectedClient.statut || 'Sans statut'}
                </Badge>
                {urgency && (
                  <Badge className={`${urgency.color.replace('from-', 'bg-').split(' ')[0]} text-white border-0`}>
                    {urgency.label} ({urgency.diffDays}j)
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(selectedClient)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors group"
              title="Modifier"
            >
              <PencilSimple className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" weight="bold" />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg hover:bg-secondary transition-colors group"
                title="Supprimer"
              >
                <Trash className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" weight="bold" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3 rounded-lg hover:bg-secondary transition-all duration-200 hover:scale-[1.01] group"
              title="Fermer"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" weight="bold" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
          <div className="space-y-6">
            {/* Informations générales */}
            <div className="bg-primary rounded-lg p-6 border border-primary shadow">
              <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-teal-500" weight="bold" />
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedClient.prestataire && (
                  <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                    <Buildings className="h-4 w-4 text-teal-500" weight="bold" />
                    <div>
                      <p className="text-xs font-semibold text-tertiary">Prestataire</p>
                      <p className="font-medium text-primary">
                        {selectedClient.prestataire}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.dateEnvoi && (
                  <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                    <Calendar className="h-4 w-4 text-teal-500" weight="bold" />
                    <div>
                      <p className="text-xs font-semibold text-tertiary">Date d'envoi</p>
                      <p className="font-medium text-primary">
                        {formatDateFR(selectedClient.dateEnvoi)}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.dateEstimative && (
                  <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                    <Clock className="h-4 w-4 text-teal-500" weight="bold" />
                    <div>
                      <p className="text-xs font-semibold text-tertiary">Date estimative</p>
                      <p className="font-medium text-primary">
                        {formatDateFR(selectedClient.dateEstimative)}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.financement && (
                  <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                    <Lightning className="h-4 w-4 text-teal-500" weight="bold" />
                    <div>
                      <p className="text-xs font-semibold text-tertiary">Financement</p>
                      <p className="font-medium text-primary">
                        {selectedClient.financement}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.noDp && (
                  <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                    <FileText className="h-4 w-4 text-teal-500" weight="bold" />
                    <div>
                      <p className="text-xs font-semibold text-tertiary">Numéro DP</p>
                      <p className="font-medium text-primary">
                        {selectedClient.noDp}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.ville && (
                  <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                    <Buildings className="h-4 w-4 text-teal-500" weight="bold" />
                    <div>
                      <p className="text-xs font-semibold text-tertiary">Ville</p>
                      <p className="font-medium text-primary">
                        {selectedClient.ville}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Identifiants Portail - Affiché uniquement pour DP en cours */}
            {section.startsWith('dp') && section !== 'dp-accordes' && section !== 'dp-refuses' && (
              <div className="bg-primary rounded-lg p-6 border border-primary shadow">
                <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                  <Key className="h-5 w-5 text-teal-500" weight="bold" />
                  Identifiants Portail
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClient.portail && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Buildings className="h-4 w-4 text-teal-500" weight="bold" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-tertiary">Portail</p>
                        <p className="font-medium text-primary">
                          {selectedClient.portail}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.identifiant && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <User className="h-4 w-4 text-teal-500" weight="bold" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-tertiary">Identifiant</p>
                        <p className="font-medium text-primary">
                          {selectedClient.identifiant}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.motDePasse && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Key className="h-4 w-4 text-primary-500" weight="bold" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Mot de passe</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {showPassword ? selectedClient.motDePasse : '••••••••'}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlash className="h-4 w-4 text-gray-500" weight="bold" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" weight="bold" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations Consuel - Affiché uniquement pour Consuel */}
            {section.startsWith('consuel') && (
              <div className="bg-primary rounded-lg p-6 border border-primary shadow">
                <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                  <Lightning className="h-5 w-5 text-teal-500" weight="bold" />
                  Informations Consuel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClient.pvChantierDate && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Calendar className="h-4 w-4 text-teal-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">PV Chantier</p>
                        <p className="font-medium text-primary">
                          {formatDateFR(selectedClient.pvChantierDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.causeNonPresence && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <WarningCircle className="h-4 w-4 text-red-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Cause non présence</p>
                        <p className="font-medium text-primary">
                          {selectedClient.causeNonPresence}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.etatActuel && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <CheckCircle className="h-4 w-4 text-emerald-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">État actuel</p>
                        <p className="font-medium text-primary">
                          {selectedClient.etatActuel}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.typeConsuel && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Lightning className="h-4 w-4 text-amber-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Type Consuel</p>
                        <p className="font-medium text-primary">
                          {selectedClient.typeConsuel}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateDerniereDemarche && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Calendar className="h-4 w-4 text-teal-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Dernière démarche</p>
                        <p className="font-medium text-primary">
                          {formatDateFR(selectedClient.dateDerniereDemarche)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateEstimative && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Clock className="h-4 w-4 text-teal-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Date Estimatives</p>
                        <p className="font-medium text-primary">
                          {formatDateFR(selectedClient.dateEstimative)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Commentaires - Affiché pour Consuel, Raccordement et Raccordement MES */}
            {(section.startsWith('consuel') || section === 'raccordement' || section === 'raccordement-mes') && selectedClient.commentaires && (
              <div className="bg-primary rounded-lg p-6 border border-primary shadow">
                <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                  <ChatCircle className="h-5 w-5 text-teal-500" weight="bold" />
                  Commentaires
                </h3>
                <div className="p-4 bg-secondary rounded-lg border border-primary">
                  <p className="font-medium text-primary whitespace-pre-wrap">
                    {selectedClient.commentaires}
                  </p>
                </div>
              </div>
            )}

            {/* Informations Raccordement - Affiché uniquement pour Raccordement */}
            {section === 'raccordement' && (
              <div className="bg-primary rounded-lg p-6 border border-primary shadow">
                <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                  <Flag className="h-5 w-5 text-teal-500" weight="bold" />
                  Raccordement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClient.typeConsuel && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Lightning className="h-4 w-4 text-amber-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Type de consuel</p>
                        <p className="font-medium text-primary">
                          {selectedClient.typeConsuel}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.raccordement && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Flag className="h-4 w-4 text-teal-500" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Raccordement</p>
                        <p className="font-medium text-primary">
                          {selectedClient.raccordement}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateDerniereDemarche && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Calendar className="h-4 w-4 text-teal-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Date dernière démarche</p>
                        <p className="font-medium text-primary">
                          {formatDateFR(selectedClient.dateDerniereDemarche)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateEstimative && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Clock className="h-4 w-4 text-teal-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Date Estimatives</p>
                        <p className="font-medium text-primary">
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
              <div className="bg-primary rounded-lg p-6 border border-primary shadow">
                <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                  <House className="h-5 w-5 text-teal-500" weight="bold" />
                  Mise en service
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClient.numeroContrat && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <FileText className="h-4 w-4 text-teal-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Numéro de contrat</p>
                        <p className="font-medium text-primary">
                          {selectedClient.numeroContrat}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedClient.dateMiseEnService && (
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg border border-primary">
                      <Calendar className="h-4 w-4 text-teal-500" weight="bold" />
                      <div>
                        <p className="text-xs font-semibold text-tertiary">Date de Mise en service</p>
                        <p className="font-medium text-primary">
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
            ID: {selectedClient._id || selectedClient.id}
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
    </div>
  );
}
