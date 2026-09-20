export type DignityId = string;

export type ISODateString = string;

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ApiMeta {
  requestId?: string;
  timestamp?: ISODateString;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
  errors?: ApiError[];
}

export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface DignityUserSummary {
  id: DignityId;
  displayName: string;
  avatarUrl?: string;
  role?: string;
}

export interface CourseSummary {
  id: DignityId;
  title: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  level?: string;
  durationMinutes?: number;
  progressPercent?: number;
}

export interface LessonSummary {
  id: DignityId;
  courseId: DignityId;
  moduleId: DignityId;
  title: string;
  type: string;
  durationMinutes?: number;
  xpReward: number;
  status: "locked" | "available" | "in_progress" | "completed";
}

export interface LearningProgress {
  userId: DignityId;
  courseId?: DignityId;
  lessonId?: DignityId;
  progressPercent: number;
  completed: boolean;
  completedAt?: ISODateString;
  updatedAt: ISODateString;
}

export interface XpEvent {
  id: DignityId;
  userId: DignityId;
  sourceType: string;
  sourceId?: DignityId;
  amount: number;
  occurredAt: ISODateString;
  idempotencyKey: string;
}

export interface HealthStatus {
  status: "ok" | "degraded";
  version: string;
  requestId?: string;
}
