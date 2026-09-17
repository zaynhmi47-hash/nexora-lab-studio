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
import { nexoraCoreAppStateRepository } from './repository';
import type { AppStateRepository, AppStateSnapshot } from './types';

const AppStateContext = createContext<{
  snapshot: AppStateSnapshot | null;
  loading: boolean;
  refresh: () => Promise<void>;
} | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [snapshot, setSnapshot] = useState<AppStateSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const repository = useMemo<AppStateRepository | null>(() => {
    if (!session) return null;
    return session.user.provider === 'firebase'
      ? nexoraCoreAppStateRepository(session)
      : mockAppStateRepository;
  }, [session]);

  const refresh = useCallback(async () => {
    if (!session?.user.id || !repository) {
      setSnapshot(null);
      return;
    }

    setLoading(true);
    try {
      setSnapshot(await repository.getSnapshot(session.user.id));
    } finally {
      setLoading(false);
    }
  }, [repository, session?.user.id]);

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
