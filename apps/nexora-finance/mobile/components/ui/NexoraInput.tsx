import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props extends React.ComponentProps<typeof TextInput> {
  label: string;
  error?: string;
}

export const NexoraInput = forwardRef<TextInput, Props>(function NexoraInput({ label, error, ...props }, ref) {
  const { theme } = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput ref={ref} accessibilityLabel={label} placeholderTextColor={theme.colors.muted} {...props} style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: error ? theme.colors.danger : theme.colors.border }]} />
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
});
const styles = StyleSheet.create({ wrapper: { gap: 6 }, label: { fontSize: 14, fontWeight: '600' }, input: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 }, error: { fontSize: 13 } });
