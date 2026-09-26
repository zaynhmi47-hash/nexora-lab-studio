import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

const TOKEN_KEY = 'nexora.dating.access-token';

type SessionContextValue = { token: string | null; loading: boolean; setToken: (token: string | null) => Promise<void> };

const SessionContext = createContext<SessionContextValue | null>(null);

export function DatingSessionProvider({ children }: PropsWithChildren) {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then(setTokenState).finally(() => setLoading(false));
  }, []);

  const setToken = async (nextToken: string | null) => {
    setTokenState(nextToken);
    if (nextToken) await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  };

  return <SessionContext.Provider value={{ token, loading, setToken }}>{children}</SessionContext.Provider>;
}

export function useDatingSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useDatingSession must be used inside DatingSessionProvider');
  return session;
};
