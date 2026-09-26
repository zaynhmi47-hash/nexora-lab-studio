import { createContext, useContext, useState, type PropsWithChildren } from 'react';

type SessionContextValue = { authenticated: boolean };

const SessionContext = createContext<SessionContextValue | null>(null);

export function DatingSessionProvider({ children }: PropsWithChildren) {
  const [authenticated] = useState(false);
  return <SessionContext.Provider value={{ authenticated }}>{children}</SessionContext.Provider>;
}

export function useDatingSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useDatingSession must be used inside DatingSessionProvider');
  return session;
}