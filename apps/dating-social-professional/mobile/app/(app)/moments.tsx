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

import { useDatingApi, type DatingMoment, type DatingMomentComment } from '@/src/api/provider';
import { useDatingSession } from '@/src/auth/session';

function formatMomentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function MomentCard({ item, onDelete }: { item: DatingMoment; onDelete: (id: string) => void }) {
  const api = useDatingApi();
  const queryClient = useQueryClient();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyTo, setReplyTo] = useState<DatingMomentComment | null>(null);

  const comments = useQuery({
    queryKey: ['dating', 'moments', item.id, 'comments'],
    queryFn: () => api.getMomentComments(item.id),
    enabled: commentsOpen,
    staleTime: 10_000,
  });

  const refreshInteractions = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dating', 'moments'] }),
      queryClient.invalidateQueries({ queryKey: ['dating', 'moments', item.id, 'comments'] }),
    ]);
  };

  const like = useMutation({
    mutationFn: () => item.is_liked_by_me ? api.unlikeMoment(item.id) : api.likeMoment(item.id),
    onSuccess: refreshInteractions,
    onError: (error) => Alert.alert('Interaksi gagal', error instanceof Error ? error.message : 'Silakan coba lagi.'),
  });

  const addComment = useMutation({
    mutationFn: () => api.createMomentComment(item.id, commentDraft.trim(), replyTo?.id),
    onSuccess: async () => {
      setCommentDraft('');
      setReplyTo(null);
      await refreshInteractions();
    },
    onError: (error) => Alert.alert('Komentar gagal dikirim', error instanceof Error ? error.message : 'Silakan coba lagi.'),
  });

  const removeComment = useMutation({
    mutationFn: (commentId: string) => api.deleteMomentComment(item.id, commentId),
    onSuccess: refreshInteractions,
    onError: (error) => Alert.alert('Tidak dapat menghapus komentar', error instanceof Error ? error.message : 'Silakan coba lagi.'),
  });

  const confirmRemoveComment = (commentId: string) => Alert.alert(
    'Hapus komentar?',
    'Komentar ini akan dihapus dari percakapan.',
    [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeComment.mutate(commentId) },
    ],
  );

  const submitComment = () => {
    if (!commentDraft.trim()) return;
    if (commentDraft.trim().length > 2000) {
      Alert.alert('Komentar terlalu panjang', 'Komentar maksimal 2.000 karakter.');
      return;
    }
    addComment.mutate();
  };

  const renderComment = (comment: DatingMomentComment, isReply = false) => (
    <View key={comment.id} style={[styles.commentRow, isReply && styles.replyRow]}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{comment.author.display_name?.trim().charAt(0).toUpperCase() || 'N'}</Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentAuthor}>{comment.author.display_name || 'Pengguna Nexora'}</Text>
          <Text style={styles.commentText}>{comment.body}</Text>
        </View>
        <View style={styles.commentActions}>
          {!isReply ? <Pressable onPress={() => setReplyTo(comment)} hitSlop={8}><Text style={styles.commentActionText}>Balas</Text></Pressable> : null}
          {comment.author.id === item.author.id ? null : null}
          <Text style={styles.commentDate}>{formatMomentDate(comment.created_at)}</Text>
        </View>
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </View>
    </View>
  );

  return (
    <View style={styles.momentCard}>
      <View style={styles.authorRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.author.display_name?.trim().charAt(0).toUpperCase() || 'N'}</Text></View>
        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{item.author.display_name || 'Pengguna Nexora'}</Text>
          <Text style={styles.timestamp}>{formatMomentDate(item.created_at)} · {item.visibility === 'private' ? 'Pribadi' : 'Publik'}</Text>
        </View>
        {item.is_own ? <Pressable onPress={() => onDelete(item.id)} hitSlop={10}><Text style={styles.deleteText}>Hapus</Text></Pressable> : null}
      </View>
      <Text style={styles.momentCaption}>{item.caption}</Text>
      {item.media_url ? <Text style={styles.mediaLink} numberOfLines={2}>{item.media_url}</Text> : null}

      <View style={styles.interactionBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.is_liked_by_me ? 'Batalkan suka' : 'Sukai Moment'}
          onPress={() => like.mutate()}
          disabled={like.isPending}
          style={styles.interactionButton}
        >
          {like.isPending ? <ActivityIndicator size="small" color="#5D49B8" /> : <Text style={[styles.interactionText, item.is_liked_by_me && styles.likedText]}>{item.is_liked_by_me ? '♥ Disukai' : '♡ Suka'}</Text>}
          <Text style={styles.interactionCount}>{item.like_count ?? 0}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka komentar"
          onPress={() => setCommentsOpen((value) => !value)}
          style={styles.interactionButton}
        >
          <Text style={styles.interactionText}>Komentar</Text>
          <Text style={styles.interactionCount}>{item.comment_count ?? 0}</Text>
        </Pressable>
      </View>

      {commentsOpen ? (
        <View style={styles.commentsPanel}>
          <Text style={styles.commentsHeading}>Percakapan</Text>
          {comments.isLoading ? <ActivityIndicator style={styles.commentLoading} /> : null}
          {comments.isError ? (
            <View style={styles.commentEmpty}>
              <Text style={styles.muted}>Komentar belum dapat dimuat.</Text>
              <Pressable onPress={() => void comments.refetch()}><Text style={styles.refreshText}>Coba lagi</Text></Pressable>
            </View>
          ) : null}
          {!comments.isLoading && !comments.isError && (comments.data?.items.length ?? 0) === 0 ? (
            <Text style={styles.muted}>Belum ada komentar. Mulai percakapan dengan sopan.</Text>
          ) : null}
          {comments.data?.items.map((comment) => renderComment(comment))}
          {replyTo ? (
            <View style={styles.replyingBanner}>
              <Text style={styles.replyingText}>Membalas {replyTo.author.display_name}</Text>
              <Pressable onPress={() => setReplyTo(null)}><Text style={styles.cancelReply}>Batal</Text></Pressable>
            </View>
          ) : null}
          <View style={styles.commentComposer}>
            <TextInput
              value={commentDraft}
              onChangeText={setCommentDraft}
              placeholder={replyTo ? 'Tulis balasan…' : 'Tulis komentar…'}
              placeholderTextColor="#8A8F98"
              multiline
              maxLength={2000}
              style={styles.commentInput}
              accessibilityLabel={replyTo ? 'Teks balasan' : 'Teks komentar'}
            />
            <Pressable
              onPress={submitComment}
              disabled={!commentDraft.trim() || addComment.isPending}
              style={[styles.sendCommentButton, (!commentDraft.trim() || addComment.isPending) && styles.disabled]}
            >
              {addComment.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.sendCommentText}>Kirim</Text>}
            </Pressable>
          </View>
          <Text style={styles.commentGuidance}>Jaga percakapan tetap saling menghormati.</Text>
        </View>
      ) : null}
    </View>
  );
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

      {items.map((item) => <MomentCard key={item.id} item={item} onDelete={confirmDelete} />)}
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
  interactionBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F4', paddingTop: 11, gap: 12 },
  interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5, paddingRight: 12 },
  interactionText: { color: '#666D79', fontSize: 13, fontWeight: '700' },
  likedText: { color: '#C03968' },
  interactionCount: { color: '#858B96', fontSize: 12 },
  commentsPanel: { borderTopWidth: 1, borderTopColor: '#F0F0F4', paddingTop: 13, gap: 12 },
  commentsHeading: { color: '#252938', fontSize: 14, fontWeight: '800' },
  commentLoading: { padding: 12 },
  commentEmpty: { alignItems: 'center', gap: 7, padding: 10 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  replyRow: { marginTop: 9, marginLeft: 12 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ECEAF5', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: '#5141A4', fontSize: 11, fontWeight: '800' },
  commentBody: { flex: 1, gap: 5 },
  commentBubble: { backgroundColor: '#F6F6F9', borderRadius: 12, padding: 10, gap: 4 },
  commentAuthor: { color: '#343746', fontSize: 12, fontWeight: '800' },
  commentText: { color: '#424653', fontSize: 13, lineHeight: 19 },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  commentActionText: { color: '#5D49B8', fontSize: 11, fontWeight: '800' },
  commentDate: { color: '#9297A0', fontSize: 10 },
  replyingBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1EEFC', borderRadius: 9, padding: 9 },
  replyingText: { color: '#5141A4', fontSize: 11, fontWeight: '700' },
  cancelReply: { color: '#5141A4', fontSize: 11, fontWeight: '800' },
  commentComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  commentInput: { flex: 1, minHeight: 42, maxHeight: 110, borderRadius: 12, backgroundColor: '#F6F6F9', paddingHorizontal: 11, paddingVertical: 10, color: '#303441', fontSize: 13 },
  sendCommentButton: { minHeight: 40, minWidth: 62, borderRadius: 11, backgroundColor: '#5D49B8', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  sendCommentText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  commentGuidance: { color: '#9297A0', fontSize: 10 },
});
