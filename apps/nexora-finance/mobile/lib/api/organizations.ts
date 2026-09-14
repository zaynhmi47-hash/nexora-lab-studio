import type { ApiEnvelope } from './client';
import type { NexoraApi } from './NexoraApiProvider';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export type OrganizationMembership = {
  id: string;
  organization_id: string;
  status: string;
};

export async function getOrganizations(request: NexoraApi): Promise<Organization[]> {
  const response = await request.request<Organization[]>('/api/v1/organizations/');
  return requireData(response, 'organizations');
}

export async function getOrganization(
  request: NexoraApi,
  organizationId: string,
): Promise<Organization> {
  const response = await request.request<Organization>(
    `/api/v1/organizations/${encodeURIComponent(organizationId)}/`,
  );
  return requireData(response, 'organization');
}

export async function getOrganizationMembership(
  request: NexoraApi,
  organizationId: string,
): Promise<OrganizationMembership> {
  const response = await request.request<OrganizationMembership>(
    `/api/v1/organizations/${encodeURIComponent(organizationId)}/membership/`,
  );
  return requireData(response, 'organization membership');
}

function requireData<T>(response: ApiEnvelope<T>, resource: string): T {
  if (!response.success || response.data === null) {
    throw new Error(`Nexora Core returned no ${resource} data.`);
  }
  return response.data;
}
