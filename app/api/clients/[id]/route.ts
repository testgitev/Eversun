import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongo';
import mongoose from 'mongoose';
import { ClientSchema } from '@/lib/clientModel';
import { clientCollectionName } from '@/lib/sectionConfig';

function buildStageUpdate(data: any, existing: any) {
  const section = data.section || existing.section;
  const stageDate =
    data.dateEnvoi ||
    data.dateDerniereDemarche ||
    data.dateMiseEnService ||
    data.datePV ||
    data.pvChantierDate ||
    '';

  return {
    ...(existing.stages || {}),
    [section]: {
      statut: data.statut || existing.statut || '',
      date: stageDate,
      updatedAt: new Date(),
    },
  };
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const updatedStages = buildStageUpdate(data, existing);
    const updated = await Model.findByIdAndUpdate(
      id,
      { ...data, stages: updatedStages },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const updatedStages = buildStageUpdate(data, existing);
    const updated = await Model.findByIdAndUpdate(
      id,
      { ...data, stages: updatedStages },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connectToDatabase();
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
  } catch (e) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
