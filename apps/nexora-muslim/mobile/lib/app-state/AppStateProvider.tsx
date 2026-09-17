import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useAuth } from '../auth/AuthProvider';
import { mockAppStateRepository } from './mockAppState';
import type { AppStateSnapshot } from './types';

const AppStateContext = createContext<{
  snapshot: AppStateSnapshot | null;
  loading: boolean;
  refresh: () => Promise<void>;
} | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [snapshot, setSnapshot] = useState<AppStateSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session?.user.id) {
      setSnapshot(null);
      return;
    }

    setLoading(true);
    try {
      setSnapshot(await mockAppStateRepository.getSnapshot(session.user.id));
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ snapshot, loading, refresh }),
    [loading, refresh, snapshot],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
