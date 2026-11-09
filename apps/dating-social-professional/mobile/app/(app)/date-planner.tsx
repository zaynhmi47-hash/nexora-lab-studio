import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatingApi } from '@/src/api/provider';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { datingColors, datingRadii, datingSpacing } from '@/src/ui/tokens';

const options = [
  { id: 'coffee', title: 'Ngopi santai', icon: 'cafe-outline' as const, copy: 'Ngobrol nyaman tanpa terburu-buru.' },
  { id: 'food', title: 'Kulineran', icon: 'restaurant-outline' as const, copy: 'Coba tempat makan baru bersama.' },
  { id: 'walk', title: 'Jalan sore', icon: 'walk-outline' as const, copy: 'Aktivitas ringan sambil mengenal.' },
  { id: 'art', title: 'Seni & budaya', icon: 'color-palette-outline' as const, copy: 'Galeri, museum, atau acara kreatif.' },
  { id: 'movie', title: 'Nonton film', icon: 'film-outline' as const, copy: 'Pilih film yang sama-sama disukai.' },
  { id: 'outdoor', title: 'Outdoor', icon: 'leaf-outline' as const, copy: 'Piknik atau aktivitas di ruang terbuka.' },
];
const milestones = [
  ['01', 'First hello', 'Percakapan pertama dimulai', 'Mulai dengan sapaan ringan dan temukan satu hal yang sama.', 'chatbubble-ellipses-outline'],
  ['02', 'Getting to know', 'Saling mengenal lebih dekat', 'Bagikan cerita, minat, nilai, dan hal yang penting bagi masing-masing.', 'people-outline'],
  ['03', 'First date', 'Pertemuan pertama', 'Pilih tempat publik yang nyaman dan sepakati rencana bersama.', 'cafe-outline'],
  ['04', 'Building trust', 'Membangun rasa percaya', 'Jaga komunikasi, batas pribadi, dan konsistensi dalam tindakan.', 'shield-checkmark-outline'],
  ['05', 'Defining the relationship', 'Menyepakati arah hubungan', 'Bicarakan harapan dan status hubungan secara terbuka tanpa tekanan.', 'heart-outline'],
] as const;

export default function DatePlannerScreen() {
  const api = useDatingApi();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'planner' | 'journey'>('planner');
  const [activity, setActivity] = useState('coffee');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const matchesQuery = useQuery({ queryKey: ['dating', 'matches'], queryFn: async () => (await api.getMatches()).items });
  const plansQuery = useQuery({ queryKey: ['dating', 'date-plans'], queryFn: () => api.getDatePlans() });
  const matches = matchesQuery.data ?? [];
  const selected = options.find((item) => item.id === activity) ?? options[0];
  const milestonesQuery = useQuery({
    queryKey: ['dating', 'relationship-milestones', selectedMatchId],
    queryFn: () => api.getRelationshipMilestones(selectedMatchId),
    enabled: Boolean(selectedMatchId) && tab === 'journey',
  });
  const refreshPlanner = () => queryClient.invalidateQueries({ queryKey: ['dating', 'date-plans'] });
  const createPlan = useMutation({
    mutationFn: () => {
      const start = new Date(date + 'T' + time);
      if (!Number.isFinite(start.getTime())) throw new Error('Tanggal atau waktu tidak valid.');
      return api.createDatePlan({
        match: selectedMatchId,
        activity,
        title: selected.title,
        starts_at: start.toISOString(),
        timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Makassar',
        location_name: place.trim(),
        notes: notes.trim(),
      });
    },
    onSuccess: () => {
      setShowPreview(false);
      setDate(''); setTime(''); setPlace(''); setNotes('');
      refreshPlanner();
      Alert.alert('Undangan terkirim', 'Rencana kencan sudah dikirim kepada pasanganmu.');
    },
    onError: (error) => Alert.alert('Belum berhasil', error instanceof Error ? error.message : 'Gagal mengirim rencana.'),
  });
  const respondPlan = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'accept' | 'decline' }) => api.respondToDatePlan(id, decision),
    onSuccess: () => refreshPlanner(),
    onError: (error) => Alert.alert('Belum berhasil', error instanceof Error ? error.message : 'Gagal merespons undangan.'),
  });
  const acknowledge = useMutation({
    mutationFn: (stage: string) => api.acknowledgeRelationshipMilestone(selectedMatchId, stage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dating', 'relationship-milestones', selectedMatchId] }),
    onError: (error) => Alert.alert('Belum berhasil', error instanceof Error ? error.message : 'Gagal memperbarui journey.'),
  });
  const review = () => {
    if (!selectedMatchId) { Alert.alert('Pilih pasangan', 'Pilih match yang akan menerima undangan.'); return; }
    if (!date.trim() || !time.trim() || !place.trim()) { Alert.alert('Lengkapi rencana', 'Isi tanggal, waktu, dan tempat terlebih dahulu.'); return; }
    const start = new Date(date + 'T' + time);
    if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) { Alert.alert('Periksa jadwal', 'Pilih tanggal dan waktu di masa mendatang.'); return; }
    setShowPreview(true);
  };
  const planItems = plansQuery.data?.items ?? [];
  const journeyItems = milestonesQuery.data?.items ?? [];
  return <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <View style={s.header}><Text style={s.eyebrow}>NEXORA · CONNECTIONS</Text><Text style={s.title}>Make it meaningful.</Text><Text style={s.subtitle}>Rencanakan pertemuan yang terasa natural dan nikmati setiap tahap mengenal seseorang.</Text></View>
    <View style={s.tabs}>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'planner' }} onPress={() => setTab('planner')} style={[s.tab, tab === 'planner' && s.tabActive]}><Ionicons name="calendar-outline" size={17} color={tab === 'planner' ? '#FFF' : datingColors.textSecondary} /><Text style={[s.tabText, tab === 'planner' && s.tabTextActive]}>Date Planner</Text></Pressable>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'journey' }} onPress={() => setTab('journey')} style={[s.tab, tab === 'journey' && s.tabActive]}><Ionicons name="git-branch-outline" size={17} color={tab === 'journey' ? '#FFF' : datingColors.textSecondary} /><Text style={[s.tabText, tab === 'journey' && s.tabTextActive]}>Journey</Text></Pressable>
    </View>
    {tab === 'planner' ? <>
      <View style={s.section}>
        <Text style={s.heading}>Kirim rencana ke match</Text>
        {matchesQuery.isLoading ? <Text style={s.subheading}>Memuat daftar match…</Text> : matches.length === 0 ? <Text style={s.subheading}>Belum ada match aktif. Temukan koneksi terlebih dahulu di Discover.</Text> : matches.map((match) => <Pressable key={match.id} onPress={() => { setSelectedMatchId(match.id); setShowPreview(false); }} style={[s.matchChoice, selectedMatchId === match.id && s.matchChoiceActive]}><Ionicons name={selectedMatchId === match.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={datingColors.primary} /><Text style={s.matchChoiceText}>{match.counterpart?.displayName ?? 'Nexora match'}</Text></Pressable>)}
      </View>
      <View style={s.section}><Text style={s.heading}>Pilih suasana kencan</Text><Text style={s.subheading}>Mulai dari aktivitas yang membuat kalian nyaman.</Text><View style={s.grid}>{options.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: activity === item.id }} onPress={() => { setActivity(item.id); setShowPreview(false); }} style={[s.option, activity === item.id && s.optionActive]}><View style={[s.optionIcon, activity === item.id && s.optionIconActive]}><Ionicons name={item.icon} size={20} color={activity === item.id ? '#FFF' : datingColors.primary} /></View><Text style={s.optionTitle}>{item.title}</Text><Text style={s.optionCopy}>{item.copy}</Text></Pressable>)}</View></View>
      <View style={s.section}><Text style={s.heading}>Detail pertemuan</Text><Text style={s.label}>Tanggal</Text><TextInput value={date} onChangeText={(v) => { setDate(v); setShowPreview(false); }} placeholder="YYYY-MM-DD" placeholderTextColor={datingColors.textSecondary} style={s.input} /><Text style={s.label}>Waktu perangkat lokal</Text><TextInput value={time} onChangeText={(v) => { setTime(v); setShowPreview(false); }} placeholder="HH:MM, contoh 16:30" placeholderTextColor={datingColors.textSecondary} style={s.input} /><Text style={s.label}>Tempat bertemu</Text><TextInput value={place} onChangeText={(v) => { setPlace(v); setShowPreview(false); }} placeholder="Nama tempat atau area publik" placeholderTextColor={datingColors.textSecondary} style={s.input} /><Text style={s.label}>Catatan (opsional)</Text><TextInput value={notes} onChangeText={(v) => { setNotes(v); setShowPreview(false); }} placeholder="Hal yang ingin disiapkan atau dibicarakan…" placeholderTextColor={datingColors.textSecondary} style={[s.input, s.notes]} multiline maxLength={500} /><Pressable onPress={review} style={s.primary}><Ionicons name="eye-outline" size={18} color="#FFF" /><Text style={s.primaryText}>Lihat ringkasan rencana</Text></Pressable></View>
      {showPreview ? <View style={s.section}><Text style={s.heading}>Kirim undangan kencan?</Text><Text style={s.previewTitle}>{selected.title}</Text><Text style={s.previewLine}>◷  {date} · {time}</Text><Text style={s.previewLine}>⌖  {place}</Text>{notes.trim() ? <Text style={s.previewNotes}>{notes}</Text> : null}<Text style={s.notice}>Undangan akan dikirim ke match yang dipilih dan tersimpan di akun.</Text><Pressable disabled={createPlan.isPending} onPress={() => createPlan.mutate()} style={[s.primary, createPlan.isPending && s.disabled]}><Ionicons name="send-outline" size={17} color="#FFF" /><Text style={s.primaryText}>{createPlan.isPending ? 'Mengirim…' : 'Kirim undangan'}</Text></Pressable></View> : null}
      <View style={s.section}><View style={s.sectionHeader}><Text style={s.heading}>Rencana bersama</Text><Pressable onPress={() => refreshPlanner()}><Ionicons name="refresh-outline" size={19} color={datingColors.primary} /></Pressable></View>{plansQuery.isLoading ? <Text style={s.subheading}>Memuat rencana…</Text> : plansQuery.isError ? <Text style={s.subheading}>Rencana belum dapat dimuat. Coba segarkan.</Text> : planItems.length === 0 ? <Text style={s.subheading}>Belum ada rencana kencan. Rencana yang dikirim atau diterima akan muncul di sini.</Text> : planItems.map((plan) => <View key={plan.id} style={s.planCard}><Text style={s.planTitle}>{plan.title}</Text><Text style={s.previewLine}>{new Date(plan.starts_at).toLocaleString()} · {plan.timezone}</Text><Text style={s.previewLine}>{plan.location_name}</Text>{plan.notes ? <Text style={s.previewNotes}>{plan.notes}</Text> : null}<Text style={s.statusText}>Status: {plan.status}</Text>{plan.can_respond && plan.status === 'proposed' ? <View style={s.responseRow}><Pressable disabled={respondPlan.isPending} onPress={() => respondPlan.mutate({ id: plan.id, decision: 'accept' })} style={s.acceptButton}><Text style={s.primaryText}>Terima</Text></Pressable><Pressable disabled={respondPlan.isPending} onPress={() => respondPlan.mutate({ id: plan.id, decision: 'decline' })} style={s.declineButton}><Text style={s.declineText}>Tolak</Text></Pressable></View> : null}</View>)}</View>
      <View style={s.safety}><Ionicons name="shield-checkmark-outline" size={21} color={datingColors.success} /><View style={s.flex}><Text style={s.safetyTitle}>Utamakan pertemuan yang aman</Text><Text style={s.safetyCopy}>Pilih tempat publik, beri tahu orang tepercaya, atur transportasi sendiri, dan jangan bagikan informasi sensitif.</Text></View></View>
    </> : <>
      <View style={s.section}><Text style={s.heading}>Pilih match untuk melihat journey</Text>{matchesQuery.isLoading ? <Text style={s.subheading}>Memuat daftar match…</Text> : matches.length === 0 ? <Text style={s.subheading}>Relationship Journey tersedia setelah kamu memiliki match.</Text> : matches.map((match) => <Pressable key={match.id} onPress={() => setSelectedMatchId(match.id)} style={[s.matchChoice, selectedMatchId === match.id && s.matchChoiceActive]}><Ionicons name={selectedMatchId === match.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={datingColors.primary} /><Text style={s.matchChoiceText}>{match.counterpart?.displayName ?? 'Nexora match'}</Text></Pressable>)}</View>
      <View style={s.journeyIntro}><Text style={s.heading}>Every connection has its own pace.</Text><Text style={s.subheading}>Gunakan tahapan ini sebagai panduan, bukan target atau garis waktu yang wajib diikuti. Konfirmasi masing-masing pihak disimpan terpisah.</Text></View>
      {selectedMatchId ? milestonesQuery.isLoading ? <Text style={s.subheading}>Memuat relationship journey…</Text> : <View style={s.timeline}>{milestones.map((item) => { const state = journeyItems.find((entry) => entry.stage === item[0].replace('01','first_hello').replace('02','getting_to_know').replace('03','first_date').replace('04','building_trust').replace('05','defining_relationship')); return <View key={item[0]} style={s.milestone}><View style={s.rail}><View style={s.milestoneIcon}><Ionicons name={item[4]} size={19} color={datingColors.primary} /></View><View style={s.connector} /></View><View style={s.milestoneBody}><Text style={s.milestoneNumber}>MILESTONE {item[0]}</Text><Text style={s.milestoneTitle}>{item[1]}</Text><Text style={s.milestoneSub}>{item[2]}</Text><Text style={s.milestoneCopy}>{item[3]}</Text><Text style={s.statusText}>Kamu: {state?.acknowledged_by_me ? 'sudah setuju' : 'belum'} · Pasangan: {state?.acknowledged_by_partner ? 'sudah setuju' : 'belum'}</Text>{state?.mutually_acknowledged ? <Text style={s.mutualText}>Disepakati bersama</Text> : <Pressable disabled={Boolean(state?.acknowledged_by_me) || acknowledge.isPending} onPress={() => acknowledge.mutate(state?.stage ?? ['first_hello','getting_to_know','first_date','building_trust','defining_relationship'][Number(item[0]) - 1])} style={[s.ackButton, Boolean(state?.acknowledged_by_me) && s.disabled]}><Text style={s.ackText}>{state?.acknowledged_by_me ? 'Konfirmasi tersimpan' : 'Saya setuju dengan tahap ini'}</Text></Pressable>}</View></View>; })}</View> : <Text style={s.subheading}>Pilih salah satu match untuk memuat tahapan hubungan.</Text>}
      <View style={s.safety}><Ionicons name="heart-circle-outline" size={21} color={datingColors.primary} /><View style={s.flex}><Text style={s.safetyTitle}>Hubungan bukan perlombaan</Text><Text style={s.safetyCopy}>Pastikan setiap langkah disepakati bersama. Mengambil jeda juga pilihan yang valid.</Text></View></View>
    </>}
  </ScrollView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: datingColors.background }, content: { padding: datingSpacing.lg, paddingTop: datingSpacing.xl, paddingBottom: 42, gap: datingSpacing.lg },
  header: { gap: 6 }, eyebrow: { color: datingColors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: datingColors.text, fontSize: 29, fontWeight: '900' }, subtitle: { color: datingColors.textSecondary, fontSize: 13, lineHeight: 20 },
  tabs: { flexDirection: 'row', padding: 4, backgroundColor: datingColors.surfaceMuted, borderRadius: datingRadii.md, gap: 5 }, tab: { flex: 1, minHeight: 43, borderRadius: datingRadii.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, tabActive: { backgroundColor: datingColors.primary }, tabText: { color: datingColors.textSecondary, fontSize: 12, fontWeight: '800' }, tabTextActive: { color: '#FFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, matchChoice: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, borderRadius: datingRadii.sm, borderWidth: 1, borderColor: datingColors.border }, matchChoiceActive: { borderColor: datingColors.primary, backgroundColor: datingColors.accentSoft }, matchChoiceText: { color: datingColors.text, fontSize: 12, fontWeight: '700' }, planCard: { padding: 12, borderRadius: datingRadii.md, borderWidth: 1, borderColor: datingColors.border, gap: 8 }, planTitle: { color: datingColors.text, fontSize: 15, fontWeight: '900' }, statusText: { color: datingColors.textSecondary, fontSize: 11, fontWeight: '700' }, responseRow: { flexDirection: 'row', gap: 8 }, acceptButton: { flex: 1, minHeight: 40, backgroundColor: datingColors.primary, borderRadius: datingRadii.pill, alignItems: 'center', justifyContent: 'center' }, declineButton: { flex: 1, minHeight: 40, backgroundColor: datingColors.surfaceMuted, borderRadius: datingRadii.pill, alignItems: 'center', justifyContent: 'center' }, declineText: { color: datingColors.text, fontSize: 12, fontWeight: '900' }, ackButton: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 9, borderRadius: datingRadii.pill, backgroundColor: datingColors.primary }, ackText: { color: '#FFF', fontSize: 10, fontWeight: '900' }, mutualText: { color: datingColors.success, fontSize: 11, fontWeight: '900' }, disabled: { opacity: 0.5 },
  section: { backgroundColor: datingColors.surface, borderRadius: datingRadii.lg, borderWidth: 1, borderColor: datingColors.border, padding: datingSpacing.lg, gap: 12 }, heading: { color: datingColors.text, fontSize: 17, fontWeight: '900' }, subheading: { color: datingColors.textSecondary, fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, option: { width: '48%', flexGrow: 1, minHeight: 125, padding: 12, borderRadius: datingRadii.md, borderWidth: 1, borderColor: datingColors.border, backgroundColor: datingColors.background, gap: 6 }, optionActive: { borderColor: datingColors.primary, backgroundColor: datingColors.accentSoft }, optionIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: datingColors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }, optionIconActive: { backgroundColor: datingColors.primary }, optionTitle: { color: datingColors.text, fontSize: 12, fontWeight: '800' }, optionCopy: { color: datingColors.textSecondary, fontSize: 10, lineHeight: 15 },
  label: { color: datingColors.text, fontSize: 12, fontWeight: '800', marginTop: 3 }, input: { minHeight: 46, borderWidth: 1, borderColor: datingColors.border, borderRadius: datingRadii.md, paddingHorizontal: 12, color: datingColors.text, backgroundColor: datingColors.background, fontSize: 13 }, notes: { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
  primary: { minHeight: 48, borderRadius: datingRadii.pill, backgroundColor: datingColors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 }, primaryText: { color: '#FFF', fontWeight: '900', fontSize: 13 }, previewTitle: { color: datingColors.primary, fontSize: 20, fontWeight: '900' }, previewLine: { color: datingColors.text, fontSize: 13 }, previewNotes: { color: datingColors.textSecondary, fontSize: 12, lineHeight: 18, padding: 10, backgroundColor: datingColors.background, borderRadius: datingRadii.sm },
  notice: { color: datingColors.textSecondary, fontSize: 10, lineHeight: 15, fontStyle: 'italic' }, safety: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: datingSpacing.md, borderRadius: datingRadii.md, backgroundColor: datingColors.surfaceMuted }, flex: { flex: 1, gap: 4 }, safetyTitle: { color: datingColors.text, fontSize: 12, fontWeight: '900' }, safetyCopy: { color: datingColors.textSecondary, fontSize: 11, lineHeight: 17 },
  journeyIntro: { gap: 6 }, timeline: { gap: 0 }, milestone: { flexDirection: 'row', gap: 13, minHeight: 116 }, rail: { width: 40, alignItems: 'center' }, milestoneIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: datingColors.accentSoft, alignItems: 'center', justifyContent: 'center', zIndex: 1 }, connector: { width: 2, flex: 1, minHeight: 68, backgroundColor: datingColors.border, marginVertical: 4 }, milestoneBody: { flex: 1, paddingBottom: 22, gap: 4 }, milestoneNumber: { color: datingColors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, milestoneTitle: { color: datingColors.text, fontSize: 16, fontWeight: '900' }, milestoneSub: { color: datingColors.text, fontSize: 12, fontWeight: '700' }, milestoneCopy: { color: datingColors.textSecondary, fontSize: 11, lineHeight: 17 },
});
