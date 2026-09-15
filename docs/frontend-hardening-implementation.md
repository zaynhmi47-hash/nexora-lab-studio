# Frontend hardening implementation

Implemented on branch `chore/mobile-foundation-hardening`:

- `.env.example` and local/signing `.gitignore` protection
- centralized `EXPO_PUBLIC_NEXORA_API_URL` configuration
- typed `NexoraApiError`
- normalized API URL joining and JSON error extraction
- stable API/config barrel exports
- explicit mobile feature/component/hooks/auth/config boundaries
- frontend CI for Finance mobile typechecking
- documentation for the frontend foundation and validation checklist

The next product implementation remains Dignity mobile after Finance is locally validated.
