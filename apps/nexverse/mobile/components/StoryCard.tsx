import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { palette } from '@/constants/theme';
import type { Story } from '@/data/catalog';

export function StoryCard({ story, horizontal = false }: { story: Story; horizontal?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buka novel ${story.title}`}
      onPress={() => router.push({ pathname: '/work/[slug]', params: { slug: story.slug } })}
      style={[styles.card, horizontal && styles.horizontal]}
    >
      <Image source={{ uri: story.cover }} style={[styles.cover, horizontal && styles.horizontalCover]} />
      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.title}>{story.title}</Text>
        <Text numberOfLines={1} style={styles.author}>{story.author}</Text>
        <View style={styles.meta}>
          <Text style={styles.genre}>{story.genre}</Text>
          <Text style={styles.reads}>{story.reads} baca</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 142, marginRight: 14 },
  horizontal: { width: '100%', flexDirection: 'row', marginRight: 0, marginBottom: 16, alignItems: 'center' },
  cover: { width: 142, height: 190, borderRadius: 14, backgroundColor: palette.mint },
  horizontalCover: { width: 88, height: 116, borderRadius: 12 },
  info: { paddingTop: 9, flex: 1 },
  title: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  author: { color: palette.muted, fontSize: 12, marginTop: 4 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  genre: { color: palette.green, fontSize: 10, fontWeight: '700' },
  reads: { color: palette.muted, fontSize: 10 }
});