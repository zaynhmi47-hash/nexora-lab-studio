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
