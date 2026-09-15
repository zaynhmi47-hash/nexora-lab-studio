import { createContext, PropsWithChildren, useContext } from 'react';

export interface Organization {
  id: string;
  name: string;
}

export interface OrganizationMembership {
  status: 'active' | 'inactive' | 'pending';
}

interface OrganizationContextValue {
  organization: Organization | null;
  membership: OrganizationMembership | null;
}

const OrganizationContext = createContext<OrganizationContextValue>({
  organization: null,
  membership: null,
});

export function OrganizationProvider({ children }: PropsWithChildren) {
  return <OrganizationContext.Provider value={{ organization: null, membership: null }}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
