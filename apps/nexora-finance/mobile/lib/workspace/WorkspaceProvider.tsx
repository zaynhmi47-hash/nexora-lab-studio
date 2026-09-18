import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { useOrganization } from '@/lib/organization';
import type { Workspace, WorkspaceMembership } from './types';

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeMembership: WorkspaceMembership | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  setActiveWorkspace: (workspace: Workspace | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const organization = useOrganization();

  const workspaces = useMemo<Workspace[]>(
    () => organization.organizations.map((item) => ({
      id: item.id,
      name: item.name,
      type: 'organization',
      currency: 'IDR',
      slug: item.slug,
      status: item.status,
    })),
    [organization.organizations],
  );

  const activeWorkspace = useMemo<Workspace | null>(
    () => organization.activeOrganization
      ? {
          id: organization.activeOrganization.id,
          name: organization.activeOrganization.name,
          type: 'organization',
          currency: 'IDR',
          slug: organization.activeOrganization.slug,
          status: organization.activeOrganization.status,
        }
      : null,
    [organization.activeOrganization],
  );

  const activeMembership = useMemo<WorkspaceMembership | null>(
    () => organization.activeMembership
      ? {
          workspaceId: organization.activeMembership.organizationId,
          role: organization.activeMembership.role,
          status: organization.activeMembership.status,
        }
      : null,
    [organization.activeMembership],
  );

  const value = useMemo<WorkspaceContextValue>(() => ({
    workspaces,
    activeWorkspace,
    activeMembership,
    loading: organization.loading,
    error: organization.error,
    refresh: organization.refresh,
    selectWorkspace: organization.selectOrganization,
    setActiveWorkspace: () => {
      throw new Error('Use selectWorkspace() to select a verified workspace.');
    },
  }), [activeMembership, activeWorkspace, organization.error, organization.loading, organization.refresh, organization.selectOrganization, workspaces]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('WorkspaceProvider is missing from the component tree.');
  return value;
}
