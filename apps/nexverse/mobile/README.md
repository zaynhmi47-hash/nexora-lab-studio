# Nexverse Mobile

Expo Router reader and creator client for the Nexora platform.

## Phase 1 live setup

Nexverse mobile and the Django API must use the **same Firebase project**: `nexora-73cfa`.

### 1. Firebase client configuration

1. Open Firebase console and select project `nexora-73cfa`.
2. Open Project settings → General → Your apps. Register a Web app for the Nexora client if one does not already exist. Firebase Hosting is not required.
3. Copy the Firebase web app configuration into `apps/nexverse/mobile/.env` (create it from `.env.example`):
   - `apiKey` → `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `EXPO_PUBLIC_FIREBASE_PROJECT_ID` (must be `nexora-73cfa`)
   - `storageBucket` → `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `EXPO_PUBLIC_FIREBASE_APP_ID`
4. In Authentication → Sign-in method, enable **Email/Password**.
5. In Authentication → Settings → Authorized domains, add the exact domain used by Expo Web (for local development, add `localhost`; for hosted web, add its actual hostname).

These Firebase web values identify the client app; they are not Admin SDK credentials. Never put service-account JSON, private keys, Django secrets, or database passwords in `EXPO_PUBLIC_*` variables.

### 2. Firebase Admin credentials for Django

The backend verifies Firebase ID tokens using Firebase Admin. Its project ID must match the mobile client.

1. In Firebase console → Project settings → Service accounts, generate a private key for a dedicated service account with only the required Firebase Authentication permissions.
2. Store the JSON as a Codespaces secret (for example, `NEXORA_FIREBASE_ADMIN_JSON_B64`, containing the base64-encoded JSON). Do not commit or paste this JSON into chat, source code, issues, or logs.
3. In the Codespace terminal, materialize it outside the repository:

```bash
mkdir -p /tmp/nexora-secrets
printf '%s' "$NEXORA_FIREBASE_ADMIN_JSON_B64" | base64 --decode > /tmp/nexora-secrets/firebase-admin.json
chmod 600 /tmp/nexora-secrets/firebase-admin.json
```

4. Set `FIREBASE_CREDENTIALS_FILE=/tmp/nexora-secrets/firebase-admin.json` in `services/nexora-api/.env`, and set `FIREBASE_PROJECT_ID=nexora-73cfa`.
5. On Google Cloud hosting, prefer the platform's attached service identity / Application Default Credentials instead of downloading a long-lived service-account key.

The root `.gitignore` excludes common Firebase service-account filenames and secret directories as an additional safeguard. Keep credentials outside the repository regardless.

### 3. API URL, port forwarding, and CORS

Create `services/nexora-api/.env` from its `.env.example`. Set:

- `FIREBASE_PROJECT_ID=nexora-73cfa`
- `FIREBASE_CREDENTIALS_FILE=/tmp/nexora-secrets/firebase-admin.json` (or leave empty when Application Default Credentials are configured)
- `ALLOWED_HOSTS` to include the actual API host
- `CORS_ALLOWED_ORIGINS` to the exact browser origin serving Nexverse Web, not the API host

Create `apps/nexverse/mobile/.env` from its `.env.example` and set `EXPO_PUBLIC_NEXORA_API_URL` to the API origin only, without `/api/v1`.

For Codespaces, use the forwarded HTTPS URL for port 8000 as the API origin and the forwarded HTTPS URL for the Expo Web port as the CORS origin. The API port must be reachable from the browser; use the narrowest port visibility your test allows, and do not expose database ports. A temporary public API port is suitable only for controlled testing; use a deployed HTTPS API for normal use.

For an Android emulator using a backend on the same host, use `http://10.0.2.2:8000`. For a physical device, use a reachable LAN address or HTTPS tunnel. Never use `localhost` for a physical device's API URL.

### 4. Start and verify

From the monorepo root:

```bash
cp apps/nexverse/mobile/.env.example apps/nexverse/mobile/.env
cp services/nexora-api/.env.example services/nexora-api/.env
```

Edit both local `.env` files with the values above. Then start Django from `services/nexora-api` in its configured Python environment:

```bash
python manage.py check
python manage.py migrate --check
python manage.py runserver 0.0.0.0:8000
```

In another terminal, from the monorepo root:

```bash
pnpm install
pnpm --filter nexverse-mobile exec expo start -c
```

Verify `<API_ORIGIN>/api/v1/health/`; it should report `status: ok` and `checks.database: true`. Then open the Expo Web URL or run the app on Android.

### 5. End-to-end smoke test

1. Confirm the public catalog and work detail load from the Django API.
2. Open a free preview while signed out.
3. Sign in using an existing Firebase Email/Password account and confirm the profile shows the authenticated email after reload.
4. Open a chapter and scroll; close/reopen it and confirm reading progress is restored.
5. For a test paid chapter, create a paid purchase and active entitlement in a non-production environment. Confirm the entitled account can open it and save progress, while a different account and an expired entitlement cannot retrieve content or save progress.
6. Repeat login and chapter access from Expo Web using the configured authorized domain and CORS origin.

CI validates TypeScript, web and Android Metro exports, Django checks, migrations, regression tests, and dependency boundaries. It cannot validate the live Firebase project, Admin credential, Codespaces port reachability, or device persistence; those require the manual checks above.

## Phase 1 behavior and limitations

- Reader login uses Firebase Email/Password and is separate from Publisher Studio authentication.
- Native Firebase Auth persistence uses AsyncStorage; web uses Firebase browser persistence.
- Chapter requests attach the current Firebase ID token when a user is signed in.
- Public preview chapters can be read without Firebase configuration. Token/session failures are not silently downgraded to anonymous requests.
- Paid chapter access and reading-progress writes are authorized by the Django API using a paid purchase and active, time-valid entitlement. Client-side lock states are not an authorization boundary.
- Premium purchases are not enabled in the app. A payment-provider adapter and verified payment webhook are required before checkout can be enabled.
