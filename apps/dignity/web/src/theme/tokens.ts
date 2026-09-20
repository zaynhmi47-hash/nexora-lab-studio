export const colors = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    secondary: '#7C3AED',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0891B2',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceMuted: '#334155',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#475569',
    primary: '#60A5FA',
    primaryHover: '#93C5FD',
    secondary: '#A78BFA',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#22D3EE',
  },
} as const;

export const typography = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.05)',
  md: '0 4px 12px rgba(15, 23, 42, 0.08)',
  lg: '0 10px 30px rgba(15, 23, 42, 0.12)',
} as const;
