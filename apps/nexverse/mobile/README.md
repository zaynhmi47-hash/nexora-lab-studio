# Nexverse Mobile

Expo Router reader and creator client for the Nexora platform.

## Runtime configuration

Create `.env` in this directory (next to `package.json`) using `.env.example` as the template:

```dotenv
EXPO_PUBLIC_NEXORA_API_URL=https://<your-api-host>
EXPO_PUBLIC_FIREBASE_API_KEY=<firebase-web-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<firebase-auth-domain>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=nexora-73cfa
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<firebase-storage-bucket>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<firebase-sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<firebase-app-id>
```

- Use the Firebase **client** configuration for the same Firebase project used by Nexora Core. These values are public app configuration, not service-account credentials.
- Enable **Authentication → Sign-in method → Email/Password** in the Firebase console.
- Never place a Firebase service-account JSON, private key, Django secret, or database password in an `EXPO_PUBLIC_*` variable.
- `EXPO_PUBLIC_NEXORA_API_URL` is the API origin only. The app appends `/api/v1`; do not include that suffix.
- For Android emulator access to a backend running on the same host, use `http://10.0.2.2:8000`. For a physical device, use a reachable LAN address or HTTPS tunnel. For Codespaces, use the forwarded API port URL.
- Expo Web calls the API from a browser. Add the exact Expo Web origin to the API's `CORS_ALLOWED_ORIGINS` setting; do not enable wildcard CORS in production.

After changing environment variables, restart Expo with a cleared cache:

```bash
pnpm --filter nexverse-mobile exec expo start -c
```

## Run and validate

From the monorepo root:

```bash
pnpm install
pnpm --filter nexverse-mobile typecheck
pnpm --filter nexverse-mobile exec expo export --platform web
pnpm --filter nexverse-mobile exec expo export --platform android
pnpm --filter nexverse-mobile start
```

Run the API from `services/nexora-api` in its own Python environment. Configure `FIREBASE_PROJECT_ID=nexora-73cfa` and a server-side `FIREBASE_CREDENTIALS_FILE` (or Application Default Credentials). The backend credential must belong to the same Firebase project as the mobile client.

## Phase 1 behavior

- Reader login uses Firebase Email/Password and is separate from Publisher Studio authentication.
- Native Firebase Auth persistence uses AsyncStorage; web uses Firebase browser persistence.
- Chapter requests attach the current Firebase ID token when a user is signed in.
- Public preview chapters can be read without Firebase configuration. Token/session failures are not silently downgraded to anonymous requests.
- Paid chapter access and reading-progress writes are authorized by the Django API using a paid purchase and active, time-valid entitlement. Hiding or showing a lock in the client is not an authorization boundary.
- The app does not offer premium purchases yet. A payment-provider adapter and verified payment webhook are required before purchase checkout can be enabled.

## Manual smoke test

1. Configure both mobile client and API credentials for the same Firebase project.
2. Start the API and mobile app; confirm the catalog and work detail load.
3. Open a free preview while signed out.
4. Sign in with an existing Firebase Email/Password account and confirm the profile shows the authenticated email after a reload.
5. Open a chapter and scroll; close/reopen it and confirm reading progress is restored.
6. For a test paid chapter, create a paid purchase and active entitlement in a non-production test environment. Confirm the entitled account can open it and save progress, while a different account and an expired entitlement receive no chapter content and cannot save progress.
7. Repeat browser checks using the exact web origin configured in API CORS.

CI validates TypeScript, the Metro web export, Django tests, migrations, and dependency boundaries. It cannot verify the live Firebase project, real device persistence, deployment networking, or payment-provider callbacks; those require the manual checks above.
