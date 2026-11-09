import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StoryCard } from '@/components/StoryCard';
import { stories } from '@/data/catalog';
import { palette } from '@/constants/theme';

export default function HomeScreen() {
  const featured = stories[0];
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.eyebrow}>CERITA DIMULAI DI SINI</Text>
          <Text style={styles.brand}>nexverse<Text style={styles.dot}>.</Text></Text>
        </View>
        <Pressable accessibilityLabel="Notifikasi" style={styles.iconButton}><Ionicons name="notifications-outline" size={22} color={palette.ink} /></Pressable>
      </View>
      <Pressable style={styles.search} onPress={() => router.push('/discover')}>
        <Ionicons name="search-outline" size={19} color={palette.muted} />
        <Text style={styles.searchHint}>Cari cerita, penulis, atau genre</Text>
      </Pressable>
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>Temukan cerita{ '\n' }yang tinggal lebih lama.</Text>
        <Text style={styles.welcomeBody}>Dunia baru selalu dimulai dari satu halaman.</Text>
      </View>
      <View style={styles.sectionHeading}>
        <View><Text style={styles.kicker}>PILIHAN EDITOR</Text><Text style={styles.sectionTitle}>Cerita unggulan</Text></View>
        <Pressable onPress={() => router.push('/discover')}><Text style={styles.seeAll}>Lihat semua</Text></Pressable>
      </View>
      <Pressable style={styles.feature} onPress={() => router.push({ pathname: '/work/[slug]', params: { slug: featured.id } })}>
        <Image source={{ uri: featured.cover }} style={styles.featureImage} />
        <View style={styles.featureShade} />
        <View style={styles.featureCopy}>
          <Text style={styles.featureLabel}>NEXVERSE ORIGINAL</Text>
          <Text style={styles.featureTitle}>{featured.title}</Text>
          <Text style={styles.featureAuthor}>oleh {featured.author}</Text>
          <View style={styles.readButton}><Text style={styles.readButtonText}>Mulai membaca</Text><Ionicons name="arrow-forward" color={palette.greenDark} size={15} /></View>
        </View>
      </Pressable>
      <View style={styles.sectionHeading}>
        <View><Text style={styles.kicker}>SESUAI UNTUKMU</Text><Text style={styles.sectionTitle}>Sedang populer</Text></View>
        <Pressable onPress={() => router.push('/discover')}><Text style={styles.seeAll}>Jelajahi</Text></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
        {stories.slice(1).map(story => <StoryCard key={story.id} story={story} />)}
      </ScrollView>
      <View style={styles.footer}><Text style={styles.footerText}>Lebih banyak cerita, lebih banyak dunia.</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  eyebrow: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  brand: { color: palette.ink, fontSize: 27, fontWeight: '900', letterSpacing: -1.2 },
  dot: { color: palette.green },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line },
  search: { height: 48, borderRadius: 14, backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  searchHint: { color: palette.muted, fontSize: 13 },
  welcome: { paddingVertical: 26 },
  welcomeTitle: { color: palette.ink, fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  welcomeBody: { color: palette.muted, fontSize: 13, marginTop: 8 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, marginTop: 4 },
  kicker: { color: palette.green, fontSize: 9, letterSpacing: 1.6, fontWeight: '800' },
  sectionTitle: { color: palette.ink, fontSize: 20, fontWeight: '800', marginTop: 3 },
  seeAll: { color: palette.green, fontWeight: '700', fontSize: 12, paddingBottom: 3 },
  feature: { height: 218, borderRadius: 20, overflow: 'hidden', marginBottom: 28, backgroundColor: palette.greenDark },
  featureImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.62 },
  featureShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,37,28,0.42)' },
  featureCopy: { flex: 1, justifyContent: 'flex-end', padding: 18 },
  featureLabel: { color: '#D5E9DB', fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  featureTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', marginTop: 5 },
  featureAuthor: { color: '#E3EEE6', fontSize: 12, marginTop: 3 },
  readButton: { marginTop: 13, backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
  readButtonText: { color: palette.greenDark, fontSize: 11, fontWeight: '800' },
  footer: { paddingVertical: 26, alignItems: 'center' },
  footerText: { color: palette.muted, fontSize: 11 }
});