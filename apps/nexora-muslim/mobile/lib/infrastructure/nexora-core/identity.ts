import { env } from '@/lib/config/env';
import type { AuthSession, NexoraUser } from '@/lib/auth/types';

export type CurrentIdentity = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  timezone: string;
  locale: string;
  status: string;
};

function getIdentityUrl() {
  return `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/identity/me/`;
}

export async function resolveNexoraIdentity(session: AuthSession): Promise<AuthSession> {
  if (session.user.provider !== 'firebase') return session;

  const response = await fetch(getIdentityUrl(), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Nexora Core identity request failed (${response.status}).`);
  }

  const identity = (await response.json()) as CurrentIdentity;
  const user: NexoraUser = {
    id: identity.id,
    provider: 'firebase',
    providerSubject: session.user.providerSubject,
    email: identity.email ?? undefined,
    displayName: identity.displayName || undefined,
  };

  return { ...session, user };
}
