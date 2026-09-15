export interface AuthToken {
  value: string;
  expiresAt: number | null;
}

export interface TokenPort {
  getIdToken(forceRefresh?: boolean): Promise<AuthToken | null>;
  clear(): Promise<void>;
}
