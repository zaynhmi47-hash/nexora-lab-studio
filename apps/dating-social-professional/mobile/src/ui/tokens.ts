export const datingColors = {
  background: '#F8F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EFED',
  text: '#24212A',
  textSecondary: '#77717D',
  border: '#E9E5E2',
  primary: '#7652A5',
  primaryStrong: '#5D3C8C',
  accent: '#E86F78',
  accentSoft: '#FCEBED',
  success: '#27866B',
  warning: '#B77932',
  danger: '#C34F59',
  overlay: 'rgba(24, 19, 31, 0.48)',
  white: '#FFFFFF',
} as const;

export const datingSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const datingRadii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const datingTypography = {
  title: 30,
  heading: 22,
  subheading: 17,
  body: 15,
  caption: 12,
} as const;

export const datingShadows = {
  card: {
    shadowColor: '#21182B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
} as const;
