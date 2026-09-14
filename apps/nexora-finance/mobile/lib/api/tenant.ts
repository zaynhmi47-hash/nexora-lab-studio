import { useCallback, useMemo } from 'react';

import { useNexoraApi } from './NexoraApiProvider';
import { useOrganization } from '../organization/OrganizationProvider';
import type { ApiEnvelope } from './client';

export class TenantContextRequiredError extends Error {
  constructor() {
    super('An active organization is required for this request.');
    this.name = 'TenantContextRequiredError';
  }
}

function normalizeResourcePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function createTenantPath(organizationId: string, resourcePath: string): string {
  const normalized = normalizeResourcePath(resourcePath);
  return `/api/v1/organizations/${encodeURIComponent(organizationId)}${normalized}`;
}

/**
 * API client for organization-owned resources.
 *
 * Tenant-owned endpoints must be nested below the verified organization UUID.
 * The UUID comes from OrganizationProvider, which verifies membership with
 * Nexora Core before exposing the active tenant.
 */
export function useTenantApi() {
  const api = useNexoraApi();
  const { activeOrganization, activeMembership } = useOrganization();

  const organizationId = activeOrganization?.id ?? null;
  const membershipActive = activeMembership?.status === 'active';

  const request = useCallback(
    async <T>(resourcePath: string, init?: RequestInit): Promise<ApiEnvelope<T>> => {
      if (!organizationId || !membershipActive) {
        throw new TenantContextRequiredError();
      }

      return api.request<T>(createTenantPath(organizationId, resourcePath), init);
    },
    [api, membershipActive, organizationId],
  );

  return useMemo(
    () => ({
      request,
      organizationId,
      ready: Boolean(organizationId && membershipActive),
    }),
    [membershipActive, organizationId, request],
  );
}
