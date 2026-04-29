import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongo';
import mongoose from 'mongoose';
import { ClientSchema } from '@/lib/clientModel';
import { clientCollectionName } from '@/lib/sectionConfig';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    if (!data.client) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }
    if (!data.section) {
      return NextResponse.json(
        { error: 'Section is required' },
        { status: 400 }
      );
    }

    const Model =
      mongoose.models[clientCollectionName] ||
      mongoose.model(clientCollectionName, ClientSchema, clientCollectionName);

    const existing = await Model.findOne({ client: data.client });
    if (!existing) {
      const clientRecord = new Model({
        ...data,
        stages: {},
      });
      await clientRecord.save();
      return NextResponse.json({ success: true, data: clientRecord });
    }

    const stageDate =
      data.dateEnvoi ||
      data.dateDerniereDemarche ||
      data.dateMiseEnService ||
      data.datePV ||
      data.pvChantierDate ||
      '';

    const updatedStages = {
      ...(existing.stages || {}),
      [data.section]: {
        statut: data.statut || '',
        date: stageDate,
        updatedAt: new Date(),
      },
    };

    existing.stages = updatedStages;
    if (data.ville) existing.ville = data.ville;
    if (data.noDp) existing.noDp = data.noDp;
    await existing.save();

    return NextResponse.json({ success: true, data: existing });
  } catch (error: any) {
    console.error('Error syncing client data:', error);
    return NextResponse.json(
      { error: 'Failed to sync client data', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const clientName = searchParams.get('client');

    const Model =
      mongoose.models[clientCollectionName] ||
      mongoose.model(clientCollectionName, ClientSchema, clientCollectionName);

    if (clientName) {
      const clientRecord = await Model.findOne({ client: clientName }).lean();
      return NextResponse.json({ data: clientRecord });
    }

    // Agréger les clients par nom pour avoir une seule ligne par client
    const clientRecords = await Model.find().sort({ client: 1 }).lean();
    
    // Regrouper par nom de client
    const groupedClients: Record<string, any> = {};
    
    clientRecords.forEach((record: any) => {
      const name = record.client;
      
      if (!groupedClients[name]) {
        groupedClients[name] = {
          client: name,
          ville: record.ville,
          prestataire: record.prestataire,
          financement: record.financement,
          stages: {},
        };
      }
      
      // Fusionner les stages de toutes les sections
      if (record.stages) {
        groupedClients[name].stages = {
          ...groupedClients[name].stages,
          ...record.stages,
        };
      }
      
      // Ajouter la section actuelle comme stage
      if (record.section) {
        // Déterminer le bon statut selon la section
        let stageStatut = record.statut || '';
        if (record.section.startsWith('consuel') && !stageStatut && record.etatActuel) {
          stageStatut = record.etatActuel;
        } else if (record.section.startsWith('raccordement') && record.raccordement) {
          stageStatut = record.raccordement;
        }

        groupedClients[name].stages[record.section] = {
          statut: stageStatut,
          raccordement: record.raccordement,
          date: record.dateEnvoi || record.dateDerniereDemarche || '',
          noDp: record.noDp,
          financement: record.financement,
          typeConsuel: record.typeConsuel,
          updatedAt: record.updatedAt,
        };
      }
      
      // Conserver les infos les plus récentes
      if (record.ville) groupedClients[name].ville = record.ville;
      if (record.financement) groupedClients[name].financement = record.financement;
    });
    
    const aggregatedData = Object.values(groupedClients);
    
    return NextResponse.json({ data: aggregatedData });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: error.message },
      { status: 500 }
    );
  }
}
