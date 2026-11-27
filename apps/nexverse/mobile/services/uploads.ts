import { getApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { nexverseApiRequest } from './moderation';

export type UploadAssetType = 'manuscript' | 'cover' | 'attachment';
export type LocalUploadAsset = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};
export type UploadLibraryItem = {
  id: string;
  assetType: UploadAssetType;
  filename: string;
  contentType: string;
  expectedSizeBytes: number;
  uploadedSizeBytes: number | null;
  checksum: string | null;
  storagePath: string;
  status: 'created' | 'uploaded' | 'expired' | 'rejected' | 'processing' | 'ready' | 'failed';
  expiresAt: string;
  createdAt: string;
  uploadedAt: string | null;
  processingMetadata: Record<string, string | number | boolean>;
  processingError: string | null;
  processedAt: string | null;
};

export type UploadLibraryResponse = {
  items: UploadLibraryItem[];
  counts: Record<'created' | 'uploaded' | 'expired' | 'rejected' | 'processing' | 'ready' | 'failed', number>;
  limit: number;
};

export function getCreatorUploadLibrary(workId: string, filters: { assetType?: UploadAssetType; status?: UploadLibraryItem['status'] } = {}) {
  const params = new URLSearchParams();
  if (filters.assetType) params.set('assetType', filters.assetType);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return nexverseApiRequest<UploadLibraryResponse>(
    '/nexverse/creator/works/' + encodeURIComponent(workId) + '/uploads/' + (query ? '?' + query : ''),
  );
}

export type UploadSession = {
  id: string;
  assetType: UploadAssetType;
  filename: string;
  contentType: string;
  expectedSizeBytes: number;
  storagePath: string;
  status: 'created' | 'uploaded' | 'expired' | 'rejected';
  expiresAt: string;
};

export async function uploadCreatorAsset(
  workId: string,
  assetType: UploadAssetType,
  asset: LocalUploadAsset,
  onProgress: (progress: number) => void,
): Promise<UploadSession> {
  const session = await nexverseApiRequest<UploadSession>(
    '/nexverse/creator/works/' + encodeURIComponent(workId) + '/uploads/',
    {
      method: 'POST',
      body: JSON.stringify({
        assetType,
        filename: asset.name,
        contentType: asset.mimeType,
        sizeBytes: asset.size,
      }),
    },
  );

  const fileResponse = await fetch(asset.uri);
  if (!fileResponse.ok) throw new Error('Berkas lokal tidak dapat dibaca.');
  const blob = await fileResponse.blob();
  if (blob.size !== asset.size) {
    throw new Error('Ukuran berkas berubah setelah sesi upload dibuat. Silakan pilih ulang berkas.');
  }

  const storage = getStorage(getApp());
  const objectRef = ref(storage, session.storagePath);
  const task = uploadBytesResumable(objectRef, blob, { contentType: asset.mimeType });

  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => {
        const progress = snapshot.totalBytes > 0
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress(progress);
      },
      reject,
      resolve,
    );
  });

  return nexverseApiRequest<UploadSession>(
    '/nexverse/creator/uploads/' + encodeURIComponent(session.id) + '/complete/',
    { method: 'POST', body: '{}' },
  );
}

export function processCreatorAsset(sessionId: string) {
  return nexverseApiRequest<UploadLibraryItem>(
    '/nexverse/creator/uploads/' + encodeURIComponent(sessionId) + '/process/',
    { method: 'POST', body: '{}' },
  );
}


export type ManuscriptChapterProposal = {
  number: number;
  title: string;
  content: string;
  characters: number;
};

export type ManuscriptExtraction = {
  assetId: string;
  filename: string;
  format: 'EPUB' | 'TXT';
  proposals: ManuscriptChapterProposal[];
  totalChapters: number;
};

export function extractCreatorManuscript(sessionId: string) {
  return nexverseApiRequest<ManuscriptExtraction>(
    '/nexverse/creator/uploads/' + encodeURIComponent(sessionId) + '/extract/',
  );
}

export function importCreatorManuscriptChapters(
  sessionId: string,
  chapters: Array<Pick<ManuscriptChapterProposal, 'title' | 'content'>>,
) {
  return nexverseApiRequest<{ items: Array<{ id: string; number: number; title: string }>; alreadyImported: boolean }>(
    '/nexverse/creator/uploads/' + encodeURIComponent(sessionId) + '/chapters/',
    { method: 'POST', body: JSON.stringify({ chapters }) },
  );
}
