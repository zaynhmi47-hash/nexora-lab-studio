export type WorkspaceType = 'personal' | 'business';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  currency: 'IDR';
}

export interface WorkspaceMembership {
  workspaceId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'CASHIER' | 'MARKETING' | 'STAFF' | 'VIEWER';
  status: 'active' | 'inactive' | 'pending';
}
