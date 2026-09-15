import { createContext, useContext, type PropsWithChildren } from 'react';

export interface OrganizationSummary {
  id: string;
  name: string;
}

export interface MembershipSummary {
  id: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
}

interface OrganizationContextValue {
  activeOrganization: OrganizationSummary | null;
  activeMembership: MembershipSummary | null;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: PropsWithChildren) {
  // Authentication and server-verified organization selection are intentionally
  // implemented in the next frontend phase. Never trust a client-only tenant ID.
  return (
    <OrganizationContext.Provider
      value={{ activeOrganization: null, activeMembership: null }}
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
