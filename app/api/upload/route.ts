import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Configuration Google Drive
const DRIVE_FOLDER_ID = '1HUKQRoSM6ndKV2YPd9dGR0lnUzqTqu9B';

// Pour utiliser l'API Google Drive, vous devez configurer les credentials
// Variables d'environnement requises:
// GOOGLE_DRIVE_CLIENT_ID
// GOOGLE_DRIVE_CLIENT_SECRET
// GOOGLE_DRIVE_REDIRECT_URI
// GOOGLE_DRIVE_REFRESH_TOKEN

// Pour l'instant, nous allons utiliser une approche avec un service account ou OAuth2
// Cette implementation est un template qui doit être configuré avec vos credentials Google

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

async function findOrCreateClientFolder(drive: any, clientName: string) {
  try {
    // Nettoyer le nom du client pour le nom de dossier
    const sanitizedFolderName = clientName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();

    // Chercher si le dossier client existe déjà
    const response = await drive.files.list({
      q: `name = '${sanitizedFolderName}' and '${DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Créer le dossier s'il n'existe pas
    const folderMetadata = {
      name: sanitizedFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [DRIVE_FOLDER_ID],
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id',
    });

    return folder.data.id;
  } catch (error) {
    console.error('Erreur lors de la création/recherche du dossier client:', error);
    throw new Error('Impossible de créer ou trouver le dossier client');
  }
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

    // Vérifier si les credentials Google Drive sont configurés
    if (!process.env.GOOGLE_DRIVE_CLIENT_ID || !process.env.GOOGLE_DRIVE_CLIENT_SECRET) {
      // Mode de développement: simuler l'upload
      console.warn('Google Drive credentials non configurés, mode simulation activé');
      
      const uploadedFiles = files.map((file, index) => ({
        id: `simulated-${Date.now()}-${index}`,
        name: file.name,
        url: `https://drive.google.com/file/d/simulated-${Date.now()}-${index}/view`,
        size: file.size,
        type: file.type,
      }));

      return NextResponse.json({
        success: true,
        files: uploadedFiles,
        message: 'Mode simulation: Configurez GOOGLE_DRIVE_CLIENT_ID et GOOGLE_DRIVE_CLIENT_SECRET pour l\'upload réel',
      });
    }

    // Mode production: upload réel vers Google Drive
    const drive = await getDriveClient();
    const clientFolderId = await findOrCreateClientFolder(drive, clientName);

    const uploadedFiles = [];

    for (const file of files) {
      const fileMetadata = {
        name: file.name,
        parents: [clientFolderId],
      };

      const media = {
        mimeType: file.type,
        body: file.stream(),
      };

      const uploadedFile = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, size',
      });

      // Rendre le fichier accessible
      await drive.permissions.create({
        fileId: uploadedFile.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      uploadedFiles.push({
        id: uploadedFile.data.id,
        name: uploadedFile.data.name,
        url: uploadedFile.data.webViewLink,
        size: parseInt(uploadedFile.data.size || '0'),
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
