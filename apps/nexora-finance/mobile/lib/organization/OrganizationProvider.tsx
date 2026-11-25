import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/lib/auth';
import { useNexoraApi } from '@/lib/api/NexoraApiProvider';

export interface Organization { id: string; name: string; slug: string; status: string; }
export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'CASHIER' | 'MARKETING' | 'STAFF' | 'VIEWER';
export interface OrganizationMembership { id: string; organizationId: string; role: OrganizationRole; status: 'active' | 'suspended' | 'revoked'; }

interface OrganizationContextValue {
  organizations: Organization[];
  activeOrganization: Organization | null;
  activeMembership: OrganizationMembership | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  selectOrganization: (organizationId: string) => Promise<void>;
}

interface ApiMembership { id: string; organization_id: string; role: string; status: OrganizationMembership['status']; }
const ACTIVE_ORGANIZATION_KEY = '@nexora-finance/active-organization-id';
const KNOWN_ROLES = new Set<OrganizationRole>(['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'MARKETING', 'STAFF', 'VIEWER']);
const OrganizationContext = createContext<OrganizationContextValue | null>(null);

function mapMembership(value: ApiMembership): OrganizationMembership {
  const normalizedRole = value.role.toUpperCase();
  return {
    id: value.id,
    organizationId: value.organization_id,
    role: KNOWN_ROLES.has(normalizedRole as OrganizationRole) ? normalizedRole as OrganizationRole : 'STAFF',
    status: value.status,
  };
}

export function OrganizationProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const api = useNexoraApi();
  const operationRef = useRef(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [activeMembership, setActiveMembership] = useState<OrganizationMembership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const verifyAndSelect = useCallback(async (organization: Organization, operation: number) => {
    const response = await api.request<ApiMembership>(`/api/v1/organizations/${encodeURIComponent(organization.id)}/membership/`);
    if (operation !== operationRef.current) return;
    const membership = mapMembership(response.data);
    if (membership.organizationId !== organization.id || membership.status !== 'active') {
      throw new Error('Active membership for the selected organization could not be verified.');
    }
    await AsyncStorage.setItem(ACTIVE_ORGANIZATION_KEY, organization.id);
    if (operation !== operationRef.current) return;
    setActiveOrganization(organization);
    setActiveMembership(membership);
  }, [api]);

  const loadOrganizations = useCallback(async () => {
    const operation = ++operationRef.current;
    if (status === 'unknown' || status === 'authenticating') {
      setLoading(true);
      return;
    }
    if (status !== 'authenticated') {
      setOrganizations([]); setActiveOrganization(null); setActiveMembership(null);
      setError(null); setLoading(false);
      // Keep the last selected ID as a preference only; it is re-verified with
      // the server before it can become the active organization after login.
      return;
    }
    setLoading(true); setError(null);
    setActiveOrganization(null); setActiveMembership(null);
    try {
      const response = await api.request<Organization[]>('/api/v1/organizations/');
      if (operation !== operationRef.current) return;
      const nextOrganizations = response.data;
      setOrganizations(nextOrganizations);
      if (nextOrganizations.length === 0) {
        if (operation === operationRef.current) { setActiveOrganization(null); setActiveMembership(null); }
        return;
      }
      const storedId = await AsyncStorage.getItem(ACTIVE_ORGANIZATION_KEY);
      if (operation !== operationRef.current) return;
      const preferred = nextOrganizations.find((item) => item.id === storedId) ?? nextOrganizations[0];
      await verifyAndSelect(preferred, operation);
    } catch (cause) {
      if (operation !== operationRef.current) return;
      setError(cause instanceof Error ? cause : new Error('Failed to load organizations.'));
      setActiveOrganization(null); setActiveMembership(null);
    } finally {
      if (operation === operationRef.current) setLoading(false);
    }
  }, [api, status, verifyAndSelect]);

  const selectOrganization = useCallback(async (organizationId: string) => {
    const organization = organizations.find((item) => item.id === organizationId);
    if (!organization) throw new Error('The selected organization is not available to this account.');
    const operation = ++operationRef.current;
    setLoading(true); setError(null); setActiveOrganization(null); setActiveMembership(null);
    try {
      await verifyAndSelect(organization, operation);
    } catch (cause) {
      if (operation !== operationRef.current) return;
      const nextError = cause instanceof Error ? cause : new Error('Failed to verify organization membership.');
      setError(nextError); setActiveOrganization(null); setActiveMembership(null);
      throw nextError;
    } finally {
      if (operation === operationRef.current) setLoading(false);
    }
  }, [organizations, verifyAndSelect]);

  useEffect(() => {
    void loadOrganizations();
    return () => { operationRef.current += 1; };
  }, [loadOrganizations]);

  const value = useMemo<OrganizationContextValue>(() => ({
    organizations, activeOrganization, activeMembership, loading, error,
    refresh: loadOrganizations, selectOrganization,
  }), [activeMembership, activeOrganization, error, loadOrganizations, loading, organizations, selectOrganization]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization(): OrganizationContextValue {
  const value = useContext(OrganizationContext);
  if (!value) throw new Error('OrganizationProvider is missing from the component tree.');
  return value;
}
