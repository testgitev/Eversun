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

function buildStageUpdate(data: Record<string, unknown>, existing: ExistingDocument) {
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

    const updatedStages = buildStageUpdate(data, existing as ExistingDocument);
    const updated = await Model.findByIdAndUpdate(
      id,
      { ...data, stages: updatedStages },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Si le client est dans dp-accordes avec statut Accord tacite ou Accord favorable,
    // créer une copie dans installation
    const newSection = data.section || (existing as ExistingDocument).section;
    const newStatut = data.statut || (existing as ExistingDocument).statut;
    if (
      newSection === 'dp-accordes' &&
      (newStatut === 'Accord tacite' || newStatut === 'Accord favorable')
    ) {
      try {
        // Vérifier si une copie existe déjà dans installation
        const existingInInstallation = await Model.findOne({
          client: (existing as ExistingDocument).client,
          section: 'installation',
        }).lean();

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
        console.error('Erreur lors de la copie vers installation:', installError);
      }
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
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

    const updatedStages = buildStageUpdate(data, existing as ExistingDocument);
    const updated = await Model.findByIdAndUpdate(
      id,
      { ...data, stages: updatedStages },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Si le client est dans dp-accordes avec statut Accord tacite ou Accord favorable,
    // créer une copie dans installation
    const newSection = data.section || (existing as ExistingDocument).section;
    const newStatut = data.statut || (existing as ExistingDocument).statut;
    if (
      newSection === 'dp-accordes' &&
      (newStatut === 'Accord tacite' || newStatut === 'Accord favorable')
    ) {
      try {
        // Vérifier si une copie existe déjà dans installation
        const existingInInstallation = await Model.findOne({
          client: (existing as ExistingDocument).client,
          section: 'installation',
        }).lean();

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
        console.error('Erreur lors de la copie vers installation:', installError);
      }
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
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
    const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion à la base de données';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
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
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
