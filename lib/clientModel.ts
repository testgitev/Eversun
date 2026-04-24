import mongoose from 'mongoose';
import { Section } from '@/types/client';

export const ClientSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed, required: false },
  section: {
    type: String,
    required: true,
    enum: [
      'clients',
      'dp-en-cours',
      'dp-accordes',
      'dp-refuses',
      'daact',
      'installation',
      'consuel-en-cours',
      'consuel-finalise',
      'raccordement',
      'raccordement-mes',
    ],
  },
  client: { type: String, required: true },
  prestataire: String,
  statut: String,
  dateEnvoi: String,
  dateEstimative: String,
  financement: String,
  noDp: String,
  ville: String,
  portail: String,
  identifiant: String,
  motDePasse: String,
  type: String,
  pvChantier: String,
  pvChantierDate: String,
  datePV: String,
  causeNonPresence: String,
  etatActuel: String,
  typeConsuel: String,
  dateDerniereDemarche: String,
  commentaires: String,
  numeroContrat: String,
  dateMiseEnService: String,
  stages: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

export interface IClient extends mongoose.Document {
  section: Section;
  client: string;
  prestataire?: string;
  statut?: string;
  dateEnvoi?: string;
  dateEstimative?: string;
  financement?: string;
  noDp?: string;
  ville?: string;
  portail?: string;
  identifiant?: string;
  motDePasse?: string;
  type?: string;
  pvChantier?: string;
  pvChantierDate?: string;
  datePV?: string;
  causeNonPresence?: string;
  etatActuel?: string;
  typeConsuel?: string;
  dateDerniereDemarche?: string;
  commentaires?: string;
  raccordement?: string;
  numeroContrat?: string;
  dateMiseEnService?: string;
}

export const ClientModel =
  mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
