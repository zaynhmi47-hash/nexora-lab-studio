import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme } from './theme';
import { theme as lightTheme, type NexoraTheme } from './tokens';

interface ThemeContextValue {
  mode: 'light' | 'dark';
  theme: NexoraTheme;
  setMode: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>(system === 'dark' ? 'dark' : 'light');
  const value = useMemo(() => ({ mode, theme: mode === 'dark' ? darkTheme : lightTheme, setMode }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider is missing from the component tree.');
  return value;
}
