import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme } from './theme';
import { theme as lightTheme, type NexoraTheme } from './tokens';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  theme: NexoraTheme;
  setMode: (mode: ThemeMode) => void;
  ready: boolean;
}

const THEME_MODE_KEY = '@nexora-finance/theme-mode/v1';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(system === 'dark' ? 'dark' : 'light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const restorePreference = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (mounted && isThemeMode(storedMode)) {
          setModeState(storedMode);
        }
      } catch {
        // Keep the system-derived mode when local preferences cannot be read.
      } finally {
        if (mounted) setReady(true);
      }
    };

    void restorePreference();
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void AsyncStorage.setItem(THEME_MODE_KEY, nextMode).catch(() => {
      // The current session still uses the selected mode if persistence fails.
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme: mode === 'dark' ? darkTheme : lightTheme,
      setMode,
      ready,
    }),
    [mode, ready, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider is missing from the component tree.');
  return value;
}
