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
import { useNexoraApi } from '../api/NexoraApiProvider';
import {
  getOrganization,
  getOrganizationMembership,
  getOrganizations,
} from '../api/organizations';
import { getStoredValue, removeStoredValue, setStoredValue } from '../storage';
import type {
  Organization,
  OrganizationContextValue,
  OrganizationMembership,
} from './types';

const ACTIVE_ORGANIZATION_KEY = 'active-organization-id';

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const api = useNexoraApi();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [activeMembership, setActiveMembership] = useState<OrganizationMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(async () => {
    setOrganizations([]);
    setActiveOrganization(null);
    setActiveMembership(null);
    setError(null);
    await removeStoredValue(ACTIVE_ORGANIZATION_KEY);
  }, []);

  const load = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      await reset();
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextOrganizations = await getOrganizations(api);
      const activeOrganizations = nextOrganizations.filter((organization) => organization.status === 'active');

      if (activeOrganizations.length === 0) {
        await reset();
        setLoading(false);
        return;
      }

      setOrganizations(activeOrganizations);
      const storedId = await getStoredValue<string>(ACTIVE_ORGANIZATION_KEY);
      const selected = activeOrganizations.find((organization) => organization.id === storedId) ?? activeOrganizations[0];

      const [organization, membership] = await Promise.all([
        getOrganization(api, selected.id),
        getOrganizationMembership(api, selected.id),
      ]);

      if (organization.status !== 'active' || membership.status !== 'active') {
        const fallback = activeOrganizations.find((item) => item.id !== selected.id);
        if (!fallback) {
          await reset();
          setLoading(false);
          return;
        }
        const [fallbackOrganization, fallbackMembership] = await Promise.all([
          getOrganization(api, fallback.id),
          getOrganizationMembership(api, fallback.id),
        ]);
        if (fallbackOrganization.status !== 'active' || fallbackMembership.status !== 'active') {
          throw new Error('No active organization membership is available.');
        }
        setActiveOrganization(fallbackOrganization);
        setActiveMembership(fallbackMembership);
        await setStoredValue(ACTIVE_ORGANIZATION_KEY, fallbackOrganization.id);
      } else {
        setActiveOrganization(organization);
        setActiveMembership(membership);
        await setStoredValue(ACTIVE_ORGANIZATION_KEY, organization.id);
      }
    } catch (cause) {
      setOrganizations([]);
      setActiveOrganization(null);
      setActiveMembership(null);
      setError(cause instanceof Error ? cause : new Error('Failed to load organizations.'));
    } finally {
      setLoading(false);
    }
  }, [api, authLoading, reset, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectOrganization = useCallback(
    async (organizationId: string) => {
      if (!user) throw new Error('Authentication is required.');
      const organization = organizations.find((item) => item.id === organizationId);
      if (!organization || organization.status !== 'active') {
        throw new Error('The selected organization is not available.');
      }

      const [verifiedOrganization, membership] = await Promise.all([
        getOrganization(api, organization.id),
        getOrganizationMembership(api, organization.id),
      ]);
      if (verifiedOrganization.status !== 'active' || membership.status !== 'active') {
        throw new Error('The selected organization membership is not active.');
      }

      setActiveOrganization(verifiedOrganization);
      setActiveMembership(membership);
      await setStoredValue(ACTIVE_ORGANIZATION_KEY, verifiedOrganization.id);
    },
    [api, organizations, user],
  );

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      activeOrganization,
      activeMembership,
      loading,
      error,
      refresh: load,
      selectOrganization,
    }),
    [activeMembership, activeOrganization, error, load, loading, organizations, selectOrganization],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error('useOrganization must be used inside OrganizationProvider.');
  return context;
}
