import { createContext, useContext, type PropsWithChildren } from 'react';

export interface Organization {
  id: string;
  name: string;
}

export interface OrganizationMembership {
  status: 'active' | 'inactive' | 'pending';
}

interface OrganizationContextValue {
  activeOrganization: Organization | null;
  activeMembership: OrganizationMembership | null;
}

const OrganizationContext = createContext<OrganizationContextValue>({
  activeOrganization: null,
  activeMembership: null,
});

export function OrganizationProvider({ children }: PropsWithChildren) {
  return <OrganizationContext.Provider value={{ activeOrganization: null, activeMembership: null }}>{children}</OrganizationContext.Provider>;
}

export function useOrganization(): OrganizationContextValue {
  return useContext(OrganizationContext);
}
