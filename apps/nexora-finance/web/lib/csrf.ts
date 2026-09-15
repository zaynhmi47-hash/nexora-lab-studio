/**
 * Nexora Finance uses bearer-token authentication against Nexora Core.
 *
 * The previous frontend depended on Laravel Sanctum's cookie/CSRF flow.
 * CSRF bootstrap is intentionally a no-op during the authentication migration;
 * request authorization will be supplied by the Nexora/Firebase token adapter.
 */
export const getXsrfToken = (): string | null => null;

export const ensureCsrfCookie = async (): Promise<void> => undefined;
