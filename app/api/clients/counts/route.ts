import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongo';
import mongoose from 'mongoose';
import { ClientSchema } from '@/lib/clientModel';
import { clientCollectionName } from '@/lib/sectionConfig';

export const revalidate = 30; // Cache 30 secondes
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'MONGODB_URI not configured' },
        { status: 500 }
      );
    }
    await connectToDatabase();

    const Model =
      mongoose.models[clientCollectionName] ||
      mongoose.model(clientCollectionName, ClientSchema, clientCollectionName);

    const aggregation = await Model.aggregate([
      {
        $group: {
          _id: '$section',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts: Record<string, number> = {};
    aggregation.forEach((group: any) => {
      counts[group._id || 'unknown'] = group.count;
    });

    return NextResponse.json({ counts });
  } catch (error: any) {
    console.error('Error fetching section counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section counts', details: error.message },
      { status: 500 }
    );
  }
}
