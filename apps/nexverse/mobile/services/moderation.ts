export type ModeratorRole = 'reviewer' | 'publisher' | 'admin';
export type ReviewDecision = 'approved' | 'rejected';

export type ModerationChapter = {
  id: string;
  number: number;
  title: string;
  summary: string;
  freePreview: boolean;
  status: 'draft' | 'published';
  content?: string;
};

export type ModerationHistoryEvent = {
  decision: ReviewDecision;
  note: string;
  moderatorRole: ModeratorRole;
  createdAt: string;
};

export type ModerationWork = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  coverImageUrl: string;
  language: string;
  genre: string;
  visibility: string;
  contentRating: string;
  publicationStatus: string;
  reviewStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  reviewNote: string;
  submittedAt: string | null;
  author: { id: string; penName: string; slug: string; verified: boolean };
  chapters: ModerationChapter[];
  reviewHistory: ModerationHistoryEvent[];
};

export type ModerationQueueResponse = {
  items: ModerationWork[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
};

export type ModerationDecisionResponse = {
  workId: string;
  reviewStatus: 'approved' | 'rejected';
  publicationStatus: string;
  reviewedAt: string;
  reviewNote: string;
};

type AccessTokenProvider = () => Promise<string | null>;

/**
 * Nexora Core must install its Firebase ID-token provider after sign-in.
 * The token is held by the auth SDK; this module never persists it.
 */
let accessTokenProvider: AccessTokenProvider | null = null;

export function configureNexverseAccessTokenProvider(provider: AccessTokenProvider | null) {
  accessTokenProvider = provider;
}

export class ModerationApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'ModerationApiError';
    this.status = status;
    this.code = code;
  }
}

function apiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_NEXORA_API_URL?.trim().replace(/\/+$/, '');
  if (!value) throw new ModerationApiError('Alamat Nexora API belum dikonfigurasi.', 0, 'API_NOT_CONFIGURED');
  return value.endsWith('/api/v1') ? value : value + '/api/v1';
}

export async function nexverseApiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!accessTokenProvider) {
    throw new ModerationApiError('Sesi Nexora belum terhubung. Masuk melalui autentikasi Nexora terlebih dahulu.', 401, 'AUTH_PROVIDER_MISSING');
  }
  let token: string | null;
  try {
    token = await accessTokenProvider();
  } catch {
    throw new ModerationApiError(
      'Konfigurasi Firebase Auth belum lengkap atau sesi tidak dapat dibaca.',
      0,
      'AUTH_CONFIGURATION_ERROR',
    );
  }
  if (!token) {
    throw new ModerationApiError('Sesi login tidak tersedia atau sudah berakhir.', 401, 'AUTH_REQUIRED');
  }

  let response: Response;
  try {
    response = await fetch(apiBaseUrl() + path, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new ModerationApiError('Tidak dapat menghubungi Nexora API. Periksa koneksi dan alamat server.', 0, 'NETWORK_ERROR');
  }

  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = typeof payload?.detail === 'string' ? payload.detail : 'Permintaan moderasi gagal.';
    throw new ModerationApiError(message, response.status, typeof payload?.code === 'string' ? payload.code : null);
  }
  return payload as T;
}

export function getModerationQueue(page = 1, pageSize = 20) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  return nexverseApiRequest<ModerationQueueResponse>('/nexverse/moderation/queue/?' + params.toString());
}

export function getModerationWork(workId: string) {
  return nexverseApiRequest<ModerationWork>('/nexverse/moderation/works/' + encodeURIComponent(workId) + '/');
}

export function submitModerationDecision(workId: string, decision: 'approve' | 'reject', note: string) {
  return nexverseApiRequest<ModerationDecisionResponse>(
    '/nexverse/moderation/works/' + encodeURIComponent(workId) + '/decision/',
    { method: 'POST', body: JSON.stringify({ decision, note: note.trim() }) },
  );
}

export function getModerationErrorMessage(error: unknown) {
  if (error instanceof ModerationApiError) {
    if (error.status === 401) return 'Sesi moderator belum tersedia. Silakan masuk melalui Nexora Core.';
    if (error.status === 403) return 'Akun ini tidak memiliki izin untuk tindakan moderasi tersebut.';
    if (error.status === 404) return 'Naskah tidak ditemukan atau sudah tidak tersedia.';
    if (error.status === 409) return error.message;
    return error.message;
  }
  return 'Terjadi kesalahan yang tidak diketahui. Coba lagi.';
}
