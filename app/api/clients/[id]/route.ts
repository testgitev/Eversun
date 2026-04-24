import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongo';
import mongoose from 'mongoose';
import { ClientSchema } from '@/lib/clientModel';
import { hashPassword } from '@/lib/password';

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


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const url = new URL(request.url);
    const section = url.searchParams.get('section');
    
    console.log('PUT request received:', { id, section });

    const collection =
      sectionToCollection[section as keyof typeof sectionToCollection];
    if (!collection) {
      console.error('Section inconnue:', section);
      return NextResponse.json({ error: 'Section inconnue' }, { status: 400 });
    }

    console.log('Using collection:', collection);

    const Model =
      mongoose.models[collection] ||
      mongoose.model(collection, ClientSchema, collection);
    const data = await request.json();

    console.log('Data to update:', data);


    try {
      // Ne pas hasher le mot de passe - stocker en clair pour affichage

      const updated = await Model.findByIdAndUpdate(id, data, { new: true });
      if (!updated) {
        console.error('Client non trouvé:', id);
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
      }
      console.log('Client updated successfully:', updated);

      // Sync to clients aggregation collection
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clients/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, section }),
        });
      } catch (syncError) {
        console.error('Failed to sync to clients aggregation:', syncError);
      }

      return NextResponse.json(updated);
    } catch (e: any) {
      console.error('Erreur lors de la modification:', e);

      return NextResponse.json(
        { error: 'Erreur lors de la modification', details: e?.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur serveur:', error);

    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const url = new URL(request.url);
    const section = url.searchParams.get('section');
    
    console.log('PATCH request received:', { id, section });

    const collection =
      sectionToCollection[section as keyof typeof sectionToCollection];
    if (!collection) {
      console.error('Section inconnue:', section);
      return NextResponse.json({ error: 'Section inconnue' }, { status: 400 });
    }

    console.log('Using collection:', collection);

    const Model =
      mongoose.models[collection] ||
      mongoose.model(collection, ClientSchema, collection);
    const data = await request.json();

    console.log('Data to update:', data);


    try {
      // Ne pas hasher le mot de passe - stocker en clair pour affichage

      const updated = await Model.findByIdAndUpdate(id, data, { new: true });
      if (!updated) {
        console.error('Client non trouvé:', id);
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
      }
      console.log('Client updated successfully:', updated);

      // Sync to clients aggregation collection
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clients/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, section }),
        });
      } catch (syncError) {
        console.error('Failed to sync to clients aggregation:', syncError);
      }

      return NextResponse.json(updated);
    } catch (e: any) {
      console.error('Erreur lors de la modification:', e);

      return NextResponse.json(
        { error: 'Erreur lors de la modification', details: e?.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur serveur:', error);

    return NextResponse.json(
      { error: 'Erreur serveur', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDatabase();
  const { id } = await params;
  // On attend section en query string
  const url = new URL(request.url);
  const section = url.searchParams.get('section');
  const collection =
    sectionToCollection[section as keyof typeof sectionToCollection];
  if (!collection) {
    return NextResponse.json({ error: 'Section inconnue' }, { status: 400 });
  }
  const Model =
    mongoose.models[collection] ||
    mongoose.model(collection, ClientSchema, collection);
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
