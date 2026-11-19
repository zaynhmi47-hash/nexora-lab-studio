import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface OrganizationMembership {
  status: 'active';
}

export type OrganizationLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface OrganizationContextValue {
  organizations: Organization[];
  organization: Organization | null;
  membership: OrganizationMembership | null;
  selectedOrganizationId: string | null;
  status: OrganizationLoadStatus;
  error: string | null;
  selectOrganization(id: string): void;
  refresh(): Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue>({
  organizations: [],
  organization: null,
  membership: null,
  selectedOrganizationId: null,
  status: 'idle',
  error: null,
  selectOrganization() {},
  async refresh() {},
});

export function OrganizationProvider({ children }: PropsWithChildren) {
  const { status: authStatus } = useAuth();
  const api = useNexoraApi();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [status, setStatus] = useState<OrganizationLoadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (authStatus !== 'signed_in') {
      setOrganizations([]);
      setSelectedOrganizationId(null);
      setStatus('idle');
      setError(null);
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const response = await api.request<Organization[]>('/api/v1/organizations/');
      const nextOrganizations = Array.isArray(response.data) ? response.data : [];
      setOrganizations(nextOrganizations);
      setSelectedOrganizationId((current) =>
        current && nextOrganizations.some((item) => item.id === current)
          ? current
          : nextOrganizations[0]?.id ?? null,
      );
      setStatus('ready');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load organizations.');
      setStatus('error');
    }
  }, [api, authStatus]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectOrganization = useCallback((id: string) => {
    if (organizations.some((organization) => organization.id === id)) {
      setSelectedOrganizationId(id);
    }
  }, [organizations]);

  const organization = organizations.find((item) => item.id === selectedOrganizationId) ?? null;
  const value = useMemo<OrganizationContextValue>(() => ({
    organizations,
    organization,
    membership: organization ? { status: 'active' } : null,
    selectedOrganizationId,
    status,
    error,
    selectOrganization,
    refresh,
  }), [organizations, organization, selectedOrganizationId, status, error, selectOrganization, refresh]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  return useContext(OrganizationContext);
}