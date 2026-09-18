import { theme } from './tokens';

export const darkTheme: typeof theme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#0B1220',
    surface: '#111827',
    surfaceMuted: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    muted: '#9CA3AF',
    border: '#374151',
  },
};

export type ThemeMode = 'light' | 'dark';
