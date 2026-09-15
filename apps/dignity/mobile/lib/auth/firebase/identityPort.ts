import type { NexoraIdentityPort } from '../NexoraIdentityPort';
import type { AuthSession } from '../types';
import type { TokenPort } from '../TokenPort';
import { createNexoraApiClient } from '@/lib/api/client';

interface IdentityResponse {
  id: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

export function createFirebaseNexoraIdentityPort(baseUrl: string): NexoraIdentityPort {
  return {
    async resolveSession(tokenPort: TokenPort): Promise<AuthSession> {
      const token = await tokenPort.getIdToken();
      if (!token) {
        return { status: 'signed_out', identity: null };
      }

      const api = createNexoraApiClient(baseUrl, { tokenPort });
      const response = await api.request<IdentityResponse>('/v1/identity/session/');
      return {
        status: 'signed_in',
        identity: response.data,
      };
    },
  };
}
