export type CoreErrorCode =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export class CoreClientError extends Error {
  constructor(
    message: string,
    public readonly code: CoreErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'CoreClientError';
  }
}

export function mapCoreStatus(status: number): CoreErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN';
}
