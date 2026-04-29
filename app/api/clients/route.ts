import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongo';
import mongoose from 'mongoose';
import { ClientSchema } from '@/lib/clientModel';
import { clientSchema } from '@/lib/validation';
import { clientCollectionName } from '@/lib/sectionConfig';
import { rateLimit } from '@/lib/rateLimit';

// Rate limiting: 100 requêtes par minute pour les endpoints clients
const clientsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

/**
 * Interface pour les données de client mappées
 */
interface MappedClient {
  [key: string]: unknown;
  client?: string;
  section?: string;
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

/**
 * Fonction de mappage pour transformer les champs français en anglais
 * Utilisée pour les données importées depuis un fichier Excel/CSV
 */
function mapImportedFields(doc: MappedClient): MappedClient {
  const fieldMapping: Record<string, string> = {
    Client: 'client',
    Nom: 'client',
    nom: 'client',
    "Date d'envoi DP": 'dateEnvoi',
    'Attente DP': 'dateEstimative',
    Presta: 'prestataire',
    Financement: 'financement',
    Status: 'statut',
    'Numéro DP': 'noDp',
    Ville: 'ville',
    'Site DP': 'portail',
    'Email utilisé': 'identifiant',
    'Mot de passe': 'motDePasse',
    'PV Chantier': 'pvChantierDate',
    'Date PV': 'datePV',
    'Cause de non présence Consuel': 'causeNonPresence',
    Prestataire: 'prestataire',
    'Etat Actuel': 'statut',
    'Type de consuel demandé': 'typeConsuel',
    'Date dernière démarche': 'dateDerniereDemarche',
    Commentaires: 'commentaires',
    'Date Estimatives': 'dateEstimative',
    Raccordement: 'raccordement',
    'Numéro de contrat': 'numeroContrat',
    'Date de Mise en service raccordement': 'dateMiseEnService',
  };

  const mapped: MappedClient = { ...doc };

  // Mapper les champs français vers anglais
  for (const [frenchKey, englishKey] of Object.entries(fieldMapping)) {
    if (mapped[frenchKey] !== undefined) {
      mapped[englishKey] = mapped[frenchKey];
      delete mapped[frenchKey];
    }
  }

  // Convertir les dates du format français (DD/MM/YYYY) au format ISO
  const convertFrenchDateToISO = (
    dateStr: string | undefined
  ): string | undefined => {
    if (!dateStr) return undefined;
    // Si déjà au format ISO ou contient des tirets, retourner tel quel
    if (dateStr.includes('-') || dateStr.includes('T')) return dateStr;

    // Format français: DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  mapped.dateEnvoi = convertFrenchDateToISO(
    mapped.dateEnvoi as string | undefined
  );
  mapped.dateEstimative = convertFrenchDateToISO(
    mapped.dateEstimative as string | undefined
  );
  mapped.pvChantierDate = convertFrenchDateToISO(
    mapped.pvChantierDate as string | undefined
  );
  mapped.datePV = convertFrenchDateToISO(mapped.datePV as string | undefined);
  mapped.dateDerniereDemarche = convertFrenchDateToISO(
    mapped.dateDerniereDemarche as string | undefined
  );
  mapped.dateMiseEnService = convertFrenchDateToISO(
    mapped.dateMiseEnService as string | undefined
  );

  // Si pas de section, déterminer selon le statut
  if (!mapped.section) {
    const normalizedStatut = (mapped.statut as string | undefined)?.trim();
    if (normalizedStatut === 'Accord favorable' || normalizedStatut === 'Accord tacite') {
      mapped.section = 'dp-accordes';
    } else if (normalizedStatut === 'Refus') {
      mapped.section = 'dp-refuses';
    } else if (normalizedStatut === 'ABF') {
      mapped.section = 'dp-en-cours';
    } else {
      mapped.section = 'dp-en-cours';
    }
  }

  return mapped;
}

export async function GET(request: Request) {
  // Appliquer le rate limiting
  const rateLimitResult = await clientsRateLimit(request as any);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'MONGODB_URI not configured' },
        { status: 500 }
      );
    }
    await connectToDatabase();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const section = url.searchParams.get('section');
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (section) {
      query.section = section;
    }

    try {
      const Model =
        mongoose.models[clientCollectionName] ||
        mongoose.model(
          clientCollectionName,
          ClientSchema,
          clientCollectionName
        );

      const totalCount = await Model.countDocuments(query);

      // Inclure le mot de passe pour les sections DP sauf DP Accordés et DP Refus
      let queryBuilder = Model.find(query).skip(skip).limit(limit);
      if (
        section &&
        section.startsWith('dp') &&
        section !== 'dp-accordes' &&
        section !== 'dp-refuses'
      ) {
        queryBuilder = queryBuilder.select('+motDePasse');
      }

      const docs = await queryBuilder.lean();

      const allClients = docs.map((doc) =>
        mapImportedFields(doc as MappedClient)
      );

      return NextResponse.json({
        data: allClients,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      return NextResponse.json(
        {
          error: `Erreur MongoDB lors de la récupération des clients`,
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Appliquer le rate limiting
  const rateLimitResult = await clientsRateLimit(request as any);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'MONGODB_URI not configured' },
        { status: 500 }
      );
    }
    await connectToDatabase();
    const data = await request.json();

    const parseResult = clientSchema.safeParse(data);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    if (!data.section) {
      return NextResponse.json({ error: 'Section inconnue' }, { status: 400 });
    }

    try {
      const Model =
        mongoose.models[clientCollectionName] ||
        mongoose.model(
          clientCollectionName,
          ClientSchema,
          clientCollectionName
        );

      const stageDate =
        data.dateEnvoi ||
        data.dateDerniereDemarche ||
        data.dateMiseEnService ||
        data.datePV ||
        data.pvChantierDate ||
        '';

      // Générer un clientId unique si non fourni
      const clientId = data.clientId || `CLI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const createPayload = {
        ...data,
        clientId,
        stages: {
          [data.section]: {
            statut: data.statut || '',
            date: stageDate,
            updatedAt: new Date(),
          },
        },
      };

      if (data.section === 'installation' && data.pvChantier === 'Reçu') {
        createPayload.section = 'daact';
        createPayload.statut = createPayload.statut || 'DAACT à faire';
        createPayload.stages = {
          daact: {
            statut: createPayload.statut,
            date: stageDate,
            updatedAt: new Date(),
          },
        };
      }

      const client = await Model.create(createPayload);

      // Si le client est dans dp-accordes avec statut Accord tacite ou Accord favorable,
      // créer une copie dans installation
      if (
        data.section === 'dp-accordes' &&
        (data.statut === 'Accord tacite' || data.statut === 'Accord favorable')
      ) {
        try {
          const installationPayload = {
            ...data,
            section: 'installation',
            dateEstimative: '', // Vider la date de pose lors du passage en Installation
            stages: {
              ...createPayload.stages,
              installation: {
                statut: 'En cours',
                date: new Date().toISOString(),
                updatedAt: new Date(),
              },
            },
          };
          await Model.create(installationPayload);
        } catch (installError: unknown) {
          // Ne pas bloquer la création principale si la copie échoue
          console.error(
            'Erreur lors de la copie vers installation:',
            installError
          );
        }
      }

      if (
        data.section === 'installation' &&
        data.pvChantier === 'Reçu'
      ) {
        try {
          const consuelQuery: Record<string, unknown> = {
            section: 'consuel-en-cours',
          };
          if (data.clientId) {
            consuelQuery.clientId = data.clientId;
          } else if (data.client) {
            consuelQuery.client = data.client;
          }
          const existingConsuel = await Model.findOne(consuelQuery).lean();
          if (!existingConsuel) {
            const consuelPayload = {
              ...data,
              section: 'consuel-en-cours',
              _id: undefined,
              stages: {
                ...createPayload.stages,
                'consuel-en-cours': {
                  statut: 'En cours',
                  date: new Date().toISOString(),
                  updatedAt: new Date(),
                },
              },
            };
            await Model.create(consuelPayload);
          }
        } catch (copyError: unknown) {
          console.error('Erreur lors de la copie vers Consuel En Cours:', copyError);
        }
      }

      return NextResponse.json(client);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      return NextResponse.json(
        {
          error: `Erreur MongoDB lors de la création`,
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
