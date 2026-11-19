import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  const { status: authStatus, identity } = useAuth();
  const identityId = identity?.id ?? null;
  const api = useNexoraApi();
  const requestVersion = useRef(0);\n  const lastIdentityId = useRef<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [status, setStatus] = useState<OrganizationLoadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const requestId = ++requestVersion.current;
    const identityChanged = lastIdentityId.current !== identityId;
    lastIdentityId.current = authStatus === 'signed_in' ? identityId : null;
    if (authStatus !== 'signed_in') {
      setOrganizations([]);
      setSelectedOrganizationId(null);
      setStatus('idle');
      setError(null);
      return;
    }

    if (identityChanged) {\n      setOrganizations([]);\n      setSelectedOrganizationId(null);\n    }\n    setStatus('loading');
    setError(null);
    try {
      const response = await api.request<Organization[]>('/api/v1/organizations/');
      if (requestId !== requestVersion.current) return;

      const nextOrganizations = Array.isArray(response.data) ? response.data : [];
      setOrganizations(nextOrganizations);
      setSelectedOrganizationId((current) =>\n        current && nextOrganizations.some((item) => item.id === current)\n          ? current\n          : nextOrganizations[0]?.id ?? null,\n      );
      setStatus('ready');
    } catch (cause) {
      if (requestId !== requestVersion.current) return;
      setError(cause instanceof Error ? cause.message : 'Unable to load organizations.');
      setStatus('error');
    }
  }, [api, authStatus, identityId]);

  useEffect(() => {
    void refresh();
    return () => {
      requestVersion.current += 1;
    };
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
