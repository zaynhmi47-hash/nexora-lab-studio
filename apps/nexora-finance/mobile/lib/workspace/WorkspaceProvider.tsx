import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import type { Workspace } from './types';

interface WorkspaceContextValue {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const value = useMemo(() => ({ activeWorkspace, setActiveWorkspace }), [activeWorkspace]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('WorkspaceProvider is missing from the component tree.');
  return value;
}
