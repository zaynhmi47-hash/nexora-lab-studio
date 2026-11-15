import type { User as FirebaseUser } from 'firebase/auth';

export interface NexoraWebIdentity {
  id: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

interface IdentityEnvelope {
  data: NexoraWebIdentity;
}

export class NexoraIdentityError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'NexoraIdentityError';
  }
}

export async function resolveNexoraIdentity(user: FirebaseUser): Promise<NexoraWebIdentity> {
  const baseUrl = (import.meta.env.VITE_NEXORA_API_URL || '').replace(/\/$/, '');
  const token = await user.getIdToken();
  const response = await fetch(`${baseUrl}/api/v1/identity/session/`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let detail = 'Nexora Identity could not verify this session.';
    try {
      const payload = await response.json() as { detail?: string };
      if (payload.detail) detail = payload.detail;
    } catch {
      // Keep the generic message when the response body is not JSON.
    }
    throw new NexoraIdentityError(detail, response.status);
  }

  const envelope = await response.json() as IdentityEnvelope;
  if (!envelope.data?.id) {
    throw new NexoraIdentityError('Nexora Identity returned an invalid session payload.', 502);
  }
  return envelope.data;
}
