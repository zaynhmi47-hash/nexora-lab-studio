export class NexoraApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'NexoraApiError';
    this.status = status;
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof NexoraApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected API error occurred.';
}
