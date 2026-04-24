import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongo';
import mongoose from 'mongoose';
import { ClientSchema } from '@/lib/clientModel';
import { clientSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/password';


/**
 * Fonction de mappage pour transformer les champs français en anglais
 * Utilisée pour les données importées depuis un fichier Excel/CSV
 */
function mapImportedFields(doc: any): any {
  const fieldMapping: Record<string, string> = {
    Client: 'client',
    Nom: 'client',
    nom: 'client',
    'Date d\'envoi DP': 'dateEnvoi',
    'Attente DP': 'dateEstimative',
    Presta: 'prestataire',
    Financement: 'financement',
    Status: 'statut',
    'Numéro DP': 'noDp',
    Ville: 'ville',
    'Site DP': 'portail',
    'Email utilisé': 'identifiant',
    'Mot de passe': 'motDePasse',
    'PV Chantier': 'pvChantier',
    'Cause de non présence Consuel': 'causeNonPresence',
    Prestataire: 'prestataire',
    'Etat Actuel': 'etatActuel',
    'Type de consuel demandé': 'typeConsuel',
    'Date dernière démarche': 'dateDerniereDemarche',
    Commentaires: 'commentaires',
    'Date Estimatives': 'dateEstimative',
    'Raccordement': 'raccordement',

    'Numéro de contrat': 'numeroContrat',
    'Date de Mise en service raccordement': 'dateMiseEnService',
  };

  const mapped: any = { ...doc };

  // Mapper les champs français vers anglais
  for (const [frenchKey, englishKey] of Object.entries(fieldMapping)) {
    if (mapped[frenchKey] !== undefined) {
      mapped[englishKey] = mapped[frenchKey];
      delete mapped[frenchKey];
    }
  }

  // Convertir les dates du format français (DD/MM/YYYY) au format ISO
  const convertFrenchDateToISO = (dateStr: string | undefined): string | undefined => {
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

  mapped.dateEnvoi = convertFrenchDateToISO(mapped.dateEnvoi);
  mapped.dateEstimative = convertFrenchDateToISO(mapped.dateEstimative);
  mapped.pvChantier = convertFrenchDateToISO(mapped.pvChantier);
  mapped.dateDerniereDemarche = convertFrenchDateToISO(mapped.dateDerniereDemarche);
  mapped.dateMiseEnService = convertFrenchDateToISO(mapped.dateMiseEnService);

  // Si pas de section, déterminer selon le statut
  if (!mapped.section) {
    if (mapped.statut === 'Accord favorable') {
      mapped.section = 'dp-accordes';
    } else if (mapped.statut === 'Refus') {
      mapped.section = 'dp-refuses';
    } else if (mapped.statut === 'ABF') {
      mapped.section = 'dp-en-cours';
    } else {
      mapped.section = 'dp-en-cours';
    }
  }


  return mapped;
}

export async function GET(request: Request) {
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
    const limit = parseInt(url.searchParams.get('limit') || '10000');
    const section = url.searchParams.get('section');
    const skip = (page - 1) * limit;

    const collections = [
      { section: 'dp-en-cours', name: 'dp_in_progress' },
      { section: 'dp-accordes', name: 'dp_received' },
      { section: 'dp-refuses', name: 'dp_ko' },
      { section: 'daact', name: 'daact' },
      { section: 'installation', name: 'installations' },
      { section: 'consuel-en-cours', name: 'consuel_in_progress' },
      { section: 'consuel-finalise', name: 'consuel_finalised' },
      { section: 'raccordement', name: 'raccordement' },
      { section: 'raccordement-mes', name: 'raccordement_finalised' },
    ];

    // Filtrer par section si spécifié
    const collectionsToQuery = section
      ? collections.filter((col) => col.section === section)
      : collections;

    let allClients: any[] = [];
    let totalCount = 0;

    for (const col of collectionsToQuery) {
      try {
        const Model =
          mongoose.models[col.name] ||
          mongoose.model(col.name, ClientSchema, col.name);

        // Compter le total pour cette collection
        const count = await Model.countDocuments();
        totalCount += count;

        // Récupérer les documents avec pagination
        const docs = await Model.find().skip(skip).limit(limit).lean();

        allClients = allClients.concat(
          docs.map((doc) => {
            const mapped = mapImportedFields(doc);
            return { ...mapped, section: col.section };
          })
        );
      } catch (err: any) {
        return NextResponse.json(
          {
            error: `Erreur MongoDB sur la collection ${col.name}`,
            details: err?.message || err,
          },
          { status: 500 }
        );
      }
    }


    return NextResponse.json({
      data: allClients,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: error?.message || 'Erreur serveur', stack: error?.stack },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.MONGODB_URI) {

      return NextResponse.json(
        { error: 'MONGODB_URI not configured' },
        { status: 500 }
      );
    }
    await connectToDatabase();
    const data = await request.json();
    console.log('POST request received with data:', data);

    // Validation Zod
    const parseResult = clientSchema.safeParse(data);
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.issues);

      return NextResponse.json(
        { error: 'Validation échouée', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const sectionToCollection = {
      'dp-en-cours': 'dp_in_progress',
      'dp-accordes': 'dp_received',
      'dp-refuses': 'dp_ko',
      daact: 'daact',
      installation: 'installations',
      'consuel-en-cours': 'consuel_in_progress',
      'consuel-finalise': 'consuel_finalised',
      raccordement: 'raccordement',
      'raccordement-mes': 'raccordement_finalised',
    };
    const collection =
      sectionToCollection[data.section as keyof typeof sectionToCollection];
    if (!collection) {
      return NextResponse.json({ error: 'Section inconnue' }, { status: 400 });
    }

    try {
      // Delete cached model to force schema reload
      const models = mongoose.models as any;
      if (models[collection]) {
        delete models[collection];
        delete (mongoose.connection.models as any)[collection];
      }
      const Model = mongoose.model(collection, ClientSchema, collection);
      console.log('Creating client in collection:', collection, 'with data:', data);
      const client = await Model.create(data);
      console.log('Client created successfully:', client);

      // Sync to clients aggregation collection
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clients/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (syncError) {
        console.error('Failed to sync to clients aggregation:', syncError);
      }

      return NextResponse.json(client);
    } catch (err: any) {
      console.error('Erreur MongoDB lors de la création:', err);

      return NextResponse.json(
        {
          error: `Erreur MongoDB lors de la création`,
          details: err?.message || err,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {

    return NextResponse.json(
      { error: error?.message || 'Erreur serveur', stack: error?.stack },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'MONGODB_URI not configured' },
        { status: 500 }
      );
    }
    await connectToDatabase();
    const data = await request.json();
    const url = new URL(request.url);
    const section = url.searchParams.get('section');

    const sectionToCollection = {
      'dp-en-cours': 'dp_in_progress',
      'dp-accordes': 'dp_received',
      'dp-refuses': 'dp_ko',
      daact: 'daact',
      installation: 'installations',
      'consuel-en-cours': 'consuel_in_progress',
      'consuel-finalise': 'consuel_finalised',
      raccordement: 'raccordement',
      'raccordement-mes': 'raccordement_finalised',
    };
    const collection = section
      ? sectionToCollection[section as keyof typeof sectionToCollection]
      : null;
    if (!collection) {
      return NextResponse.json({ error: 'Section inconnue' }, { status: 400 });
    }

    try {
      const Model =
        mongoose.models[collection] ||
        mongoose.model(collection, ClientSchema, collection);
      const updated = await Model.findByIdAndUpdate(params.id, data, { new: true });
      return NextResponse.json(updated);
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Erreur MongoDB lors de la mise à jour`,
          details: err?.message || err,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur', stack: error?.stack },
      { status: 500 }
    );
  }
}


