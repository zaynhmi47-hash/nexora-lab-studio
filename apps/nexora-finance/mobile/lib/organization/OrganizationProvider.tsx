import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

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

const ACTIVE_ORGANIZATION_KEY = '@nexora-finance/active-organization-id';
const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const api = useNexoraApi();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [activeMembership, setActiveMembership] = useState<OrganizationMembership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const verifyAndSelect = useCallback(async (organization: Organization) => {
    const response = await api.request<OrganizationMembership>(
      `/api/v1/organizations/${encodeURIComponent(organization.id)}/membership/`,
    );
    setActiveOrganization(organization);
    setActiveMembership(response.data);
    await AsyncStorage.setItem(ACTIVE_ORGANIZATION_KEY, organization.id);
  }, [api]);

  const loadOrganizations = useCallback(async () => {
    if (status !== 'authenticated') {
      setOrganizations([]);
      setActiveOrganization(null);
      setActiveMembership(null);
      await AsyncStorage.removeItem(ACTIVE_ORGANIZATION_KEY);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.request<Organization[]>('/api/v1/organizations/');
      const nextOrganizations = response.data;
      setOrganizations(nextOrganizations);

      if (nextOrganizations.length === 0) {
        setActiveOrganization(null);
        setActiveMembership(null);
        await AsyncStorage.removeItem(ACTIVE_ORGANIZATION_KEY);
        return;
      }

      const storedId = await AsyncStorage.getItem(ACTIVE_ORGANIZATION_KEY);
      const preferred = nextOrganizations.find((item) => item.id === storedId) ?? nextOrganizations[0];

      if (activeOrganization?.id === preferred.id && activeMembership?.status === 'active') return;

      await verifyAndSelect(preferred);
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Failed to load organizations.');
      setError(nextError);
      setActiveOrganization(null);
      setActiveMembership(null);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [activeMembership?.status, activeOrganization?.id, api, status, verifyAndSelect]);

  const selectOrganization = useCallback(async (organizationId: string) => {
    const organization = organizations.find((item) => item.id === organizationId);
    if (!organization) throw new Error('The selected organization is not available to this account.');

    setLoading(true);
    setError(null);
    try {
      await verifyAndSelect(organization);
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Failed to verify organization membership.');
      setError(nextError);
      setActiveOrganization(null);
      setActiveMembership(null);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [organizations, verifyAndSelect]);

  useEffect(() => {
    void loadOrganizations().catch(() => undefined);
  }, [loadOrganizations]);

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
