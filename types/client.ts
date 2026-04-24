/**
 * Sections disponibles dans l'application
 * Correspond aux différentes étapes du processus de suivi des installations solaires
 */
export type Section =
  | 'clients'
  | 'dp-en-cours'
  | 'dp-accordes'
  | 'dp-refuses'
  | 'daact'
  | 'installation'
  | 'consuel-en-cours'
  | 'consuel-finalise'
  | 'raccordement'
  | 'raccordement-mes';

/**
 * Enregistrement de client/dossier
 * Représente un dossier à travers toutes les sections du processus
 */
export interface ClientRecord {
  /** Identifiant MongoDB (optionnel pour les nouveaux enregistrements) */
  _id?: string;
  /** Identifiant alternatif (peut être un nombre ou une chaîne) */
  id?: number | string;
  /** Section actuelle du dossier */
  section: Section;
  /** Nom du client (requis) */
  client: string;
  /** Prestataire assigné au dossier */
  prestataire?: string;
  /** Statut actuel du dossier */
  statut?: string;
  /** Date d'envoi du dossier (format ISO string) */
  dateEnvoi?: string;
  /** Date estimative de traitement (format ISO string) */
  dateEstimative?: string;
  /** Type de financement (ex: Sunlib, Otovo) */
  financement?: string;
  /** Numéro de déclaration préalable */
  noDp?: string;
  /** Ville du projet */
  ville?: string;
  /** URL du portail de suivi */
  portail?: string;
  /** Identifiant de connexion au portail */
  identifiant?: string;
  /** Mot de passe de connexion au portail */
  motDePasse?: string;
  /** Type de certification Consuel (ex: Violet, Bleu) */
  type?: string;
  /** PV Chantier status (pour section Installation) */
  pvChantier?: string;
  /** PV Chantier date (pour section Consuel) */
  pvChantierDate?: string;
  /** Cause de non présence Consuel (pour section Consuel) */
  causeNonPresence?: string;
  /** Etat Actuel (pour section Consuel) */
  etatActuel?: string;
  /** Type de consuel demandé (pour section Consuel) */
  typeConsuel?: string;
  /** Date dernière démarche (pour section Consuel) */
  dateDerniereDemarche?: string;
  /** Date de PV (pour section Installation) */
  datePV?: string;
  /** Commentaires (pour section Consuel) */
  commentaires?: string;
  /** Raccordement (pour section Raccordement) */
  raccordement?: string;
  /** Numéro de contrat (pour section Raccordement MES) */
  numeroContrat?: string;
  /** Date de Mise en service raccordement (pour section Raccordement MES) */
  dateMiseEnService?: string;
  /** Historique des étapes pour voir le parcours du dossier */
  stages?: Record<string, {
    statut?: string;
    date?: string;
    updatedAt?: string | Date;
  }>;
}
