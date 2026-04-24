'use client';

import { useEffect, useRef, useState } from 'react';
import { ClientRecord, Section } from '@/types/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import Select from '@/components/ui/Select';
import AutocompleteInput from '@/components/ui/AutocompleteInput';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  installationStatuts,
  financementOptions,
  pvChantierStatusOptions,
  consuelTypes,
} from '@/lib/sectionConfig';
import {
  FloppyDisk,
  X,
  User,
  Buildings,
  Calendar,
  FileText,
  Lightning,
  Info,
  CheckCircle,
  CaretDown,
  CaretUp,
  MapPin,
  Shield,
  Globe,
  Key,
  Clock,
  Phone,
  Envelope,
  House,
  Gear,
} from '@phosphor-icons/react';

interface ClientFormProps {
  /** Section dans laquelle le formulaire est utilisé */
  section: Section;
  /** Client à modifier (null pour un nouveau client) */
  client?: ClientRecord | null;
  /** Fonction appelée lors de la sauvegarde du formulaire */
  onSave: (record: ClientRecord) => void;
  /** Fonction appelée lors de la fermeture du formulaire */
  onClose: () => void;
}

const dpStatuts = [
  "En cours d'instruction",
  'ABF',
  'Accord favorable',
  'Accord tacite',
  'Refus',
];
const consuelStatuts = [
  'Avis de visite',
  'Demande à effectuer',
  'Consuel Visé',
  'En cours de traitement',
];
const raccordementStatuts = ['Demande transmise', 'Demande à effectuer'];
const daactStatuts = ['En attente', 'Validé', 'Refusé'];

export default function ClientForm({
  section,
  client,
  onSave,
  onClose,
}: ClientFormProps) {
  const [form, setForm] = useState<ClientRecord>({
    ...(typeof client?.id === 'number' ? { id: client.id } : {}),

    section,
    client: client?.client || '',
    prestataire: client?.prestataire || '',
    statut: client?.statut || '',
    dateEnvoi: client?.dateEnvoi ?? '',
    dateEstimative: client?.dateEstimative ?? '',
    financement: client?.financement ?? '',
    noDp: client?.noDp ?? '',
    ville: client?.ville ?? '',
    portail: client?.portail ?? '',
    identifiant: client?.identifiant ?? '',
    motDePasse: client?.motDePasse ?? '',
    type: client?.type ?? '',
    pvChantier: client?.pvChantier ?? '',
    pvChantierDate: client?.pvChantierDate ?? '',
    datePV: client?.datePV ?? '',
    causeNonPresence: client?.causeNonPresence ?? '',
    etatActuel: client?.etatActuel ?? '',
    typeConsuel: client?.typeConsuel ?? '',
    dateDerniereDemarche: client?.dateDerniereDemarche ?? '',
    commentaires: client?.commentaires ?? '',
    raccordement: client?.raccordement ?? '',
    numeroContrat: client?.numeroContrat ?? '',
    dateMiseEnService: client?.dateMiseEnService ?? '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [dpAccordesClients, setDpAccordesClients] = useState<string[]>([]);
  const [dpAccordesData, setDpAccordesData] = useState<Record<string, { noDp: string; ville: string }>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Fetch clients from DP Accordés section for autocomplete
    if (section === 'daact') {
      fetch('/api/clients?section=dp-accordes&limit=10000')
        .then((res) => res.json())
        .then((response) => {
          const data = response.data || response;
          const clients = Array.isArray(data) ? data.map((item: any) => item.client).filter(Boolean) : [];
          // Deduplicate client names
          const uniqueClients = [...new Set(clients)];
          setDpAccordesClients(uniqueClients);
          
          // Store client data for auto-population (use first occurrence for duplicates)
          const clientDataMap: Record<string, { noDp: string; ville: string }> = {};
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (item.client && !clientDataMap[item.client]) {
                clientDataMap[item.client] = {
                  noDp: item.noDp || '',
                  ville: item.ville || '',
                };
              }
            });
          }
          setDpAccordesData(clientDataMap);
        })
        .catch((err) => console.error('Erreur lors du chargement des clients DP Accordés:', err));
    }
  }, [section]);

  useEffect(() => {
    if (!isEditing) {
      setForm({
        ...(client?._id ? { _id: client._id } : {}),
        ...(typeof client?.id === 'number' ? { id: client.id } : {}),
        section,
        client: client?.client || '',
        prestataire: client?.prestataire || '',
        statut: client?.statut || '',
        dateEnvoi: client?.dateEnvoi ?? '',
        dateEstimative: client?.dateEstimative ?? '',
        financement: client?.financement ?? '',
        noDp: client?.noDp ?? '',
        ville: client?.ville ?? '',
        portail: client?.portail ?? '',
        identifiant: client?.identifiant ?? '',
        motDePasse: client?.motDePasse ?? '',
        type: client?.type ?? '',
        pvChantier: client?.pvChantier ?? '',
        pvChantierDate: client?.pvChantierDate ?? '',
        causeNonPresence: client?.causeNonPresence ?? '',
        etatActuel: client?.etatActuel ?? '',
        typeConsuel: client?.typeConsuel ?? '',
        dateDerniereDemarche: client?.dateDerniereDemarche ?? '',
        datePV: client?.datePV ?? '',
        commentaires: client?.commentaires ?? '',
        raccordement: client?.raccordement ?? '',
        numeroContrat: client?.numeroContrat ?? '',
        dateMiseEnService: client?.dateMiseEnService ?? '',
      });
    }
  }, [client, section, isEditing]);

  useEffect(() => {
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
  }, [onClose]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChange = (key: keyof ClientRecord, value: string) => {
    setIsEditing(true);
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (section.startsWith('dp') && key === 'dateEnvoi' && value) {

        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          d.setMonth(d.getMonth() + (prev.statut === 'ABF' ? 2 : 1));
          next.dateEstimative = d.toISOString().slice(0, 10);
        }
      }


      if (section.startsWith('dp') && key === 'statut') {
        if (value === 'ABF' && prev.dateEnvoi) {
          const d = new Date(prev.dateEnvoi);
          if (!isNaN(d.getTime())) {
            d.setMonth(d.getMonth() + 2);
            next.dateEstimative = d.toISOString().slice(0, 10);
          }
        }
      }

      // Automated Date Estimatives calculation for Consuel based on type
      if (section.startsWith('consuel') && (key === 'typeConsuel' || key === 'dateDerniereDemarche')) {
        const typeConsuel = key === 'typeConsuel' ? value : prev.typeConsuel;
        const dateDerniereDemarche = key === 'dateDerniereDemarche' ? value : prev.dateDerniereDemarche;
        
        if (typeConsuel && dateDerniereDemarche) {
          const d = new Date(dateDerniereDemarche);
          if (!isNaN(d.getTime())) {
            const weeksToAdd = typeConsuel === 'Bleu' ? 2 : typeConsuel === 'Violet' ? 4 : 0;
            d.setDate(d.getDate() + (weeksToAdd * 7));
            next.dateEstimative = d.toISOString().slice(0, 10);
          }
        }
      }

      if (section === 'installation' && key === 'statut' && value === 'En attente date de pose') {
        next.pvChantier = 'En attente';
      }

      if (section === 'installation' && key === 'dateEstimative' && prev.statut === 'En attente date de pose') {
        next.pvChantier = 'En attente';
      }

      return next;
    });

    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.client.trim()) {
      newErrors.client = 'Le nom du client est requis';
    }

    if (!section.startsWith('dp') && !isDaact && !form.financement?.trim()) {
      newErrors.financement = 'Le financement est requis';
    }

    if (section.startsWith('dp') && !form.statut?.trim()) {
      newErrors.statut = 'Le statut est requis';
    }

    if (isDaact && !form.statut?.trim()) {
      newErrors.statut = 'Le statut est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateInput = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISO = new Date(d.getTime() - tzOffset)
      .toISOString()
      .slice(0, 10);
    return localISO;

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called with form:', form);

    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { id, ...rest } = form;
      
      let finalSection = section;
      if (section === 'consuel-en-cours' && form.etatActuel === 'Consuel OK') {
        finalSection = 'consuel-finalise';
      }

      if (section === 'raccordement' && form.raccordement === 'Mise en service') {
        finalSection = 'raccordement-mes';
      }

      const formToSend: ClientRecord = {
        ...rest,
        section: finalSection,
        dateEnvoi: formatDateInput(form.dateEnvoi ?? ''),
        dateEstimative: formatDateInput(form.dateEstimative ?? ''),
        pvChantier: form.pvChantier ?? '',
        pvChantierDate: formatDateInput(form.pvChantierDate ?? ''),
        datePV: formatDateInput(form.datePV ?? ''),
        dateDerniereDemarche: formatDateInput(form.dateDerniereDemarche ?? ''),
        dateMiseEnService: formatDateInput(form.dateMiseEnService ?? ''),
        raccordement: form.raccordement ?? '',
        numeroContrat: form.numeroContrat ?? '',
        typeConsuel: form.typeConsuel ?? '',
        causeNonPresence: form.causeNonPresence ?? '',
        etatActuel: form.etatActuel ?? '',
        commentaires: form.commentaires ?? '',
      };

      setIsEditing(false);
      onSave(formToSend);
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDp = section.startsWith('dp');
  const isInstallation = section === 'installation';
  const isConsuel = section.startsWith('consuel');
  const isRaccordement = section === 'raccordement';
  const isRaccordementMes = section === 'raccordement-mes';
  const isDaact = section === 'daact';

  const statutOptions = isDp
    ? dpStatuts.map((s) => ({ value: s, label: s }))
    : isInstallation
      ? installationStatuts.map((s) => ({ value: s, label: s }))
      : isConsuel
        ? consuelStatuts.map((s) => ({ value: s, label: s }))
        : isRaccordement
          ? raccordementStatuts.map((s) => ({ value: s, label: s }))
          : isDaact
            ? daactStatuts.map((s) => ({ value: s, label: s }))
            : [];
  const financementOptionsList = financementOptions.map((f) => ({
    value: f,
    label: f,
  }));
  const typeOptions = consuelTypes.map((t) => ({ value: t, label: t }));

  const getSectionIcon = () => {
    if (isDp) return <FileText className="h-5 w-5" />;
    if (isConsuel) return <Lightning className="h-5 w-5" weight="bold" />;
    if (isRaccordement) return <Buildings className="h-5 w-5" weight="bold" />;
    return <User className="h-5 w-5" />;
  };

  const getSectionColor = () => {
    if (isDp) return 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800';
    if (isConsuel) return 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800';
    if (isRaccordement)
      return 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div ref={modalRef} className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col" role="dialog" aria-modal="true" aria-label={client ? 'Modifier le dossier' : 'Ajouter un dossier'}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-500 text-white">
              {getSectionIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {client ? 'Modifier le dossier' : 'Ajouter un dossier'}
              </h2>
              <Badge className={getSectionColor()}>
                {section.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110 group"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
          <div className="sticky top-0 z-10 mb-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-200/70 dark:border-gray-700/70 p-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => scrollToSection('form-general')}>General</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => scrollToSection('form-workflow')}>Workflow</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => scrollToSection('form-details')}>Details</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => scrollToSection('form-footer')}>Actions</Button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {section.startsWith('consuel') && form.etatActuel === 'Consuel OK' && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-primary-800 dark:text-primary-200">
                    Ce dossier sera automatiquement déplacé vers "Consuel Finalisé"
                  </span>
                </div>
              </div>
            )}
            {section === 'raccordement' && form.raccordement === 'Mise en service' && (
              <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400" />
                  <span className="text-sm font-semibold text-success-800 dark:text-success-200">
                    Ce dossier sera automatiquement déplacé vers "Raccordement MES"
                  </span>
                </div>
              </div>
            )}

            {!isDaact && (
              <div id="form-general" className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <User className="h-5 w-5 text-teal-500" />
                  Informations générales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!isDp && (
                    <Select
                      label="Financement *"
                      value={form.financement}
                      onChange={(e) => handleChange('financement', e.target.value)}
                      options={financementOptionsList}
                      placeholder="Sélectionner un financement"
                      required
                      error={errors.financement}
                      icon={<Buildings className="h-4 w-4" weight="bold" />}
                    />
                  )}

                  <Input
                    label="Commentaires"
                    value={form.commentaires}
                    onChange={(e) => handleChange('commentaires', e.target.value)}
                    placeholder="Ajouter des commentaires..."
                    name="commentaires"
                  />


                  <Input
                    label="Client *"
                    value={form.client}
                    onChange={(e) => handleChange('client', e.target.value)}
                    placeholder="Nom du client"
                    required
                    error={errors.client}
                    icon={<User className="h-4 w-4" />}

                    name="client"
                  />

                  {isDp && (
                    <Select
                      label="Statut *"
                      value={form.statut}
                      onChange={(e) => handleChange('statut', e.target.value)}
                      options={statutOptions}
                      placeholder="Sélectionner un statut"
                      required

                      error={errors.statut}
                    />
                  )}
                </div>
              </div>
            )}

            {isDp && (
              <div id="form-workflow" className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary-500" />
                  Dates et financement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DatePicker
                    label="Date d'envoi"
                    value={form.dateEnvoi}
                    onChange={(value) => handleChange('dateEnvoi', value)}
                    icon={<Calendar className="h-4 w-4" />}
                    name="dateEnvoi"
                  />
                  <DatePicker
                    label="Date estimative"
                    value={form.dateEstimative}
                    onChange={(value) => handleChange('dateEstimative', value)}
                    helperText="Calculée automatiquement selon le statut"
                    icon={<Clock className="h-4 w-4" />}
                    name="dateEstimative"
                    disabled
                    readOnly
                  />
                  <Select
                    label="Financement"
                    value={form.financement}
                    onChange={(e) => handleChange('financement', e.target.value)}
                    options={financementOptionsList}
                    placeholder="Sélectionner un financement"
                  />
                </div>
              </div>
            )}

            {isDp && (
              <div id="form-details" className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Gear className="h-5 w-5 text-primary-500" weight="bold" />
                  Détails du projet
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Numéro DP"
                    value={form.noDp}
                    onChange={(e) => handleChange('noDp', e.target.value)}
                    placeholder="Numéro de déclaration"
                    icon={<FileText className="h-4 w-4" />}

                    name="noDp"
                  />
                  <Input
                    label="Ville"
                    value={form.ville}
                    onChange={(e) => handleChange('ville', e.target.value)}
                    placeholder="Ville du projet"
                    icon={<MapPin className="h-4 w-4" />}

                    name="ville"
                  />
                  <Input
                    label="Portail"
                    value={form.portail}
                    onChange={(e) => handleChange('portail', e.target.value)}
                    placeholder="Nom du portail"
                    icon={<Globe className="h-4 w-4" />}

                    name="portail"
                  />
                  <Input
                    label="Identifiant"
                    value={form.identifiant}
                    onChange={(e) => handleChange('identifiant', e.target.value)}
                    placeholder="Identifiant de connexion"
                    icon={<Shield className="h-4 w-4" />}

                    name="identifiant"
                  />
                  <Input
                    label="Mot de passe"
                    type="password"
                    value={form.motDePasse}
                    onChange={(e) => handleChange('motDePasse', e.target.value)}
                    placeholder="Mot de passe"
                    icon={<Key className="h-4 w-4" />}
                    name="motDePasse"
                  />
                </div>
              </div>
            )}

            {isInstallation && (
              <div id="form-installation" className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <House className="h-5 w-5 text-primary-500" weight="bold" />
                  Détails Installation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Statut"
                    value={form.statut}
                    onChange={(e) => handleChange('statut', e.target.value)}
                    options={installationStatuts.map((s) => ({ value: s, label: s }))}
                    placeholder="Sélectionner un statut"
                  />
                  <Select
                    label="PV Chantier"
                    value={form.pvChantier}
                    onChange={(e) => handleChange('pvChantier', e.target.value)}
                    options={pvChantierStatusOptions.map((value) => ({ value, label: value }))}
                    placeholder="Sélectionner un statut PV"
                  />
                  <DatePicker
                    label="Date de pose"
                    value={form.dateEstimative}
                    onChange={(value) => handleChange('dateEstimative', value)}
                    icon={<Calendar className="h-4 w-4" />}
                    name="dateEstimative"
                  />
                  <DatePicker
                    label="Date PV"
                    value={form.datePV}
                    onChange={(value) => handleChange('datePV', value)}
                    icon={<Calendar className="h-4 w-4" />}
                    name="datePV"
                  />
                </div>
              </div>
            )}

            {isConsuel && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Lightning className="h-5 w-5 text-primary-500" weight="bold" />
                  Détails Consuel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DatePicker
                    label="PV Chantier"
                    value={form.pvChantierDate}
                    onChange={(value) => handleChange('pvChantierDate', value)}
                    icon={<Calendar className="h-4 w-4" />}
                    name="pvChantierDate"
                  />
                  <Select
                    label="Cause de non présence Consuel"
                    value={form.causeNonPresence}
                    onChange={(e) => handleChange('causeNonPresence', e.target.value)}

                    options={[
                      { value: 'Consuel non demandé', label: 'Consuel non demandé' },
                      { value: 'Consuel refusé pour cause technique', label: 'Consuel refusé pour cause technique' },
                      { value: 'Consuel refusé pour cause administrative', label: 'Consuel refusé pour cause administrative' },
                      { value: 'Consuel envoyé', label: 'Consuel envoyé' },
                    ]}
                    placeholder="Sélectionner une cause"
                  />
                  <Select
                    label="Etat Actuel"
                    value={form.etatActuel}
                    onChange={(e) => handleChange('etatActuel', e.target.value)}
                    options={statutOptions}
                    placeholder="Sélectionner un état"
                  />
                  <Select
                    label="Type de consuel demandé"
                    value={form.typeConsuel}
                    onChange={(e) => handleChange('typeConsuel', e.target.value)}
                    options={[
                      { value: 'Violet', label: 'Violet' },
                      { value: 'Bleu', label: 'Bleu' },
                    ]}
                    placeholder="Sélectionner un type"
                  />
                  <DatePicker
                    label="Date dernière démarche"
                    value={form.dateDerniereDemarche}
                    onChange={(value) => handleChange('dateDerniereDemarche', value)}
                    icon={<Calendar className="h-4 w-4" />}
                    name="dateDerniereDemarche"
                  />
                  <DatePicker
                    label="Date Estimatives"
                    value={form.dateEstimative}
                    onChange={(value) => handleChange('dateEstimative', value)}
                    icon={<Clock className="h-4 w-4" />}
                    name="dateEstimative"
                    disabled
                    readOnly
                  />
                </div>
              </div>
            )}

            {(isConsuel || isRaccordement || isRaccordementMes) && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  Commentaires
                </h3>
                <Input
                  label="Commentaires"
                  value={form.commentaires}
                  onChange={(e) => handleChange('commentaires', e.target.value)}
                  placeholder="Ajouter des commentaires..."
                  name="commentaires"
                />
              </div>
            )}

            {isRaccordement && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Buildings className="h-5 w-5 text-primary-500" weight="bold" />
                  Raccordement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Type de consuel demandé"
                    value={form.typeConsuel}
                    onChange={(e) => handleChange('typeConsuel', e.target.value)}
                    options={[
                      { value: 'Violet', label: 'Violet' },
                      { value: 'Bleu', label: 'Bleu' },
                    ]}
                    placeholder="Sélectionner un type"
                  />
                  <Select
                    label="Raccordement"
                    value={form.raccordement}
                    onChange={(e) => handleChange('raccordement', e.target.value)}

                    options={[
                      { value: 'Demande à effectuer', label: 'Demande à effectuer' },
                      { value: 'Demande transmise', label: 'Demande transmise' },
                      { value: 'Mise en service', label: 'Mise en service' },
                    ]}
                    placeholder="Sélectionner un raccordement"
                  />
                  <DatePicker
                    label="Date dernière démarche"
                    value={form.dateDerniereDemarche}
                    onChange={(value) => handleChange('dateDerniereDemarche', value)}
                    icon={<Calendar className="h-4 w-4" />}
                    name="dateDerniereDemarche"
                  />
                  <DatePicker
                    label="Date Estimatives"
                    value={form.dateEstimative}
                    onChange={(value) => handleChange('dateEstimative', value)}
                    icon={<Clock className="h-4 w-4" />}
                    name="dateEstimative"
                    disabled
                    readOnly
                  />
                </div>
              </div>
            )}

            {isRaccordementMes && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <House className="h-5 w-5 text-primary-500" weight="bold" />
                  Mise en service
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Numéro de contrat"
                    value={form.numeroContrat}
                    onChange={(e) => handleChange('numeroContrat', e.target.value)}
                    placeholder="Numéro de contrat"
                    icon={<FileText className="h-4 w-4" />}
                    name="numeroContrat"
                  />
                  <DatePicker
                    label="Date de Mise en service"
                    value={form.dateMiseEnService}
                    onChange={(value) => handleChange('dateMiseEnService', value)}
                    icon={<Calendar className="h-4 w-4" />}
                    name="dateMiseEnService"
                  />
                </div>
              </div>
            )}

            {isDaact && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  DAACT
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AutocompleteInput
                    label="Client"
                    value={form.client}
                    onChange={(e) => handleChange('client', e.target.value)}
                    placeholder="Nom du client"
                    required
                    icon={<User className="h-4 w-4" />}
                    name="client"
                    options={dpAccordesClients}
                    readOnlyAfterSelect={true}
                    onSelect={(selectedClient) => {
                      const clientData = dpAccordesData[selectedClient];
                      if (clientData) {
                        handleChange('noDp', clientData.noDp);
                        handleChange('ville', clientData.ville);
                      }
                    }}
                  />
                  <Input
                    label="Numéro DP"
                    value={form.noDp}
                    onChange={(e) => handleChange('noDp', e.target.value)}
                    placeholder="Numéro de déclaration"
                    icon={<FileText className="h-4 w-4" />}
                    name="noDp"
                    disabled
                    readOnly
                  />
                  <Input
                    label="Ville"
                    value={form.ville}
                    onChange={(e) => handleChange('ville', e.target.value)}
                    placeholder="Ville du projet"
                    icon={<MapPin className="h-4 w-4" />}
                    name="ville"
                    disabled
                    readOnly
                  />
                  <Select
                    label="Statut"
                    value={form.statut}
                    onChange={(e) => handleChange('statut', e.target.value)}
                    options={statutOptions}
                    placeholder="Sélectionner un statut"
                  />
                </div>
              </div>
            )}

            <div id="form-footer" className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {form.statut === 'Accord favorable' && (

                  <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 animate-pulse">
                    ⚠️ Déplacement vers "DP Accordés"
                  </Badge>
                )}
                {form.statut === 'Refus' && (
                  <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700 animate-pulse">
                    ⚠️ Déplacement vers "DP Refus"
                  </Badge>
                )}

              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  icon={<X className="h-4 w-4" />}

                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={isSubmitting ? null : <FloppyDisk className="h-4 w-4" weight="bold" />}

                >
                  {isSubmitting
                    ? 'Enregistrement...'
                    : client
                      ? 'Mettre à jour'
                      : 'Ajouter'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

