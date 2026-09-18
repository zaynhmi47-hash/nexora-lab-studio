import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/lib/auth';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'CASHIER' | 'MARKETING' | 'STAFF' | 'VIEWER';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  role: OrganizationRole;
  status: 'active' | 'suspended' | 'revoked';
}

interface OrganizationContextValue {
  organizations: Organization[];
  activeOrganization: Organization | null;
  activeMembership: OrganizationMembership | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  selectOrganization: (organizationId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const api = useNexoraApi();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [activeMembership, setActiveMembership] = useState<OrganizationMembership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadOrganizations = useCallback(async () => {
    if (status !== 'authenticated') {
      setOrganizations([]);
      setActiveOrganization(null);
      setActiveMembership(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.request<Organization[]>('/api/v1/organizations/');
      const nextOrganizations = response.data;
      setOrganizations(nextOrganizations);

      if (activeOrganization) {
        const stillAvailable = nextOrganizations.find((item) => item.id === activeOrganization.id);
        if (stillAvailable) setActiveOrganization(stillAvailable);
        else {
          setActiveOrganization(null);
          setActiveMembership(null);
        }
      }
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Failed to load organizations.');
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [activeOrganization, api, status]);

  const selectOrganization = useCallback(async (organizationId: string) => {
    const organization = organizations.find((item) => item.id === organizationId);
    if (!organization) throw new Error('The selected organization is not available to this account.');

    setLoading(true);
    setError(null);
    try {
      const response = await api.request<OrganizationMembership>(
        `/api/v1/organizations/${encodeURIComponent(organizationId)}/membership/`,
      );
      setActiveOrganization(organization);
      setActiveMembership(response.data);
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Failed to verify organization membership.');
      setError(nextError);
      setActiveOrganization(null);
      setActiveMembership(null);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [api, organizations]);

  useEffect(() => {
    if (status !== 'authenticated') {
      setOrganizations([]);
      setActiveOrganization(null);
      setActiveMembership(null);
      setError(null);
      return;
    }
    void loadOrganizations().catch(() => undefined);
  }, [loadOrganizations, status]);

  const value = useMemo<OrganizationContextValue>(() => ({
    organizations,
    activeOrganization,
    activeMembership,
    loading,
    error,
    refresh: loadOrganizations,
    selectOrganization,
  }), [activeMembership, activeOrganization, error, loadOrganizations, loading, organizations, selectOrganization]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization(): OrganizationContextValue {
  const value = useContext(OrganizationContext);
  if (!value) throw new Error('OrganizationProvider is missing from the component tree.');
  return value;
}
