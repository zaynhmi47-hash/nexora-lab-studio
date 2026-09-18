import type { OrganizationRole } from '@/lib/organization';

export type WorkspaceType = 'organization';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  currency: 'IDR';
  slug: string;
  status: string;
}

export interface WorkspaceMembership {
  workspaceId: string;
  role: OrganizationRole;
  status: 'active' | 'suspended' | 'revoked';
}
