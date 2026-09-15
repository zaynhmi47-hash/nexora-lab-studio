import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container} accessibilityLabel="Loading Nexora Muslim">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
