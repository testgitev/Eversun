import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ClientFile from '@/lib/clientFileModel';
import { ClientModel as Client } from '@/lib/clientModel';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eversun';

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  await mongoose.connect(MONGODB_URI);
}

// Helper to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const clientName = formData.get('clientName') as string;
    const section = formData.get('section') as string;
    const files = formData.getAll('files') as File[];

    if (!clientName || !section || files.length === 0) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find client by name and section, or create if doesn't exist
    let client = await Client.findOne({ 
      client: clientName,
      section: section 
    });

    if (!client) {
      // Create client if it doesn't exist
      client = await Client.create({
        client: clientName,
        section: section,
      });
    }

    // Convert files to base64 and store in clients_files collection
    const uploadedFiles = [];
    
    for (const file of files) {
      const base64Data = await fileToBase64(file);
      const fileRecord = await ClientFile.create({
        clientId: client._id,
        clientName: clientName,
        section: section,
        fileName: file.name,
        fileData: base64Data,
        fileSize: file.size,
        fileType: file.type,
      });
      
      uploadedFiles.push({
        id: fileRecord._id.toString(),
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload des fichiers' },
      { status: 500 }
    );
  }
}
