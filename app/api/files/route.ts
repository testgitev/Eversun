import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const DRIVE_FOLDER_ID = '1HUKQRoSM6ndKV2YPd9dGR0lnUzqTqu9B';

async function getDriveClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  });

  return google.drive({ version: 'v3', auth });
}

async function findClientFolder(drive: any, clientName: string) {
  try {
    const sanitizedFolderName = clientName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();

    const response = await drive.files.list({
      q: `name = '${sanitizedFolderName}' and '${DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    return null;
  } catch (error) {
    console.error('Erreur lors de la recherche du dossier client:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientName = searchParams.get('clientName');

    if (!clientName) {
      return NextResponse.json(
        { error: 'Nom du client manquant' },
        { status: 400 }
      );
    }

    // Vérifier si les credentials Google Drive sont configurés
    if (!process.env.GOOGLE_DRIVE_CLIENT_ID || !process.env.GOOGLE_DRIVE_CLIENT_SECRET) {
      // Mode de développement: retourner des fichiers simulés
      console.warn('Google Drive credentials non configurés, mode simulation activé');
      
      return NextResponse.json({
        success: true,
        files: [],
        message: 'Mode simulation: Configurez GOOGLE_DRIVE_CLIENT_ID et GOOGLE_DRIVE_CLIENT_SECRET pour lister les fichiers réels',
      });
    }

    // Mode production: lister les fichiers réels
    const drive = await getDriveClient();
    const clientFolderId = await findClientFolder(drive, clientName);

    if (!clientFolderId) {
      return NextResponse.json({
        success: true,
        files: [],
      });
    }

    const response = await drive.files.list({
      q: `'${clientFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, webViewLink, size, mimeType, createdTime)',
    });

    const files = response.data.files?.map((file: any) => ({
      id: file.id,
      name: file.name,
      url: file.webViewLink,
      size: parseInt(file.size || '0'),
      type: file.mimeType,
      created: file.createdTime,
    })) || [];

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fichiers' },
      { status: 500 }
    );
  }
}
