import type { Story, StoryChapter, StoryStatus } from '@/data/catalog';
import { getNexoraCoreAccessToken } from './firebaseAuth';

export type CatalogPage = {
  items: Story[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

export type WorkDetail = Story & {
  chapterList: StoryChapter[];
};

export type ChapterContent = {
  id: string;
  workSlug: string;
  number: number;
  title: string;
  content: string;
  freePreview: boolean;
};

export class NexverseApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'NexverseApiError';
    this.status = status;
    this.code = code;
  }
}

type ApiAuthor = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  avatarUrl: string;
  verified: boolean;
};

type ApiChapter = {
  id: string;
  number: number;
  slug: string;
  title: string;
  summary: string;
  freePreview: boolean;
  publishedAt: string | null;
};

type ApiWork = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  coverImageUrl: string;
  language: string;
  genre: string;
  status: StoryStatus;
  contentRating: string;
  author: ApiAuthor;
  chapterCount: number;
  viewCount: number;
  publishedAt: string | null;
  chapters?: ApiChapter[];
};

type ApiCatalogResponse = {
  items: ApiWork[];
  pagination: CatalogPage['pagination'];
};

function apiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_NEXORA_API_URL?.trim().replace(/\/+$/, '');
  if (!value) {
    throw new NexverseApiError(
      'Nexora API belum dikonfigurasi. Isi EXPO_PUBLIC_NEXORA_API_URL.',
      0,
      'API_NOT_CONFIGURED',
    );
  }
  return value.endsWith('/api/v1') ? value : value + '/api/v1';
}

async function request<T>(path: string, accessToken: string | null = null): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiBaseUrl() + path, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
      },
    });
  } catch {
    throw new NexverseApiError(
      'Tidak dapat menghubungi Nexora API. Periksa koneksi dan alamat server.',
      0,
      'NETWORK_ERROR',
    );
  }

  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new NexverseApiError(
      typeof payload?.detail === 'string' ? payload.detail : 'Permintaan Nexverse gagal.',
      response.status,
      typeof payload?.code === 'string' ? payload.code : null,
    );
  }
  return payload as T;
}

function compactViews(value: number) {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function mapChapter(chapter: ApiChapter): StoryChapter {
  return {
    id: chapter.id,
    number: chapter.number,
    slug: chapter.slug,
    title: chapter.title,
    summary: chapter.summary,
    freePreview: chapter.freePreview,
    publishedAt: chapter.publishedAt,
  };
}

function mapWork(work: ApiWork): Story {
  return {
    id: work.id,
    slug: work.slug,
    title: work.title,
    author: work.author.name,
    genre: work.genre || 'Umum',
    synopsis: work.synopsis,
    cover: work.coverImageUrl,
    chapters: work.chapterCount,
    reads: compactViews(work.viewCount),
    language: work.language,
    contentRating: work.contentRating,
    status: work.status,
    publishedAt: work.publishedAt,
    ...(work.chapters ? { chapterList: work.chapters.map(mapChapter) } : {}),
  };
}

export async function getCatalog(options: {
  query?: string;
  genre?: string;
  language?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<CatalogPage> {
  const params = new URLSearchParams();
  if (options.query?.trim()) params.set('q', options.query.trim());
  if (options.genre?.trim()) params.set('genre', options.genre.trim());
  if (options.language?.trim()) params.set('language', options.language.trim());
  params.set('page', String(options.page ?? 1));
  params.set('page_size', String(options.pageSize ?? 12));
  const response = await request<ApiCatalogResponse>('/nexverse/works/?' + params.toString());
  return {
    items: response.items.map(mapWork),
    pagination: response.pagination,
  };
}

export async function getWorkDetail(slug: string): Promise<WorkDetail> {
  const work = await request<ApiWork>('/nexverse/works/' + encodeURIComponent(slug) + '/');
  const mapped = mapWork(work);
  return { ...mapped, chapterList: mapped.chapterList ?? [] };
}

export async function getChapterContent(slug: string, chapterId: string): Promise<ChapterContent> {
  // Free previews remain available anonymously; signed-in readers send the
  // current Firebase ID token so the API can verify paid chapter entitlements.
  let accessToken: string | null;
  try {
    accessToken = await getNexoraCoreAccessToken();
  } catch (error) {
    // A missing Firebase configuration must not block public free previews.
    // Token refresh/session failures for configured accounts must remain visible
    // instead of silently downgrading a premium reader to anonymous access.
    if (
      error instanceof Error &&
      error.message.includes('Konfigurasi Firebase belum lengkap')
    ) {
      accessToken = null;
    } else {
      throw error;
    }
  }
  return request<ChapterContent>(
    '/nexverse/works/' + encodeURIComponent(slug) + '/chapters/' + encodeURIComponent(chapterId) + '/',
    accessToken,
  );
}

export function getNexverseApiErrorMessage(error: unknown) {
  if (error instanceof NexverseApiError) {
    if (error.code === 'ENTITLEMENT_REQUIRED' || error.status === 403) {
      return 'Bab ini memerlukan akses premium. Isi bab berbayar tidak dikirim oleh server sebelum entitlement tersedia.';
    }
    if (error.status === 404) return 'Cerita atau bab ini tidak ditemukan atau belum dipublikasikan.';
    return error.message;
  }
  return 'Terjadi kesalahan yang tidak diketahui. Coba lagi.';
}
