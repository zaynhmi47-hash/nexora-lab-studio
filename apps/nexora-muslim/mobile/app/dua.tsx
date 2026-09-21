import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  mockDua,
  nexoraCoreDuaRepository,
  type DuaEntry,
  type DuaPort,
} from '@/lib/dua';

export default function DuaScreen() {
  const { session } = useAuth();

  const repo = useMemo<DuaPort>(
    () =>
      session?.user.provider === 'firebase' && session
        ? nexoraCoreDuaRepository(session)
        : mockDua,
    [session],
  );

  const [data, setData] = useState<DuaEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all([repo.list(), repo.listFavorites()])
      .then(([items, saved]) => {
        if (!active) return;
        setData(items);
        setFavorites(saved.map((item) => item.id));
      })
      .catch(() => {
        if (!active) return;
        setData([]);
        setFavorites([]);
      });

    return () => {
      active = false;
    };
  }, [repo]);

  async function toggle(id: string) {
    try {
      const isActive = await repo.toggleFavorite(id);
      setFavorites((current) =>
        isActive
          ? current.includes(id)
            ? current
            : [...current, id]
          : current.filter((item) => item !== id),
      );
    } catch {
      // Keep the current UI state when persistence fails.
    }
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>DAILY DUAS</Text>

      <Pressable onPress={() => router.push('/dua-favorites')}>
        <Text style={styles.link}>♥ Favorites</Text>
      </Pressable>

      <Text style={styles.heading}>Dua &amp; Supplications</Text>
      <Text style={styles.muted}>
        A source-aware collection for everyday moments.
      </Text>

      {data.map((item) => (
        <Card key={item.id} style={styles.card}>
          <Text style={styles.category}>{item.category.toUpperCase()}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.arabic}>{item.arabic}</Text>
          <Text style={styles.translation}>{item.translation}</Text>
          <Text style={styles.ref}>{item.reference}</Text>

          <Pressable onPress={() => void toggle(item.id)}>
            <Text style={styles.favorite}>
              {favorites.includes(item.id) ? '♥ Saved' : '♡ Save'}
            </Text>
          </Pressable>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  heading: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  card: {
    marginTop: spacing.md,
  },
  category: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  arabic: {
    color: colors.text,
    fontSize: 26,
    textAlign: 'right',
    lineHeight: 44,
    marginTop: spacing.lg,
  },
  translation: {
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  link: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  favorite: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  ref: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: spacing.md,
  },
});
