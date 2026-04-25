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
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }
    if (!data.section) {
      return NextResponse.json({ error: 'Section is required' }, { status: 400 });
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

    const clientRecords = await Model.find().sort({ client: 1 }).lean();
    return NextResponse.json({ data: clientRecords });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: error.message },
      { status: 500 }
    );
  }
}
