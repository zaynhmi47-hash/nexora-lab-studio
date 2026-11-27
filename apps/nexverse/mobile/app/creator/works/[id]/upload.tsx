import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { palette } from '@/constants/theme';
import {
  getCreatorUploadLibrary,
  uploadCreatorAsset,
  type UploadAssetType,
  type UploadLibraryItem,
  type UploadLibraryResponse,
} from '@/services/uploads';

const MAX_BYTES = 50 * 1024 * 1024;

export default function UploadCenterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [library, setLibrary] = useState<UploadLibraryResponse | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [libraryError, setLibraryError] = useState('');

  const refreshLibrary = useCallback(async () => {
    if (!id) return;
    setLoadingLibrary(true);
    setLibraryError('');
    try {
      setLibrary(await getCreatorUploadLibrary(id));
    } catch (cause) {
      setLibraryError(cause instanceof Error ? cause.message : 'Perpustakaan aset gagal dimuat.');
    } finally {
      setLoadingLibrary(false);
    }
  }, [id]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const statusLabel = (status: UploadLibraryItem['status']) => ({
    created: 'Menunggu upload',
    uploaded: 'Tersimpan · menunggu pemeriksaan',
    expired: 'Kedaluwarsa',
    rejected: 'Perlu unggah ulang',
  })[status];

  const formatBytes = (bytes: number) => bytes < 1024 * 1024
    ? Math.max(1, Math.round(bytes / 1024)) + ' KB'
    : (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  const chooseAndUpload = async (assetType: UploadAssetType) => {
    setError('');
    setSuccess('');
    const isCover = assetType === 'cover';
    const result = await DocumentPicker.getDocumentAsync({
      type: isCover
        ? ['image/jpeg', 'image/png', 'image/webp']
        : assetType === 'attachment'
          ? ['application/pdf', 'image/jpeg', 'image/png']
          : ['application/pdf', 'application/epub+zip', 'text/plain'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];
    if (!file.size || file.size < 1 || file.size > MAX_BYTES) {
      setError('Ukuran berkas harus lebih dari 0 dan maksimal 50 MB.');
      return;
    }
    if (!file.mimeType) {
      setError('Format berkas tidak dapat dikenali. Pilih format yang didukung.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setCurrentLabel(file.name);
    try {
      const uploaded = await uploadCreatorAsset(
        id,
        assetType,
        { uri: file.uri, name: file.name, mimeType: file.mimeType, size: file.size },
        setProgress,
      );
      setSuccess(uploaded.filename + ' berhasil diunggah dan menunggu pemeriksaan.');
      await refreshLibrary();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload gagal. Periksa koneksi lalu coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Pressable onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={18} color={palette.ink} />
        <Text style={s.backText}>Kembali ke editor karya</Text>
      </Pressable>
      <Text style={s.kicker}>NEXVERSE CREATOR TOOLS</Text>
      <Text style={s.title}>Upload Center</Text>
      <Text style={s.subtitle}>
        Unggah manuskrip dan aset karya ke penyimpanan Nexverse. Setiap unggahan diverifikasi oleh backend sebelum dapat digunakan dalam proses publikasi.
      </Text>

      <View style={s.info}>
        <Ionicons name="shield-checkmark-outline" size={20} color={palette.green} />
        <View style={s.infoCopy}>
          <Text style={s.infoTitle}>Upload privat dan terkontrol</Text>
          <Text style={s.infoBody}>Berkas disimpan di Firebase Storage pada ruang milik akun yang sedang masuk.</Text>
        </View>
      </View>

      <Text style={s.section}>Pilih jenis berkas</Text>
      <Pressable disabled={uploading} onPress={() => void chooseAndUpload('manuscript')} style={s.uploadCard}>
        <View style={s.fileIcon}><Ionicons name="document-text-outline" size={24} color={palette.green} /></View>
        <View style={s.cardCopy}>
          <Text style={s.cardTitle}>Manuskrip</Text>
          <Text style={s.cardBody}>PDF, EPUB, atau TXT · Maks. 50 MB</Text>
        </View>
        <Ionicons name="cloud-upload-outline" size={21} color={palette.green} />
      </Pressable>
      <Pressable disabled={uploading} onPress={() => void chooseAndUpload('cover')} style={s.uploadCard}>
        <View style={s.fileIcon}><Ionicons name="image-outline" size={24} color={palette.green} /></View>
        <View style={s.cardCopy}>
          <Text style={s.cardTitle}>Cover karya</Text>
          <Text style={s.cardBody}>JPG, PNG, atau WEBP · Maks. 50 MB</Text>
        </View>
        <Ionicons name="cloud-upload-outline" size={21} color={palette.green} />
      </Pressable>
      <Pressable disabled={uploading} onPress={() => void chooseAndUpload('attachment')} style={s.uploadCard}>
        <View style={s.fileIcon}><Ionicons name="attach-outline" size={24} color={palette.green} /></View>
        <View style={s.cardCopy}>
          <Text style={s.cardTitle}>Lampiran pendukung</Text>
          <Text style={s.cardBody}>PDF, JPG, atau PNG · Maks. 50 MB</Text>
        </View>
        <Ionicons name="cloud-upload-outline" size={21} color={palette.green} />
      </Pressable>

      {uploading ? (
        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <ActivityIndicator size="small" color={palette.green} />
            <Text style={s.progressTitle}>Mengunggah {currentLabel}</Text>
            <Text style={s.percent}>{progress}%</Text>
          </View>
          <View style={s.track}><View style={[s.fill, { width: String(progress) + '%' }]} /></View>
          <Text style={s.cardBody}>Jangan tutup halaman sampai upload selesai.</Text>
        </View>
      ) : null}
      {success ? <View style={s.success}><Ionicons name="checkmark-circle" size={19} color={palette.green} /><Text style={s.successText}>{success}</Text></View> : null}
      {error ? <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={19} color="#A34E42" /><Text style={s.errorText}>{error}</Text></View> : null}

      <View style={s.libraryHeader}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.section}>Perpustakaan aset</Text>
          <Text style={s.cardBody}>Riwayat berkas untuk karya ini</Text>
        </View>
        <Pressable onPress={() => void refreshLibrary()} style={s.refreshButton} disabled={loadingLibrary}>
          <Ionicons name="refresh" size={16} color={palette.green} />
          <Text style={s.refreshText}>Muat ulang</Text>
        </Pressable>
      </View>
      {library ? (
        <View style={s.countRow}>
          <View style={s.countPill}><Text style={s.countValue}>{library.counts.uploaded}</Text><Text style={s.countLabel}>Tersimpan</Text></View>
          <View style={s.countPill}><Text style={s.countValue}>{library.counts.created}</Text><Text style={s.countLabel}>Berlangsung</Text></View>
          <View style={s.countPill}><Text style={s.countValue}>{library.counts.rejected + library.counts.expired}</Text><Text style={s.countLabel}>Perlu tindakan</Text></View>
        </View>
      ) : null}
      {loadingLibrary ? (
        <View style={s.emptyLibrary}><ActivityIndicator color={palette.green} /><Text style={s.cardBody}>Memuat perpustakaan aset…</Text></View>
      ) : libraryError ? (
        <View style={s.errorBox}><Ionicons name="alert-circle-outline" size={18} color="#A34E42" /><Text style={s.errorText}>{libraryError}</Text></View>
      ) : library?.items.length ? library.items.map(item => (
        <View key={item.id} style={s.assetRow}>
          <View style={s.assetIcon}>
            <Ionicons name={item.assetType === 'cover' ? 'image-outline' : item.assetType === 'manuscript' ? 'document-text-outline' : 'attach-outline'} size={21} color={palette.green} />
          </View>
          <View style={s.assetCopy}>
            <Text style={s.assetName} numberOfLines={1}>{item.filename}</Text>
            <Text style={s.cardBody}>{item.assetType === 'cover' ? 'Cover' : item.assetType === 'manuscript' ? 'Manuskrip' : 'Lampiran'} · {formatBytes(item.uploadedSizeBytes ?? item.expectedSizeBytes)}</Text>
            <Text style={s.assetStatus}>{statusLabel(item.status)}</Text>
          </View>
          <Text style={s.assetDate}>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</Text>
        </View>
      )) : (
        <View style={s.emptyLibrary}><Ionicons name="folder-open-outline" size={25} color={palette.muted} /><Text style={s.cardBody}>Belum ada aset. Berkas yang berhasil diunggah akan muncul di sini.</Text></View>
      )}
      <Text style={s.footnote}>Status “tersimpan” berarti metadata objek sudah diverifikasi oleh backend. Berkas belum dipindai malware, diekstrak, atau disetujui untuk publikasi. Pratinjau dan pengaitan ke reader akan ditambahkan pada tahap pemrosesan dokumen.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  backText: { color: palette.ink, fontSize: 12, fontWeight: '700' },
  kicker: { color: palette.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: palette.ink, fontSize: 29, fontWeight: '900' },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 19 },
  info: { flexDirection: 'row', gap: 11, padding: 14, borderRadius: 13, backgroundColor: palette.mint, marginVertical: 7 },
  infoCopy: { flex: 1, gap: 3 },
  infoTitle: { color: palette.greenDark, fontSize: 12, fontWeight: '900' },
  infoBody: { color: palette.greenDark, fontSize: 10, lineHeight: 16 },
  section: { color: palette.ink, fontSize: 16, fontWeight: '900', marginTop: 7 },
  uploadCard: { minHeight: 76, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: 4 },
  cardTitle: { color: palette.ink, fontSize: 13, fontWeight: '900' },
  cardBody: { color: palette.muted, fontSize: 10, lineHeight: 15 },
  progressCard: { padding: 14, backgroundColor: palette.surface, borderRadius: 13, borderWidth: 1, borderColor: palette.line, gap: 10 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTitle: { color: palette.ink, fontSize: 11, fontWeight: '800', flex: 1 },
  percent: { color: palette.green, fontSize: 11, fontWeight: '900' },
  track: { height: 7, borderRadius: 6, backgroundColor: palette.line, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 6, backgroundColor: palette.green },
  success: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: palette.mint, borderRadius: 11, padding: 12 },
  successText: { color: palette.greenDark, fontSize: 11, flex: 1, lineHeight: 16 },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: palette.rose, borderRadius: 11, padding: 12 },
  errorText: { color: '#8E443A', fontSize: 11, flex: 1, lineHeight: 16 },
  libraryHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8 },
  refreshText: { color: palette.green, fontSize: 10, fontWeight: '800' },
  countRow: { flexDirection: 'row', gap: 8 },
  countPill: { flex: 1, padding: 10, borderRadius: 11, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, gap: 2 },
  countValue: { color: palette.ink, fontSize: 18, fontWeight: '900' },
  countLabel: { color: palette.muted, fontSize: 9 },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  assetIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  assetCopy: { flex: 1, gap: 3 },
  assetName: { color: palette.ink, fontSize: 11, fontWeight: '900' },
  assetStatus: { color: palette.greenDark, fontSize: 9, fontWeight: '700' },
  assetDate: { color: palette.muted, fontSize: 9 },
  emptyLibrary: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 22, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: palette.line },
  footnote: { color: palette.muted, fontSize: 10, lineHeight: 16, marginTop: 8 },
});
