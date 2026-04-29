import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongo';
import mongoose from 'mongoose';
import { ClientSchema } from '@/lib/clientModel';
import { clientCollectionName } from '@/lib/sectionConfig';
import { rateLimit } from '@/lib/rateLimit';

// Rate limiting: 50 requêtes par minute pour les opérations sur un client spécifique
const clientRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50,
});

interface StageData {
  statut?: string;
  date?: string;
  updatedAt?: Date;
}

interface ExistingDocument {
  section?: string;
  statut?: string;
  client?: string;
  _id?: unknown;
  stages?: Record<string, StageData>;
  toObject?: () => Record<string, unknown>;
}

function buildStageUpdate(
  data: Record<string, unknown>,
  existing: ExistingDocument
) {
  const section = (data.section as string) || existing.section;
  const stageDate =
    (data.dateEnvoi as string) ||
    (data.dateDerniereDemarche as string) ||
    (data.dateMiseEnService as string) ||
    (data.datePV as string) ||
    (data.pvChantierDate as string) ||
    '';

  return {
    ...(existing.stages || {}),
    [section as string]: {
      statut: (data.statut as string) || existing.statut || '',
      date: stageDate,
      updatedAt: new Date(),
    },
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Appliquer le rate limiting
  const rateLimitResult = await clientRateLimit(request as any);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const data = await request.json();

    const Model =
      mongoose.models[clientCollectionName] ||
      mongoose.model(clientCollectionName, ClientSchema, clientCollectionName);

    const existing = await Model.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const payload = { ...data };
    if (payload.section === 'consuel-en-cours' && payload.etatActuel === 'Consuel Visé') {
      payload.section = 'consuel-finalise';
    }
    if (payload.section === 'raccordement' && payload.raccordement === 'Mise en service') {
      payload.section = 'raccordement-mes';
    }

    const updatedStages = buildStageUpdate(payload, existing as ExistingDocument);
    const updated = await Model.findByIdAndUpdate(
      id,
      { ...payload, stages: updatedStages },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Si le client est dans dp-accordes avec statut Accord tacite ou Accord favorable,
    // créer une copie dans installation
    const newSection = data.section || (existing as ExistingDocument).section;
    const newStatut = data.statut || (existing as ExistingDocument).statut;
    const newPvChantier =
      (data.pvChantier as string) ||
      (updated as any).pvChantier ||
      (existing as any).pvChantier;
    const clientId =
      data.clientId ||
      (updated as any).clientId ||
      (existing as any).clientId;

    if (
      newSection === 'dp-accordes' &&
      (newStatut === 'Accord tacite' || newStatut === 'Accord favorable')
    ) {
      try {
        const installationQuery: Record<string, unknown> = {
          section: 'installation',
        };
        if (clientId) {
          installationQuery.clientId = clientId;
        } else {
          installationQuery.client = (existing as ExistingDocument).client;
        }

        const existingInInstallation = await Model.findOne(installationQuery).lean();

        if (!existingInInstallation) {
          const installationPayload = {
            ...updated.toObject(),
            _id: undefined,
            section: 'installation',
            dateEstimative: '', // Vider la date de pose lors du passage en Installation
            stages: {
              ...updated.stages,
              installation: {
                statut: 'En cours',
                date: new Date().toISOString(),
                updatedAt: new Date(),
              },
            },
          };
          await Model.create(installationPayload);
        }
      } catch (installError: unknown) {
        // Ne pas bloquer la copie vers installation si elle échoue
        console.error(
          'Erreur lors de la copie vers installation:',
          installError
        );
      }
    }

    if (
      updated.section === 'installation' &&
      newPvChantier === 'Reçu'
    ) {
      try {
        const consuelQuery: Record<string, unknown> = {
          section: 'consuel-en-cours',
        };
        if (clientId) {
          consuelQuery.clientId = clientId;
        } else {
          consuelQuery.client = (existing as ExistingDocument).client;
        }

        const existingInConsuel = await Model.findOne(consuelQuery).lean();
        if (!existingInConsuel) {
          const consuelPayload = {
            ...updated.toObject(),
            _id: undefined,
            section: 'consuel-en-cours',
            stages: {
              ...updated.stages,
              'consuel-en-cours': {
                statut: updated.statut || 'En cours',
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

      try {
        const daactQuery: Record<string, unknown> = { section: 'daact' };
        if (clientId) {
          daactQuery.clientId = clientId;
        } else {
          daactQuery.client = (existing as ExistingDocument).client;
        }

        const existingInDaact = await Model.findOne(daactQuery).lean();
        if (!existingInDaact) {
          const daactPayload = {
            ...updated.toObject(),
            _id: undefined,
            section: 'daact',
            statut: 'DAACT à faire',
            stages: {
              ...updated.stages,
              daact: {
                statut: 'DAACT à faire',
                date: new Date().toISOString(),
                updatedAt: new Date(),
              },
            },
          };
          await Model.create(daactPayload);
        }
      } catch (copyError: unknown) {
        console.error('Erreur lors de la copie vers DAACT:', copyError);
      }
    }

    if (
      newSection === 'consuel-en-cours' &&
      newPvChantier === 'Reçu'
    ) {
      try {
        const query: Record<string, unknown> = { section: 'daact' };
        if (clientId) {
          query.clientId = clientId;
        } else {
          query.client = (existing as ExistingDocument).client;
        }

        const existingInDaact = await Model.findOne(query).lean();
        if (!existingInDaact) {
          const daactPayload = {
            ...updated.toObject(),
            _id: undefined,
            section: 'daact',
            statut: 'DAACT à faire',
            stages: {
              ...updated.stages,
              daact: {
                statut: 'DAACT à faire',
                date: new Date().toISOString(),
                updatedAt: new Date(),
              },
            },
          };
          await Model.create(daactPayload);
        }
      } catch (copyError: unknown) {
        console.error('Erreur lors de la copie vers DAACT:', copyError);
      }
    }

    if (
      updated.section === 'consuel-finalise' &&
      (data.etatActuel === 'Consuel Visé' ||
        updated.etatActuel === 'Consuel Visé')
    ) {
      try {
        const query: Record<string, unknown> = { section: 'raccordement' };
        if (clientId) {
          query.clientId = clientId;
        } else {
          query.client = (existing as ExistingDocument).client;
        }

        const existingInRaccordement = await Model.findOne(query).lean();
        if (!existingInRaccordement) {
          const raccordementPayload = {
            ...updated.toObject(),
            _id: undefined,
            section: 'raccordement',
            statut: 'Raccordement à faire',
            raccordement: 'Demande transmise',
            stages: {
              ...updated.stages,
              raccordement: {
                statut: 'Raccordement à faire',
                date: new Date().toISOString(),
                updatedAt: new Date(),
              },
            },
          };
          await Model.create(raccordementPayload);
        }
      } catch (copyError: unknown) {
        console.error('Erreur lors de la copie vers raccordement:', copyError);
      }
    }

    if (
      updated.section === 'raccordement' &&
      (data.raccordement === 'Mise en service' ||
        updated.raccordement === 'Mise en service')
    ) {
      try {
        const query: Record<string, unknown> = {
          section: 'raccordement-mes',
        };
        if (clientId) {
          query.clientId = clientId;
        } else {
          query.client = (existing as ExistingDocument).client;
        }

        const existingInMes = await Model.findOne(query).lean();
        if (!existingInMes) {
          const mesPayload = {
            ...updated.toObject(),
            _id: undefined,
            section: 'raccordement-mes',
            statut: updated.statut || updated.raccordement || 'Mise en service',
            dateMiseEnService:
              updated.dateMiseEnService || new Date().toISOString(),
            stages: {
              ...updated.stages,
              'raccordement-mes': {
                statut: updated.statut || updated.raccordement || 'Mise en service',
                date:
                  updated.dateMiseEnService || new Date().toISOString(),
                updatedAt: new Date(),
              },
            },
          };
          await Model.create(mesPayload);
        }
      } catch (copyError: unknown) {
        console.error('Erreur lors de la copie vers Raccordement MES:', copyError);
      }
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Appliquer le rate limiting
  const rateLimitResult = await clientRateLimit(request as any);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const data = await request.json();

    const Model =
      mongoose.models[clientCollectionName] ||
      mongoose.model(clientCollectionName, ClientSchema, clientCollectionName);

    const existing = await Model.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const payload = { ...data };

    // DP EN COURS transitions
    if (payload.section === 'dp-en-cours') {
      if (payload.statut === 'Accord favorable' || payload.statut === 'Accord tacite') {
        payload.section = 'dp-accordes';
      } else if (payload.statut === 'Refus') {
        payload.section = 'dp-refuses';
      }
    }

    // INSTALLATION transitions
    if (payload.section === 'installation' && payload.pvChantier === 'Reçu') {
      payload.section = 'daact';
    }

    // CONSUEL EN COURS transitions
    if (payload.section === 'consuel-en-cours' && payload.etatActuel === 'Consuel Visé') {
      payload.section = 'consuel-finalise';
    }

    // RACCORDEMENT transitions
    if (payload.section === 'raccordement' && payload.raccordement === 'Mise en service') {
      payload.section = 'raccordement-mes';
    }

    const updatedStages = buildStageUpdate(payload, existing as ExistingDocument);
    const updated = await Model.findByIdAndUpdate(
      id,
      { ...payload, stages: updatedStages },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Si le client est dans dp-accordes avec statut Accord tacite ou Accord favorable,
    // créer une copie dans installation
    const newSection = data.section || (existing as ExistingDocument).section;
    const newStatut = data.statut || (existing as ExistingDocument).statut;
    const clientId =
      data.clientId ||
      (updated as any).clientId ||
      (existing as any).clientId;

    if (
      newSection === 'dp-accordes' &&
      (newStatut === 'Accord tacite' || newStatut === 'Accord favorable')
    ) {
      try {
        const installationQuery: Record<string, unknown> = {
          section: 'installation',
        };
        if (clientId) {
          installationQuery.clientId = clientId;
        } else {
          installationQuery.client = (existing as ExistingDocument).client;
        }

        const existingInInstallation = await Model.findOne(installationQuery).lean();

        if (!existingInInstallation) {
          const installationPayload = {
            ...updated.toObject(),
            _id: undefined,
            section: 'installation',
            dateEstimative: '', // Vider la date de pose lors du passage en Installation
            stages: {
              ...updated.stages,
              installation: {
                statut: 'En cours',
                date: new Date().toISOString(),
                updatedAt: new Date(),
              },
            },
          };
          await Model.create(installationPayload);
        }
      } catch (installError: unknown) {
        // Ne pas bloquer la mise à jour principale si la copie échoue
        console.error(
          'Erreur lors de la copie vers installation:',
          installError
        );
      }
    }

    if (
      updated.section === 'consuel-finalise' &&
      (data.etatActuel === 'Consuel Visé' ||
        updated.etatActuel === 'Consuel Visé')
    ) {
      try {
        const query: Record<string, unknown> = { section: 'raccordement' };
        if (clientId) {
          query.clientId = clientId;
        } else {
          query.client = (existing as ExistingDocument).client;
        }

        const existingInRaccordement = await Model.findOne(query).lean();
        if (!existingInRaccordement) {
          const raccordementPayload = {
            ...updated.toObject(),
            _id: undefined,
            section: 'raccordement',
            statut: 'Raccordement à faire',
            raccordement: 'Demande transmise',
            stages: {
              ...updated.stages,
              raccordement: {
                statut: 'Raccordement à faire',
                date: new Date().toISOString(),
                updatedAt: new Date(),
              },
            },
          };
          await Model.create(raccordementPayload);
        }
      } catch (copyError: unknown) {
        console.error('Erreur lors de la copie vers raccordement:', copyError);
      }
    }

    if (
      updated.section === 'raccordement' &&
      (data.raccordement === 'Mise en service' ||
        updated.raccordement === 'Mise en service')
    ) {
      try {
        const query: Record<string, unknown> = {
          section: 'raccordement-mes',
        };
        if (clientId) {
          query.clientId = clientId;
        } else {
          query.client = (existing as ExistingDocument).client;
        }

        const existingInMes = await Model.findOne(query).lean();
        if (!existingInMes) {
          const mesPayload = {
            ...updated.toObject(),
            _id: undefined,
            section: 'raccordement-mes',
            statut: updated.statut || updated.raccordement || 'Mise en service',
            dateMiseEnService:
              updated.dateMiseEnService || new Date().toISOString(),
            stages: {
              ...updated.stages,
              'raccordement-mes': {
                statut: updated.statut || updated.raccordement || 'Mise en service',
                date:
                  updated.dateMiseEnService || new Date().toISOString(),
                updatedAt: new Date(),
              },
            },
          };
          await Model.create(mesPayload);
        }
      } catch (copyError: unknown) {
        console.error('Erreur lors de la copie vers Raccordement MES:', copyError);
      }
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Appliquer le rate limiting
  const rateLimitResult = await clientRateLimit(request as any);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    await connectToDatabase();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erreur de connexion à la base de données';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  const { id } = await params;

  const Model =
    mongoose.models[clientCollectionName] ||
    mongoose.model(clientCollectionName, ClientSchema, clientCollectionName);

  try {
    const deleted = await Model.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur lors de la suppression';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
