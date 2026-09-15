'use client';

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { ApiEnvelope } from '@/lib/api/client';
import { useNexoraApi } from '@/lib/api/provider';
import { useFinanceAuth } from '@/lib/auth/FinanceAuthProvider';

export interface OrganizationSummary {
  id: string;
  name: string;
}

export interface MembershipSummary {
  id: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  role?: string | null;
  permissions?: string[];
}

interface OrganizationContextValue {
  organizations: OrganizationSummary[];
  activeOrganization: OrganizationSummary | null;
  activeMembership: MembershipSummary | null;
  loading: boolean;
  setActiveOrganizationId: (organizationId: string | null) => void;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

interface OrganizationPayload {
  organizations: OrganizationSummary[];
  memberships?: MembershipSummary[];
}

export function OrganizationProvider({ children }: PropsWithChildren) {
  const api = useNexoraApi();
  const { user } = useFinanceAuth();
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<MembershipSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setOrganizations([]);
      setMemberships([]);
      setActiveOrganizationId(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    void api
      .request<OrganizationPayload>('/api/v1/me/organizations')
      .then((response: ApiEnvelope<OrganizationPayload>) => {
        if (cancelled) return;
        const nextOrganizations = response.data.organizations ?? [];
        setOrganizations(nextOrganizations);
        setMemberships(response.data.memberships ?? []);
        setActiveOrganizationId((current) =>
          current && nextOrganizations.some((organization) => organization.id === current)
            ? current
            : nextOrganizations[0]?.id ?? null,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setOrganizations([]);
          setMemberships([]);
          setActiveOrganizationId(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, user]);

  const activeOrganization =
    organizations.find((organization) => organization.id === activeOrganizationId) ?? null;
  const activeMembership =
    memberships.find((membership) => membership.id === activeOrganizationId) ?? null;

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrganization,
        activeMembership,
        loading,
        setActiveOrganizationId,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('OrganizationProvider is missing from the application tree.');
  }
  return context;
}
