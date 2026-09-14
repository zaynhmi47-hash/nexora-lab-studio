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

export type OrganizationContextValue = {
  organizations: Organization[];
  activeOrganization: Organization | null;
  activeMembership: OrganizationMembership | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  selectOrganization: (organizationId: string) => Promise<void>;
};
