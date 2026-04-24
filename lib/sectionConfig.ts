import { Section } from '@/types/client';

export const clientCollectionName = 'clients';

export const validSections: Section[] = [
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
];

export const installationStatuts = ['En attente date de pose', 'Date prévue'] as const;
export const financementOptions = ['Sunlib', 'Otovo', 'Upfront'] as const;
export const pvChantierStatusOptions = ['En attente', 'Reçu'] as const;
export const consuelTypes = ['Violet', 'Bleu'] as const;

export const sectionLabelMap: Record<Section, string> = {
  clients: 'Clients',
  'dp-en-cours': 'Déclaration Préalable – En cours',
  'dp-accordes': 'Déclaration Préalable – Accordés',
  'dp-refuses': 'Déclaration Préalable – Refus',
  daact: 'Déclaration attestant l\'achèvement et la conformité des travaux',
  installation: 'Installation – En cours',
  'consuel-en-cours': 'Consuel – En cours',
  'consuel-finalise': 'Consuel – Finalisé',
  raccordement: 'Raccordement',
  'raccordement-mes': 'Raccordement – Mise En Service',
};
