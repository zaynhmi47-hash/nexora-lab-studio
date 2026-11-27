# Nexverse Creator Upload Foundation

## Mobile configuration

Nexverse reuses the Firebase default app initialized by Nexora Core. Configure the existing
Expo public Firebase values, including `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, and
`EXPO_PUBLIC_NEXORA_API_URL`. Do not commit service-account credentials or private keys.

Install the Expo SDK 54-compatible document picker from the mobile workspace:

```bash
pnpm --filter nexverse-mobile exec expo install expo-document-picker
pnpm --filter nexverse-mobile typecheck
```

## Django configuration

The API uses the existing lazy Firebase Admin registry. Configure the server environment with
`FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, and either application-default credentials
or a protected `FIREBASE_CREDENTIALS_FILE` path. Never expose the service-account file to the
mobile app or commit it.

Apply migrations from `services/nexora-api` after confirming the migration graph:

```bash
python manage.py showmigrations nexverse
python manage.py migrate nexverse
python manage.py test apps.nexverse.tests.test_upload_api
```

## Upload protocol

1. Authenticated creator requests a session from
   `POST /api/v1/nexverse/creator/works/{work_id}/uploads/`.
2. Django checks work ownership, draft state, Firebase identity link, MIME/extension pair,
   file size (maximum 50 MiB), and creates a 20-minute session.
3. The mobile app uploads directly to Firebase Storage at the returned `storagePath`.
4. Mobile calls `POST /api/v1/nexverse/creator/uploads/{session_id}/complete/`.
5. Django reads the object metadata through the provider-neutral Firebase storage adapter and
   marks the session uploaded only when size and content type match.

The current status `uploaded` means the object has been verified against its session metadata;
it does **not** mean malware scanning, document extraction, moderation, or publication is complete.
Uploaded objects remain private. Reader delivery and publisher access must use a separate
authorization path (for example short-lived signed URLs).

Deploy Storage rules only after confirming the Firebase project and bucket:

```bash
firebase deploy --only storage --project nexora-73cfa
```

## Current limitations

- 50 MiB per file; resumable Firebase Storage upload is enabled on the client.
- Manuscripts: PDF, EPUB, TXT. Covers: JPEG, PNG, WEBP. Attachments: PDF, JPEG, PNG.
- The backend currently verifies object existence, byte size, and declared content type. A later
  processing stage must inspect file signatures, scan malware, extract metadata/pages, and bind
  approved assets to a published work.
- Upload Center is an initial mobile screen; a persistent upload queue, background retry, and
  per-asset history are subsequent work.
