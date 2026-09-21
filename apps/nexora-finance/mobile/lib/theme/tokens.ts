export interface NexoraThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  primary: string;
  primaryPressed: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface NexoraTheme {
  colors: NexoraThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  typography: {
    display: number;
    title: number;
    heading: number;
    subheading: number;
    body: number;
    label: number;
    caption: number;
  };
  control: {
    minHeight: number;
    icon: number;
  };
  borderWidth: {
    hairline: number;
    strong: number;
  };
}

export const theme: NexoraTheme = {
  colors: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F3F5',
    text: '#111827',
    textSecondary: '#4B5563',
    muted: '#6B7280',
    border: '#E5E7EB',
    primary: '#2563EB',
    primaryPressed: '#1D4ED8',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0891B2',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999,
  },
  typography: {
    display: 32,
    title: 28,
    heading: 22,
    subheading: 18,
    body: 16,
    label: 14,
    caption: 13,
  },
  control: {
    minHeight: 44,
    icon: 22,
  },
  borderWidth: {
    hairline: 1,
    strong: 2,
  },
};
