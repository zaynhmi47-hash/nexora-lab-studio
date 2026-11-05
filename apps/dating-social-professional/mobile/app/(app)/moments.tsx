import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDatingApi } from '@/src/api/provider';
import { useDatingSession } from '@/src/auth/session';

function formatMomentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function MomentsScreen() {
  const api = useDatingApi();
  const { token, loading: sessionLoading } = useDatingSession();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const feed = useQuery({
    queryKey: ['dating', 'moments'],
    queryFn: () => api.getMoments(),
    enabled: !sessionLoading && !!token,
    staleTime: 15_000,
  });

  const createMoment = useMutation({
    mutationFn: () => api.createMoment({
      caption: caption.trim(),
      ...(mediaUrl.trim() ? { media_url: mediaUrl.trim() } : {}),
      visibility,
    }),
    onSuccess: async () => {
      setCaption('');
      setMediaUrl('');
      setVisibility('public');
      await queryClient.invalidateQueries({ queryKey: ['dating', 'moments'] });
    },
    onError: (error) => Alert.alert('Tidak dapat membuat Moment', error instanceof Error ? error.message : 'Silakan coba lagi.'),
  });

  const deleteMoment = useMutation({
    mutationFn: (momentId: string) => api.deleteMoment(momentId),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['dating', 'moments'] }),
    onError: (error) => Alert.alert('Gagal menghapus', error instanceof Error ? error.message : 'Silakan coba lagi.'),
  });

  const items = useMemo(() => feed.data?.items ?? [], [feed.data?.items]);
  const submit = () => {
    if (!caption.trim()) {
      Alert.alert('Moment masih kosong', 'Tulis sesuatu sebelum memposting.');
      return;
    }
    if (caption.trim().length > 2000) {
      Alert.alert('Terlalu panjang', 'Moment maksimal 2.000 karakter.');
      return;
    }
    createMoment.mutate();
  };

  const confirmDelete = (momentId: string) => Alert.alert(
    'Hapus Moment?',
    'Moment ini akan dihapus dari feed.',
    [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteMoment.mutate(momentId) },
    ],
  );

  if (sessionLoading) {
    return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Memuat sesi…</Text></View>;
  }

  if (!token) {
    return <View style={styles.center}><Text style={styles.title}>Moments</Text><Text style={styles.muted}>Masuk melalui Nexora Identity untuk melihat dan membagikan Moment.</Text></View>;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => void feed.refetch()} />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>NEXORA SOCIAL</Text>
        <Text style={styles.title}>Moments</Text>
        <Text style={styles.subtitle}>Bagikan cerita, temukan kesamaan, mulai percakapan.</Text>
      </View>

      <View style={styles.composer}>
        <Text style={styles.sectionTitle}>Bagikan sesuatu</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Apa yang sedang kamu pikirkan?"
          placeholderTextColor="#8A8F98"
          multiline
          maxLength={2000}
          textAlignVertical="top"
          style={styles.captionInput}
          accessibilityLabel="Teks Moment"
        />
        <Text style={styles.counter}>{caption.length}/2000</Text>
        <TextInput
          value={mediaUrl}
          onChangeText={setMediaUrl}
          placeholder="URL foto/video (opsional)"
          placeholderTextColor="#8A8F98"
          autoCapitalize="none"
          keyboardType="url"
          style={styles.urlInput}
          accessibilityLabel="URL media opsional"
        />
        <View style={styles.composerFooter}>
          <View style={styles.visibilityGroup}>
            <Pressable onPress={() => setVisibility('public')} style={[styles.visibilityButton, visibility === 'public' && styles.visibilityActive]}>
              <Text style={[styles.visibilityText, visibility === 'public' && styles.visibilityTextActive]}>Publik</Text>
            </Pressable>
            <Pressable onPress={() => setVisibility('private')} style={[styles.visibilityButton, visibility === 'private' && styles.visibilityActive]}>
              <Text style={[styles.visibilityText, visibility === 'private' && styles.visibilityTextActive]}>Pribadi</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={submit}
            disabled={createMoment.isPending || !caption.trim()}
            style={[styles.postButton, (createMoment.isPending || !caption.trim()) && styles.disabled]}
          >
            {createMoment.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.postButtonText}>Posting</Text>}
          </Pressable>
        </View>
        <Text style={styles.helper}>Konten media melalui URL untuk tahap awal. Upload langsung dan moderasi media menyusul.</Text>
      </View>

      <View style={styles.feedHeader}>
        <Text style={styles.sectionTitle}>Cerita terbaru</Text>
        <Pressable onPress={() => void feed.refetch()}><Text style={styles.refreshText}>Segarkan</Text></Pressable>
      </View>

      {feed.isLoading ? <View style={styles.loading}><ActivityIndicator /><Text style={styles.muted}>Memuat Moments…</Text></View> : null}
      {feed.isError ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Feed belum dapat dimuat</Text>
          <Text style={styles.muted}>Periksa koneksi dan coba lagi.</Text>
          <Pressable onPress={() => void feed.refetch()} style={styles.retryButton}><Text style={styles.retryText}>Coba lagi</Text></Pressable>
        </View>
      ) : null}
      {!feed.isLoading && !feed.isError && items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Belum ada cerita</Text>
          <Text style={styles.muted}>Jadilah orang pertama yang membagikan Moment hari ini.</Text>
        </View>
      ) : null}

      {items.map((item) => (
        <View key={item.id} style={styles.momentCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.author.display_name?.trim().charAt(0).toUpperCase() || 'N'}</Text></View>
            <View style={styles.authorMeta}>
              <Text style={styles.authorName}>{item.author.display_name || 'Pengguna Nexora'}</Text>
              <Text style={styles.timestamp}>{formatMomentDate(item.created_at)} · {item.visibility === 'private' ? 'Pribadi' : 'Publik'}</Text>
            </View>
            {item.is_own ? <Pressable onPress={() => confirmDelete(item.id)} hitSlop={10}><Text style={styles.deleteText}>Hapus</Text></Pressable> : null}
          </View>
          <Text style={styles.momentCaption}>{item.caption}</Text>
          {item.media_url ? <Text style={styles.mediaLink} numberOfLines={2}>{item.media_url}</Text> : null}
        </View>
      ))}
      {feed.isFetching && !feed.isLoading ? <ActivityIndicator style={styles.loading} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6F8' },
  content: { padding: 18, paddingBottom: 36, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12, backgroundColor: '#F5F6F8' },
  header: { paddingTop: 8, gap: 5 },
  eyebrow: { color: '#6A55C7', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#171923', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#69707D', fontSize: 14, lineHeight: 20 },
  composer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E9EAF0' },
  sectionTitle: { color: '#202331', fontSize: 17, fontWeight: '800' },
  captionInput: { minHeight: 112, maxHeight: 190, borderRadius: 14, backgroundColor: '#F7F7FA', padding: 13, color: '#202331', fontSize: 15, lineHeight: 22 },
  counter: { textAlign: 'right', color: '#858B96', fontSize: 11, marginTop: -7 },
  urlInput: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E7E8EE', paddingHorizontal: 12, color: '#202331' },
  composerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  visibilityGroup: { flexDirection: 'row', backgroundColor: '#F1F1F5', borderRadius: 12, padding: 3 },
  visibilityButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9 },
  visibilityActive: { backgroundColor: '#FFFFFF' },
  visibilityText: { color: '#747A86', fontSize: 12, fontWeight: '700' },
  visibilityTextActive: { color: '#5141A4' },
  postButton: { minWidth: 94, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5D49B8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  postButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  helper: { color: '#8A8F98', fontSize: 11, lineHeight: 16 },
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  refreshText: { color: '#5D49B8', fontWeight: '700', fontSize: 13 },
  loading: { padding: 18, gap: 10 },
  muted: { color: '#777E89', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E9EAF0', padding: 24, alignItems: 'center', gap: 9 },
  emptyTitle: { color: '#242735', fontWeight: '800', fontSize: 16 },
  retryButton: { backgroundColor: '#5D49B8', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  momentCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E9EAF0', gap: 13 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E9E5FA', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#5141A4', fontSize: 16, fontWeight: '800' },
  authorMeta: { flex: 1, gap: 3 },
  authorName: { color: '#242735', fontWeight: '800', fontSize: 14 },
  timestamp: { color: '#858B96', fontSize: 11 },
  deleteText: { color: '#B42318', fontSize: 12, fontWeight: '700' },
  momentCaption: { color: '#303441', fontSize: 15, lineHeight: 23 },
  mediaLink: { color: '#5D49B8', fontSize: 12, lineHeight: 17 },
});
