import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongo';
import mongoose from 'mongoose';
import { ClientSchema } from '@/lib/clientModel';
import { clientSchema } from '@/lib/validation';
import { clientCollectionName } from '@/lib/sectionConfig';


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
    'PV Chantier': 'pvChantierDate',
    'Date PV': 'datePV',
    'Cause de non présence Consuel': 'causeNonPresence',
    Prestataire: 'prestataire',
    'Etat Actuel': 'etatActuel',
    'Type de consuel demandé': 'typeConsuel',
    'Date dernière démarche': 'dateDerniereDemarche',
    Commentaires: 'commentaires',
    'Date Estimatives': 'dateEstimative',
    Raccordement: 'raccordement',
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
  mapped.pvChantierDate = convertFrenchDateToISO(mapped.pvChantierDate);
  mapped.datePV = convertFrenchDateToISO(mapped.datePV);
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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const section = url.searchParams.get('section');
    const skip = (page - 1) * limit;
    const query: any = {};

    if (section) {
      query.section = section;
    }

    try {
      const Model =
        mongoose.models[clientCollectionName] ||
        mongoose.model(clientCollectionName, ClientSchema, clientCollectionName);

      const totalCount = await Model.countDocuments(query);
      const docs = await Model.find(query).skip(skip).limit(limit).lean();

      const allClients = docs.map((doc) => mapImportedFields(doc));

      return NextResponse.json({
        data: allClients,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Erreur MongoDB lors de la récupération des clients`,
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
        mongoose.model(clientCollectionName, ClientSchema, clientCollectionName);

      const stageDate =
        data.dateEnvoi ||
        data.dateDerniereDemarche ||
        data.dateMiseEnService ||
        data.datePV ||
        data.pvChantierDate ||
        '';

      const createPayload = {
        ...data,
        stages: {
          [data.section]: {
            statut: data.statut || '',
            date: stageDate,
            updatedAt: new Date(),
          },
        },
      };

      const client = await Model.create(createPayload);

      return NextResponse.json(client);
    } catch (err: any) {
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



